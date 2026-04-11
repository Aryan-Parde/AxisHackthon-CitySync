const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');

let genAI;
let model;

try {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
} catch (error) {
  console.warn('⚠️ Gemini AI not configured. Using fallback classification.');
}

// Issue type to department mapping (strict — NO "Other" catch-all)
const ISSUE_DEPARTMENT_MAP = {
  'Garbage': 'Solid Waste Management',
  'Water Leakage': 'Public Health Engineering Department',
  'Road Damage': 'Public Work Department',
  'Electricity Issue': 'Electrical Department',
  'Encroachment': 'Encroachment Department',
  'Environment Issue': 'Environment Department',
  'Fire Hazard': 'Fire Department',
  'Health Issue': 'Health Department (Medicine)',
  'Tax Issue': 'Revenue Department',
  'Transport Issue': 'Transport Department'
};

// Map new issue types to legacy category codes for backward compat
const ISSUE_TO_CATEGORY = {
  'Garbage': 'garbage',
  'Water Leakage': 'water_supply',
  'Road Damage': 'road_damage',
  'Electricity Issue': 'streetlight',
  'Encroachment': 'illegal_construction',
  'Environment Issue': 'noise',
  'Fire Hazard': 'other',
  'Health Issue': 'other',
  'Tax Issue': 'other',
  'Transport Issue': 'traffic'
};

// Keyword normalization map (synonyms → canonical form)
const KEYWORD_NORMALIZE = {
  trash: 'garbage', waste: 'garbage', litter: 'garbage', dump: 'garbage', rubbish: 'garbage', debris: 'garbage', dustbin: 'garbage',
  leak: 'water', overflow: 'water', 'pipe burst': 'water', drainage: 'water', sewage: 'water', sewer: 'water', manhole: 'water', gutter: 'water',
  crack: 'pothole', 'broken road': 'pothole', 'damaged street': 'pothole', pit: 'pothole', crater: 'pothole', footpath: 'pothole', pavement: 'pothole',
  wire: 'electricity', cable: 'electricity', pole: 'electricity', streetlight: 'electricity', transformer: 'electricity', bulb: 'electricity',
  'illegal structure': 'encroachment', blockage: 'encroachment', obstruction: 'encroachment', hawker: 'encroachment', unauthorized: 'encroachment',
  pollution: 'pollution', smoke: 'pollution', 'dirty air': 'pollution', noise: 'pollution', honking: 'pollution',
  flames: 'fire', burning: 'fire', blaze: 'fire', inflammable: 'fire',
  medical: 'health', illness: 'health', sick: 'health', disease: 'health', mosquito: 'health', dengue: 'health', malaria: 'health',
  'property tax': 'tax', bill: 'tax', assessment: 'tax', revenue: 'tax',
  traffic: 'traffic', congestion: 'traffic', vehicles: 'traffic', parking: 'traffic', signal: 'traffic', jam: 'traffic', bus: 'traffic'
};

class AIService {

