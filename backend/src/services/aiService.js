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

// ═══════════════════════════════════════════════════════════════
//  DEPARTMENT ROUTING MAP — All 30 Municipal Departments
// ═══════════════════════════════════════════════════════════════
const DEPARTMENTS = {
  // ── Core civic infrastructure ──
  'Garbage':                { dept: 'Solid Waste Management',                category: 'garbage' },
  'Water Leakage':          { dept: 'Public Health Engineering Department',  category: 'water_supply' },
  'Road Damage':            { dept: 'Public Work Department',               category: 'road_damage' },
  'Electricity Issue':      { dept: 'Electrical Department',                category: 'streetlight' },
  'Encroachment':           { dept: 'Encroachment Department',              category: 'illegal_construction' },
  'Environment Issue':      { dept: 'Environment Department',               category: 'noise' },
  'Fire Hazard':            { dept: 'Fire Department',                      category: 'fire' },
  'Health Issue':           { dept: 'Health Department (Medicine)',          category: 'health' },
  'Transport Issue':        { dept: 'Transport Department',                 category: 'traffic' },
  // ── Revenue & Tax ──
  'Property Tax':           { dept: 'Revenue Department',                   category: 'tax' },
  'LBT/Octroi':             { dept: 'LBT',                                  category: 'tax' },
  'Audit Issue':            { dept: 'Revenue And Audit Department',         category: 'tax' },
  // ── Parks & Gardens ──
  'Garden Issue':           { dept: 'Garden Department',                    category: 'garden' },
  // ── Property & Land ──
  'Estate Issue':           { dept: 'Estate Department',                    category: 'estate' },
  'Town Planning':          { dept: 'Town Planning Department',             category: 'town_planning' },
  // ── Market & Trade ──
  'Market Issue':           { dept: 'Market Department',                    category: 'market' },
  'Signage Issue':          { dept: 'Skysign & Advertisement Department',   category: 'signage' },
  // ── Social & Welfare ──
  'Social Welfare':         { dept: 'Social Welfare Department',            category: 'welfare' },
  'Education Issue':        { dept: 'Education Department',                 category: 'education' },
  'Cultural Issue':         { dept: 'Cultural And Sports Department',       category: 'cultural' },
  // ── Records & Admin ──
  'Birth/Death Certificate':{ dept: 'Birth and Death Registration Department', category: 'records' },
  'Records Request':        { dept: 'Central Records Department',           category: 'records' },
  'General Administration': { dept: 'General Administration Department',    category: 'general' },
  // ── Finance & Law ──
  'Finance Issue':          { dept: 'Accounts and Finance Department',      category: 'finance' },
  'Legal Issue':            { dept: 'Law Department',                       category: 'legal' },
  // ── Public Communication ──
  'Public Relations':       { dept: 'Public Relations Department',          category: 'pr' },
  'IT Issue':               { dept: 'Department Of Information And Technology', category: 'it' },
  // ── Infrastructure & Machinery ──
  'Road Construction':      { dept: 'Hot Mix Plant Department',             category: 'road_damage' },
  'Workshop/Vehicle':       { dept: 'Workshop Department',                  category: 'workshop' },
  // ── Elections ──
  'Election Issue':         { dept: 'Election Department',                  category: 'election' },
};

