/**
 * Priority Scoring Algorithm
 * Calculates priority based on multiple factors
 */
class PriorityScoring {
  static CATEGORY_WEIGHTS = {
    sewage: 25,
    water_supply: 22,
    pothole: 20,
    road_damage: 18,
    drainage: 18,
    streetlight: 15,
    garbage: 12,
    traffic: 10,
    illegal_construction: 10,
    noise: 8,
    other: 5
  };

  static URGENT_KEYWORDS = [
    'dangerous', 'accident', 'flooding', 'collapse', 'emergency',
    'child', 'children', 'elderly', 'death', 'injury', 'hospital',
    'school', 'fire', 'electric', 'shock', 'falling', 'broken',
    'overflow', 'contaminated', 'poison', 'blocked ambulance',
    'sinkhole', 'major', 'severe', 'urgent', 'critical'
  ];

  /**
   * Calculate priority score (0-100) and level
   * @param {Object} params
   * @param {string} params.category - Complaint category
   * @param {string} params.description - Complaint text
   * @param {number} params.nearbyCount - Number of similar nearby complaints
   * @param {string} params.aiSeverity - AI-suggested severity
   * @returns {Object} { level, score, factors }
   */
  static calculate({ category, description, nearbyCount = 0, aiSeverity = 'medium' }) {
    const factors = {};

    // Factor 1: Category base weight (0-25)
    factors.category = this.CATEGORY_WEIGHTS[category] || 5;

    // Factor 2: Keyword urgency (0-25)
    const lowerDesc = description.toLowerCase();
    const keywordHits = this.URGENT_KEYWORDS.filter(kw => lowerDesc.includes(kw));
    factors.keywords = Math.min(keywordHits.length * 8, 25);

    // Factor 3: Duplicate frequency (0-25)
    factors.frequency = Math.min(nearbyCount * 5, 25);

    // Factor 4: Time-based urgency (0-15)
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 5) {
      factors.time = 15; // Night complaints are more urgent
    } else if (hour >= 6 && hour <= 9) {
      factors.time = 10; // Morning rush hour
    } else {
      factors.time = 5;
    }

    // Factor 5: AI severity boost (0-10)
    const severityBoost = {
      critical: 10,
      high: 7,
      medium: 3,
      low: 0
    };
    factors.aiSeverity = severityBoost[aiSeverity] || 3;

    // Calculate total score
    let score = Object.values(factors).reduce((sum, v) => sum + v, 0);
    score = Math.min(score, 100);

    // Determine level
    let level;
    if (score >= 75) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 25) level = 'medium';
    else level = 'low';

    return { level, score, factors };
  }
}

module.exports = PriorityScoring;