  // ─── Enhanced system prompt v2 with normalization, refinement, self-validation ───
  static get CLASSIFICATION_PROMPT() {
    return `You are an AI system that analyzes civic issue images and routes them to the correct municipal department with high accuracy.

Your task:
1. Identify the issue in the image or text
2. Extract keywords
3. Normalize keywords to standard forms
4. Refine and validate the interpretation
5. Classify the issue
6. Map to the correct department

---

## Step 1: Extract and Normalize Keywords (MANDATORY)

Extract 3–6 keywords and convert them into STANDARD (canonical) keywords:

Garbage:
trash, waste, litter, dump → garbage

Water Leakage:
leak, overflow, pipe burst, drainage → water

Road Damage:
crack, broken road, damaged street → pothole

Electricity Issue:
wire, cable, pole, streetlight, transformer → electricity

Encroachment:
illegal structure, blockage, obstruction → encroachment

Environment Issue:
pollution, smoke, dirty air → pollution

Fire Hazard:
flames, burning → fire

Health Issue:
medical, illness, sick → health

Transport Issue:
traffic, congestion, vehicles → traffic

Tax Issue:
property tax, bill → tax

IMPORTANT:
- ONLY output normalized keywords (e.g., "garbage", not "trash")

---

## Step 2: Context Refinement (VERY IMPORTANT)

Before classification:
- Re-evaluate the image using extracted keywords
- Check if multiple issues are present
- Identify the PRIMARY issue only
- Ignore weak or unrelated signals
- If keywords conflict, prioritize the most visible/severe issue

---

## Step 3: Issue Type Classification (STRICT)

Choose ONLY one:
- Garbage
- Water Leakage
- Road Damage
- Electricity Issue
- Encroachment
- Environment Issue
- Fire Hazard
- Health Issue
- Tax Issue
- Transport Issue
- Other

---

## Step 4: Department Mapping (STRICT)

Garbage → Solid Waste Management
Water Leakage → Public Health Engineering Department
Road Damage → Public Work Department
Electricity Issue → Electrical Department
Encroachment → Encroachment Department
Environment Issue → Environment Department
Fire Hazard → Fire Department
Health Issue → Health Department (Medicine)
Tax Issue → Revenue Department
Transport Issue → Transport Department
Other → NONE (set department to "Unclassified")

---

## Step 5: Self-Validation (CRITICAL)

Before final output:
- Ensure keywords align with issue_type
- Ensure issue_type correctly maps to department
- If mismatch detected → correct it
- If uncertainty remains → set issue_type = "Other"

---

## Step 6: Confidence Scoring

- High clarity (clear visible issue) → 0.75–0.95
- Moderate clarity → 0.6–0.75
- Low clarity / ambiguity → below 0.6

---

## Step 7: Output (STRICT JSON ONLY)

{
  "keywords": ["k1", "k2", "k3"],
  "issue_type": "IssueType",
  "department": "DepartmentName",
  "confidence": 0.0
}

---

## Rules (MANDATORY)
- DO NOT output anything except JSON
- DO NOT include explanations
- DO NOT use raw synonyms — only normalized keywords
- DO NOT invent categories or departments
- ALWAYS refine before deciding
- If unsure → issue_type = "Other"
- If issue_type is "Other" → department = "Unclassified"`;
  }

  // ─── Classify complaint from text (+ optional image) ───
  static async classifyComplaint(text, imageBase64 = null) {
    try {
      if (!model) {
        return this.fallbackClassification(text);
      }

      // If an image is provided, use image-based classification
      if (imageBase64) {
        return this.classifyComplaintImage(text, imageBase64);
      }

      const prompt = `${this.CLASSIFICATION_PROMPT}

Citizen complaint text: "${text}"`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const parsed = JSON.parse(jsonStr);
      return this._buildResult(parsed, text);
    } catch (error) {
      console.error('AI Classification error:', error.message);
      return this.fallbackClassification(text);
    }
  }

  // ─── Classify complaint from image using Gemini vision ───
  static async classifyComplaintImage(text, imageBase64) {
    try {
      if (!model) {
        return this.fallbackClassification(text);
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const parts = [
        { text: `${this.CLASSIFICATION_PROMPT}\n\nCitizen complaint text: "${text || 'See attached image'}"` },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        }
      ];

      const result = await model.generateContent(parts);
      const response = result.response.text();

      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const parsed = JSON.parse(jsonStr);
      return this._buildResult(parsed, text || 'Image-based classification');
    } catch (error) {
      console.error('AI Image Classification error:', error.message);
      return this.fallbackClassification(text || 'image complaint');
    }
  }

  // ─── Build a standardized result, flagging unclassifiable complaints ───
  static _buildResult(parsed, text) {
    const issueType = parsed.issue_type;
    const isUnclassified = issueType === 'Other' || !ISSUE_DEPARTMENT_MAP[issueType];
    const department = isUnclassified ? null : ISSUE_DEPARTMENT_MAP[issueType];
    const category = isUnclassified ? 'other' : (ISSUE_TO_CATEGORY[issueType] || 'other');
    const confidence = parsed.confidence || 0;

    // Normalize keywords using the canonical map
    const normalizedKeywords = (parsed.keywords || []).map(kw => {
      const lower = kw.toLowerCase();
      return KEYWORD_NORMALIZE[lower] || lower;
    });
    // Deduplicate
    const uniqueKeywords = [...new Set(normalizedKeywords)];

    return {
      success: true,
      needsMoreInfo: isUnclassified,
      category,
      issue_type: issueType,
      department,
      confidence,
      keywords: uniqueKeywords.slice(0, 6),
      suggestedTitle: isUnclassified ? null : `${issueType} reported`,
      severity: confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low',
      summary: text ? text.substring(0, 100) : ''
    };
  }