// ═══════════════════════════════════════════════════════════════
//  CANONICAL KEYWORD MAP (raw synonym → standard token)
// ═══════════════════════════════════════════════════════════════
const CANONICAL = {
  // Garbage / Solid Waste
  trash:'garbage', waste:'garbage', litter:'garbage', dump:'garbage', rubbish:'garbage',
  debris:'garbage', dustbin:'garbage', 'garbage bin':'garbage',
  // Water / PHED
  leak:'water', overflow:'water', 'pipe burst':'water', drainage:'water', sewage:'water',
  sewer:'water', manhole:'water', gutter:'water', tap:'water', pipeline:'water',
  // Road / PWD
  crack:'pothole', 'broken road':'pothole', 'damaged street':'pothole', pit:'pothole',
  crater:'pothole', footpath:'pothole', pavement:'pothole', pothole:'pothole',
  // Electricity
  wire:'electricity', cable:'electricity', pole:'electricity', streetlight:'electricity',
  transformer:'electricity', bulb:'electricity', 'dark road':'electricity',
  // Encroachment
  'illegal structure':'encroachment', blockage:'encroachment', obstruction:'encroachment',
  hawker:'encroachment', unauthorized:'encroachment',
  // Environment
  pollution:'pollution', smoke:'pollution', 'dirty air':'pollution', noise:'pollution',
  honking:'pollution', deforestation:'pollution',
  // Fire
  flames:'fire', burning:'fire', blaze:'fire', inflammable:'fire',
  // Health
  medical:'health', illness:'health', sick:'health', disease:'health',
  mosquito:'health', dengue:'health', malaria:'health',
  // Transport
  traffic:'traffic', congestion:'traffic', vehicles:'traffic', parking:'traffic',
  signal:'traffic', jam:'traffic',
  // Tax / Revenue
  'property tax':'tax', bill:'tax', assessment:'tax', octroi:'tax', lbt:'tax',
  // Garden / Parks
  garden:'garden', park:'garden', tree:'garden', 'fallen tree':'garden', playground:'garden',
  // Estate / Land
  property:'estate', land:'estate', 'land dispute':'estate', plot:'estate',
  // Town Planning
  'building permission':'planning', 'illegal building':'planning', construction:'planning',
  // Market
  market:'market', vendor:'market', shop:'market', 'trade license':'market',
  // Signage / Advertisement
  hoarding:'signage', banner:'signage', advertisement:'signage', billboard:'signage',
  // Social Welfare
  pension:'welfare', ration:'welfare', welfare:'welfare', shelter:'welfare',
  // Education
  school:'education', 'school building':'education', education:'education',
  // Cultural / Sports
  sports:'cultural', 'sports ground':'cultural', festival:'cultural', cultural:'cultural',
  // Birth / Death
  'birth certificate':'certificate', 'death certificate':'certificate', birth:'certificate', death:'certificate',
  // Records
  records:'records', rti:'records', 'information request':'records',
  // Finance
  accounts:'finance', salary:'finance', budget:'finance',
  // Legal
  legal:'legal', court:'legal', 'legal notice':'legal',
  // Road construction / Hot Mix
  asphalt:'road_construction', tar:'road_construction', resurfacing:'road_construction',
  // Workshop
  vehicle:'workshop', machinery:'workshop',
  // IT
  website:'it', app:'it', software:'it', portal:'it',
  // Election
  election:'election', voting:'election', 'voter id':'election', booth:'election',
  // Public Relations
  complaint:'pr', grievance:'pr',
};

class AIService {

