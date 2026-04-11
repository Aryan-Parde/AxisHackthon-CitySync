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

class AIService {
  // Classify complaint using Gemini
  static async classifyComplaint(text, imageBase64 = null) {
    try {
      if (!model) {
        return this.fallbackClassification(text);
      }

      const prompt = `You are a civic complaint classifier for an Indian smart city platform called CitySync.

Given the following citizen complaint, analyze it and return a JSON response.

Categories (choose exactly one):
- pothole: Road potholes, craters, broken roads
- garbage: Waste, trash, littering, dumping
- streetlight: Non-working street lights, broken lamps
- water_supply: Water shortage, contamination, pipe burst
- sewage: Blocked drains, sewage overflow, manhole issues
- road_damage: Broken footpaths, damaged dividers, road cracks
- noise: Noise pollution, loud construction
- illegal_construction: Unauthorized buildings, encroachment
- traffic: Signal issues, parking violations, road blockage
- drainage: Waterlogging, flooding, blocked drainage
- other: Anything else

Return ONLY valid JSON (no markdown, no code blocks):
{
  "category": "one_of_the_above",
  "confidence": 0.0 to 1.0,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "suggestedTitle": "A short descriptive title",
  "severity": "critical|high|medium|low",
  "summary": "One line summary"
}

Complaint: "${text}"`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse JSON from response (handle potential markdown wrapping)
      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);
      return {
        success: true,
        ...parsed
      };
    } catch (error) {
      console.error('AI Classification error:', error.message);
      return this.fallbackClassification(text);
    }
  }

  // Fallback keyword-based classification
  static fallbackClassification(text) {
    const lower = text.toLowerCase();
    const categoryKeywords = {
      pothole: ['pothole', 'pit', 'hole', 'crater', 'bump', 'road broken'],
      garbage: ['garbage', 'trash', 'waste', 'dump', 'litter', 'dustbin', 'rubbish', 'debris'],
      streetlight: ['streetlight', 'street light', 'lamp', 'bulb', 'dark road', 'no light'],
      water_supply: ['water', 'tap', 'pipeline', 'water supply', 'drinking water', 'pipe burst', 'leakage'],
      sewage: ['sewage', 'sewer', 'manhole', 'drain smell', 'gutter', 'nala', 'sewerage'],
      road_damage: ['road damage', 'footpath', 'divider', 'broken road', 'crack', 'pavement'],
      noise: ['noise', 'loud', 'construction noise', 'honking', 'music'],
      illegal_construction: ['illegal', 'unauthorized', 'encroachment', 'building violation'],
      traffic: ['traffic', 'signal', 'parking', 'jam', 'blockage', 'zebra crossing'],
      drainage: ['waterlog', 'flood', 'drainage', 'water stagnant', 'rain water']
    };

    let bestCategory = 'other';
    let maxMatches = 0;
    const foundKeywords = [];

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(kw => lower.includes(kw));
      if (matches.length > maxMatches) {
        maxMatches = matches.length;
        bestCategory = category;
        foundKeywords.push(...matches);
      }
    }

    return {
      success: true,
      category: bestCategory,
      confidence: maxMatches > 0 ? Math.min(0.5 + maxMatches * 0.15, 0.9) : 0.3,
      keywords: foundKeywords.slice(0, 5),
      suggestedTitle: `${bestCategory.replace('_', ' ')} issue reported`,
      severity: 'medium',
      summary: text.substring(0, 100)
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