  // ─── Fallback keyword-based classification (uses new issue types) ───
  static fallbackClassification(text) {
    const lower = (text || '').toLowerCase();
    const issueKeywords = {
      'Garbage': ['garbage', 'trash', 'waste', 'dump', 'litter', 'dustbin', 'rubbish', 'debris'],
      'Water Leakage': ['water', 'tap', 'pipeline', 'water supply', 'drinking water', 'pipe burst', 'leakage', 'sewage', 'sewer', 'manhole', 'drain', 'gutter', 'sewerage'],
      'Road Damage': ['pothole', 'pit', 'hole', 'crater', 'road damage', 'footpath', 'divider', 'broken road', 'crack', 'pavement', 'road broken'],
      'Electricity Issue': ['streetlight', 'street light', 'lamp', 'bulb', 'dark road', 'no light', 'electric', 'power', 'wire', 'transformer'],
      'Encroachment': ['illegal', 'unauthorized', 'encroachment', 'building violation', 'hawker'],
      'Environment Issue': ['noise', 'loud', 'pollution', 'honking', 'tree', 'deforestation', 'smoke', 'air quality'],
      'Fire Hazard': ['fire', 'blaze', 'burn', 'inflammable', 'smoke', 'hazard'],
      'Health Issue': ['disease', 'epidemic', 'mosquito', 'dengue', 'malaria', 'hospital', 'medical'],
      'Tax Issue': ['tax', 'revenue', 'property tax', 'bill', 'assessment'],
      'Transport Issue': ['traffic', 'signal', 'parking', 'jam', 'blockage', 'bus', 'transport', 'zebra crossing', 'road blockage']
    };

    let bestIssue = null;
    let maxMatches = 0;
    const foundKeywords = [];

    for (const [issueType, keywords] of Object.entries(issueKeywords)) {
      const matches = keywords.filter(kw => lower.includes(kw));
      if (matches.length > maxMatches) {
        maxMatches = matches.length;
        bestIssue = issueType;
        foundKeywords.length = 0;
        foundKeywords.push(...matches);
      }
    }

    const isUnclassified = !bestIssue || maxMatches === 0;
    const department = isUnclassified ? null : ISSUE_DEPARTMENT_MAP[bestIssue];
    const category = isUnclassified ? 'other' : (ISSUE_TO_CATEGORY[bestIssue] || 'other');
    const confidence = maxMatches > 0 ? Math.min(0.5 + maxMatches * 0.15, 0.9) : 0.2;

    // Normalize found keywords
    const normalizedKeywords = foundKeywords.map(kw => KEYWORD_NORMALIZE[kw] || kw);
    const uniqueKeywords = [...new Set(normalizedKeywords)];

    return {
      success: true,
      needsMoreInfo: isUnclassified,
      category,
      issue_type: bestIssue || 'Other',
      department,
      confidence,
      keywords: uniqueKeywords.slice(0, 6),
      suggestedTitle: isUnclassified ? null : `${bestIssue} reported`,
      severity: confidence >= 0.7 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
      summary: text ? text.substring(0, 100) : ''
    };
  }

  // Generate embedding for text (for duplicate detection)
  static async generateEmbedding(text) {
    try {
      if (!genAI) {
        return this.simpleTFIDF(text);
      }

      const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Embedding error:', error.message);
      return this.simpleTFIDF(text);
    }
  }