  // ══════════════════════════════════════════════════
  //  SINGLE UNIFIED CLASSIFIER  (text, image, or both)
  // ══════════════════════════════════════════════════
  static async classifyComplaint(text, imageBase64 = null) {
    try {
      if (!model) {
        return this._fallback(text);
      }

      // ── Determine input context ──
      const hasText  = text && text.trim().length > 0;
      const hasImage = imageBase64 && imageBase64.length > 100;

      // ── Build a context-aware prompt ──
      const prompt = this._buildPrompt(hasText, hasImage, text);

      // ── Build Gemini parts array ──
      const parts = [{ text: prompt }];

      if (hasImage) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: { mimeType: 'image/jpeg', data: cleanBase64 }
        });
      }

      // ── Call Gemini ──
      const result = await model.generateContent(parts);
      const raw = result.response.text();

      // ── Extract JSON from response ──
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in AI response');

      const parsed = JSON.parse(jsonMatch[0]);
      return this._formatResult(parsed, text);

    } catch (error) {
      console.error('🤖 AI Classification error:', error.message);
      return this._fallback(text);
    }
  }

  // ══════════════════════════════════════════════════
  //  CONTEXT-AWARE PROMPT BUILDER
  // ══════════════════════════════════════════════════
  static _buildPrompt(hasText, hasImage, text) {
    let inputContext;
    if (hasText && hasImage) {
      inputContext = `INPUT: Text description + Photo attached.
STRATEGY: Analyze the PHOTO first to identify visible issues. Then cross-reference with the text description. If the image contradicts the text, TRUST THE IMAGE. If both align, boost your confidence.`;
    } else if (hasImage) {
      inputContext = `INPUT: Photo only (no text description).
STRATEGY: Rely entirely on visual analysis. Describe what you see, extract keywords from the image content, and classify based on the most prominent civic issue visible.`;
    } else {
      inputContext = `INPUT: Text description only (no photo).
STRATEGY: Parse the text carefully. Look for specific civic issue indicators. Weight action words ("broken", "overflowing", "burning") heavily.`;
    }

    return `You are CitySync AI — a municipal complaint classifier for Indian cities with 30 departments.

${inputContext}

══════════════════════════════════════
TASK: Classify this civic complaint.
══════════════════════════════════════

STEP 1 — OBSERVE
${hasImage ? '• Scan the entire image. What objects, damage, or hazards do you see?' : '• Read the complaint text carefully.'}
${hasText ? `• Citizen wrote: "${text}"` : '• No text provided — classify from image alone.'}

STEP 2 — EXTRACT KEYWORDS (3–6 normalized tokens)
Use ONLY these canonical keywords:
  garbage, water, pothole, electricity, encroachment, pollution, fire, health,
  traffic, tax, garden, estate, planning, market, signage, welfare, education,
  cultural, certificate, records, finance, legal, road_construction, workshop,
  it, election, pr

Map raw observations → canonical form:
  trash/waste/litter/dump/dustbin → garbage
  leak/pipe/sewage/drain/overflow/tap → water
  crack/hole/broken road/footpath → pothole
  wire/pole/streetlight/transformer → electricity
  illegal/hawker/obstruction → encroachment
  smoke/noise/dirty air → pollution
  flames/burning/blaze → fire
  disease/mosquito/medical/sick → health
  traffic/congestion/parking/signal → traffic
  property tax/bill/assessment/octroi → tax
  park/tree/fallen tree/playground → garden
  land/plot/property dispute → estate
  building permission/illegal building → planning
  vendor/shop/trade license → market
  hoarding/banner/billboard → signage
  pension/ration/shelter → welfare
  school/school building → education
  sports ground/festival → cultural
  birth certificate/death certificate → certificate
  RTI/records request → records
  asphalt/tar/resurfacing → road_construction
  vehicle repair/machinery → workshop
  website/app/portal → it
  voting/voter ID/booth → election

STEP 3 — CLASSIFY (pick exactly ONE)
  Garbage | Water Leakage | Road Damage | Electricity Issue |
  Encroachment | Environment Issue | Fire Hazard | Health Issue |
  Transport Issue | Property Tax | LBT/Octroi | Audit Issue |
  Garden Issue | Estate Issue | Town Planning | Market Issue |
  Signage Issue | Social Welfare | Education Issue | Cultural Issue |
  Birth/Death Certificate | Records Request | General Administration |
  Finance Issue | Legal Issue | Road Construction |
  Workshop/Vehicle | IT Issue | Election Issue | Public Relations | Other

STEP 4 — MAP TO DEPARTMENT (30 departments)
  Garbage → Solid Waste Management
  Water Leakage → Public Health Engineering Department
  Road Damage → Public Work Department
  Electricity Issue → Electrical Department
  Encroachment → Encroachment Department
  Environment Issue → Environment Department
  Fire Hazard → Fire Department
  Health Issue → Health Department (Medicine)
  Transport Issue → Transport Department
  Property Tax → Revenue Department
  LBT/Octroi → LBT
  Audit Issue → Revenue And Audit Department
  Garden Issue → Garden Department
  Estate Issue → Estate Department
  Town Planning → Town Planning Department
  Market Issue → Market Department
  Signage Issue → Skysign & Advertisement Department
  Social Welfare → Social Welfare Department
  Education Issue → Education Department
  Cultural Issue → Cultural And Sports Department
  Birth/Death Certificate → Birth and Death Registration Department
  Records Request → Central Records Department
  General Administration → General Administration Department
  Finance Issue → Accounts and Finance Department
  Legal Issue → Law Department
  Public Relations → Public Relations Department
  IT Issue → Department Of Information And Technology
  Road Construction → Hot Mix Plant Department
  Workshop/Vehicle → Workshop Department
  Election Issue → Election Department
  Other → Unclassified

STEP 5 — SELF-CHECK
  • Do keywords match the issue_type?
  • Does issue_type map to the right department?
  • Fix any mismatches before outputting.
  • If genuinely unclear → issue_type = "Other"

STEP 6 — CONFIDENCE
  ${hasImage ? '• Clear photo + matching text → 0.85–0.95' : ''}
  ${hasImage ? '• Clear photo, vague/no text → 0.70–0.85' : ''}
  ${hasText && !hasImage ? '• Detailed text, no photo → 0.65–0.80' : ''}
  • Ambiguous input → 0.40–0.60
  • Irrelevant / cannot tell → below 0.40

STEP 7 — PROBLEM TYPE
  Classify as "community" or "personal":
  • "community" = affects multiple people / public infrastructure (potholes, garbage, streetlights, road damage, water supply, sewage, traffic, noise, illegal construction, pollution, fire hazards, parks)
  • "personal" = affects only the individual / private matter (property tax, birth/death certificate, pension, ration card, property dispute, trade license, land issue, personal health, individual billing)

OUTPUT: Respond with ONLY this JSON — nothing else:
{
  "keywords": ["k1", "k2", "k3"],
  "issue_type": "IssueType",
  "department": "DepartmentName",
  "confidence": 0.0,
  "problem_type": "community"
}`;
  }

  // ══════════════════════════════════════════════════
  //  FORMAT AI RESPONSE → STANDARD RESULT OBJECT
  // ══════════════════════════════════════════════════
  static _formatResult(parsed, text) {
    const issueType     = parsed.issue_type || 'Other';
    const deptEntry     = DEPARTMENTS[issueType];
    const isUnclassified = !deptEntry;
    const confidence    = Math.max(0, Math.min(1, parsed.confidence || 0));

    // Normalize + deduplicate keywords
    const keywords = [...new Set(
      (parsed.keywords || []).map(kw => {
        const lower = kw.toLowerCase();
        return CANONICAL[lower] || lower;
      })
    )].slice(0, 6);

    return {
      success:        true,
      needsMoreInfo:  isUnclassified,
      category:       deptEntry?.category || 'other',
      issue_type:     issueType,
      department:     deptEntry?.dept || null,
      confidence,
      keywords,
      problemType:    parsed.problem_type === 'personal' ? 'personal' : 'community',
      suggestedTitle: isUnclassified ? null : `${issueType} reported`,
      severity:       confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low',
      summary:        text ? text.substring(0, 100) : 'Image-based classification',
    };
  }

  // ══════════════════════════════════════════════════
  //  OFFLINE FALLBACK (no Gemini / API failure)
  // ══════════════════════════════════════════════════
  static _fallback(text) {
    const lower = (text || '').toLowerCase();

    // keyword → issue type lookup (all 30 departments)
    const PATTERNS = {
      'Garbage':            ['garbage','trash','waste','dump','litter','dustbin','rubbish','debris'],
      'Water Leakage':      ['water','tap','pipeline','pipe burst','leakage','sewage','sewer','manhole','drain','gutter','overflow'],
      'Road Damage':        ['pothole','pit','hole','crater','road damage','footpath','divider','broken road','crack','pavement'],
      'Electricity Issue':  ['streetlight','street light','lamp','bulb','dark road','no light','electric','power','wire','transformer'],
      'Encroachment':       ['illegal','unauthorized','encroachment','building violation','hawker'],
      'Environment Issue':  ['noise','loud','pollution','honking','deforestation','air quality'],
      'Fire Hazard':        ['fire','blaze','burn','inflammable','hazard'],
      'Health Issue':       ['disease','epidemic','mosquito','dengue','malaria','hospital','medical'],
      'Transport Issue':    ['traffic','signal','parking','jam','blockage','bus','transport','zebra crossing'],
      'Property Tax':       ['property tax','tax bill','assessment','tax notice'],
      'LBT/Octroi':         ['lbt','octroi','local body tax'],
      'Audit Issue':        ['audit','revenue audit','financial audit'],
      'Garden Issue':       ['garden','park','fallen tree','playground','tree cutting','tree fell'],
      'Estate Issue':       ['estate','land','land dispute','plot','property dispute'],
      'Town Planning':      ['building permission','town planning','illegal building','construction permit','building plan'],
      'Market Issue':       ['market','vendor','shop','trade license','commercial'],
      'Signage Issue':      ['hoarding','banner','advertisement','billboard','signage','skysign'],
      'Social Welfare':     ['pension','ration','welfare','shelter','bpl','poor'],
      'Education Issue':    ['school','school building','education','teacher'],
      'Cultural Issue':     ['sports','sports ground','festival','cultural','stadium'],
      'Birth/Death Certificate': ['birth certificate','death certificate','birth registration','death registration'],
      'Records Request':    ['records','rti','information request','record copy'],
      'General Administration': ['administration','admin','general complaint','miscellaneous'],
      'Finance Issue':      ['accounts','salary','budget','payment','finance'],
      'Legal Issue':        ['legal','court','legal notice','advocate','law'],
      'Public Relations':   ['grievance','public complaint','media','press','pr'],
      'IT Issue':           ['website','app','portal','software','it issue','online'],
      'Road Construction':  ['asphalt','tar','resurfacing','road construction','hot mix'],
      'Workshop/Vehicle':   ['vehicle repair','machinery','workshop','municipal vehicle'],
      'Election Issue':     ['election','voting','voter id','booth','poll'],
    };

    let bestIssue = null;
    let bestScore = 0;
    let matchedWords = [];

    for (const [type, words] of Object.entries(PATTERNS)) {
      const hits = words.filter(w => lower.includes(w));
      if (hits.length > bestScore) {
        bestScore = hits.length;
        bestIssue = type;
        matchedWords = hits;
      }
    }

    const deptEntry     = bestIssue ? DEPARTMENTS[bestIssue] : null;
    const isUnclassified = !deptEntry;
    const confidence    = bestScore > 0 ? Math.min(0.5 + bestScore * 0.15, 0.85) : 0.15;

    const keywords = [...new Set(
      matchedWords.map(w => CANONICAL[w] || w)
    )].slice(0, 6);

    return {
      success:        true,
      needsMoreInfo:  isUnclassified,
      category:       deptEntry?.category || 'other',
      issue_type:     bestIssue || 'Other',
      department:     deptEntry?.dept || null,
      confidence,
      keywords,
      suggestedTitle: isUnclassified ? null : `${bestIssue} reported`,
      severity:       confidence >= 0.7 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
      summary:        text ? text.substring(0, 100) : '',
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
