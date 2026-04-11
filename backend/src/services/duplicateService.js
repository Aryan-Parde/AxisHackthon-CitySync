const Complaint = require('../models/Complaint');
const { cosineSimilarity } = require('../utils/textSimilarity');

class DuplicateService {
  /**
   * Find potential duplicate complaints
   * Two-phase approach:
   * Phase 1: Geo proximity filter (within 200m radius, same category)
   * Phase 2: Text similarity (cosine similarity on embeddings)
   */
  static async findDuplicate(complaint) {
    try {
      // Phase 1: Find nearby complaints of same category within 200m, last 7 days
      const nearby = await Complaint.find({
        _id: { $ne: complaint._id },
        category: complaint.category,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: complaint.location.coordinates
            },
            $maxDistance: 200 // meters
          }
        },
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        status: { $nin: ['resolved', 'closed'] },
        duplicateOf: { $exists: false }
      }).limit(10);

      if (nearby.length === 0) return null;

      // Phase 2: Text similarity check
      if (complaint.aiMetadata?.embedding?.length > 0) {
        for (const existing of nearby) {
          if (existing.aiMetadata?.embedding?.length > 0) {
            const similarity = cosineSimilarity(
              complaint.aiMetadata.embedding,
              existing.aiMetadata.embedding
            );

            if (similarity > 0.80) {
              return {
                duplicate: existing,
                similarity: similarity,
                distance: this.calculateDistance(
                  complaint.location.coordinates,
                  existing.location.coordinates
                )
              };
            }
          }
        }
      }

      // Fallback: Simple text comparison
      for (const existing of nearby) {
        const textSimilarity = this.simpleTextSimilarity(
          complaint.description,
          existing.description
        );

        if (textSimilarity > 0.70) {
          return {
            duplicate: existing,
            similarity: textSimilarity,
            distance: this.calculateDistance(
              complaint.location.coordinates,
              existing.location.coordinates
            )
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Duplicate detection error:', error.message);
      return null;
    }
  }

  // Simple text similarity using Jaccard index
  static simpleTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Calculate distance between two [lng, lat] coordinates in meters
  static calculateDistance(coord1, coord2) {
    const R = 6371000; // Earth's radius in meters
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Merge duplicate into original complaint
  static async mergeDuplicate(originalId, duplicateComplaint) {
    try {
      const original = await Complaint.findById(originalId);
      if (!original) return null;

      // Increment duplicate count
      original.duplicateCount += 1;

      // If duplicates increase priority
      if (original.duplicateCount >= 5 && original.priority.level !== 'critical') {
        original.priority.level = 'critical';
        original.priority.score = Math.min(original.priority.score + 20, 100);
      } else if (original.duplicateCount >= 3 && original.priority.level === 'low') {
        original.priority.level = 'medium';
        original.priority.score = Math.min(original.priority.score + 10, 100);
      }

      // Add to timeline
      original.timeline.push({
        status: original.status,
        timestamp: new Date(),
        note: `Duplicate report merged. Now reported by ${original.duplicateCount} users.`
      });

      await original.save();
      return original;
    } catch (error) {
      console.error('Merge error:', error.message);
      return null;
    }
  }
}

module.exports = DuplicateService;