  // Simple TF-IDF fallback for embeddings
  static simpleTFIDF(text) {
    const words = text.toLowerCase().split(/\s+/);
    const vocab = {};
    words.forEach(w => {
      vocab[w] = (vocab[w] || 0) + 1;
    });
    // Create a simple 50-dimensional vector from word hashes
    const vector = new Array(50).fill(0);
    Object.entries(vocab).forEach(([word, count]) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
      }
      const idx = Math.abs(hash) % 50;
      vector[idx] += count;
    });
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => v / magnitude);
  }

  // Generate PIL draft
  static async generatePILDraft(complaint, escalations) {
    try {
      if (!model) {
        return this.fallbackPILDraft(complaint, escalations);
      }

      const prompt = `Generate a formal Public Interest Litigation (PIL) draft for the following unresolved civic complaint in India.

Complaint Details:
- Ticket ID: ${complaint.ticketId}
- Category: ${complaint.category}
- Description: ${complaint.description}
- Location: ${complaint.location.address}
- Filed on: ${complaint.createdAt}
- Current Status: ${complaint.status}
- Escalation Level: ${complaint.escalationLevel}
- Number of similar reports: ${complaint.duplicateCount}

Escalation History:
${escalations.map(e => `- Level ${e.fromLevel}→${e.toLevel}: ${e.reason} (${e.escalatedAt})`).join('\n')}

Generate a formal PIL draft addressing the municipal authorities. Include reference to relevant laws and citizen rights.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return this.fallbackPILDraft(complaint, escalations);
    }
  }

  static fallbackPILDraft(complaint, escalations) {
    return `
PUBLIC INTEREST LITIGATION DRAFT
================================

IN THE HIGH COURT OF ____________

WRIT PETITION (CIVIL) NO. _____/2026

IN THE MATTER OF:
Citizens of ${complaint.location.address || 'the affected area'}  ...Petitioner(s)

VERSUS

Municipal Corporation / Local Authority  ...Respondent(s)

SUBJECT: Non-redressal of Civic Complaint - ${complaint.category.replace('_', ' ').toUpperCase()}

Ticket Reference: ${complaint.ticketId}
Date of Filing: ${new Date(complaint.createdAt).toLocaleDateString()}
Number of Affected Citizens: ${complaint.duplicateCount}

FACTS OF THE CASE:
1. The petitioner(s) filed a complaint regarding "${complaint.description}" at ${complaint.location.address}.
2. Despite multiple escalations (${escalations.length} levels), the authorities have failed to address the issue.
3. This constitutes a violation of citizens' fundamental rights under Article 21 of the Constitution of India.

PRAYER:
The petitioner(s) most respectfully pray that this Hon'ble Court may be pleased to:
a) Direct the respondent authorities to take immediate action
b) Award compensation for the inconvenience caused
c) Pass such further orders as deemed fit

Date: ${new Date().toLocaleDateString()}
Place: ____________
    `.trim();
  }

  // Compare complaint photo vs resolution photo using Gemini 2.0 Flash
  static async comparePhotos(complaintPhotoBase64, resolutionPhotoBase64, description) {
    try {
      if (!model) {
        return this.fallbackPhotoComparison();
      }

      const parts = [
        {
          text: `You are a civic complaint verification AI. An officer claims to have resolved a complaint. Compare the BEFORE (complaint) photo and AFTER (resolution) photo.

Complaint description: "${description}"

Analyze both photos and determine:
1. Is the issue described in the complaint visible in the BEFORE photo?
2. Does the AFTER photo show that the issue has been fixed/resolved?
3. How confident are you that the resolution is genuine?

Return ONLY valid JSON (no markdown, no code blocks):
{
  "verified": true or false,
  "score": 0 to 100 (confidence that issue is resolved),
  "analysis": "One paragraph summary of your comparison",
  "beforeDescription": "What you see in the before photo",
  "afterDescription": "What you see in the after photo"
}`
        }
      ];

      // Add complaint photo if available
      if (complaintPhotoBase64) {
        const cleanBase64 = complaintPhotoBase64.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        });
        parts.push({ text: 'BEFORE photo (complaint):' });
      }

      // Add resolution photo
      if (resolutionPhotoBase64) {
        const cleanBase64 = resolutionPhotoBase64.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        });
        parts.push({ text: 'AFTER photo (resolution):' });
      }

      const result = await model.generateContent(parts);
      const response = result.response.text();

      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);
      return {
        success: true,
        verified: parsed.verified || false,
        score: Math.min(100, Math.max(0, parsed.score || 0)),
        analysis: parsed.analysis || 'Unable to compare photos.',
        beforeDescription: parsed.beforeDescription || '',
        afterDescription: parsed.afterDescription || ''
      };
    } catch (error) {
      console.error('Photo comparison error:', error.message);
      return this.fallbackPhotoComparison();
    }
  }

  static fallbackPhotoComparison() {
    return {
      success: true,
      verified: true,
      score: 70,
      analysis: 'AI photo comparison unavailable. Resolution accepted based on officer report. Manual verification recommended.',
      beforeDescription: 'Photo analysis unavailable',
      afterDescription: 'Photo analysis unavailable'
    };
  }
}

module.exports = AIService;
