const Department = require('../models/Department');

class RoutingService {
  // Zone boundaries for a sample city (can be configured per deployment)
  static ZONE_BOUNDARIES = {
    'North': { latMin: 18.55, latMax: 18.65, lngMin: 73.80, lngMax: 73.90 },
    'South': { latMin: 18.45, latMax: 18.55, lngMin: 73.80, lngMax: 73.90 },
    'East': { latMin: 18.50, latMax: 18.60, lngMin: 73.90, lngMax: 74.00 },
    'West': { latMin: 18.50, latMax: 18.60, lngMin: 73.70, lngMax: 73.80 },
    'Central': { latMin: 18.51, latMax: 18.53, lngMin: 73.84, lngMax: 73.88 }
  };

  // Determine zone from coordinates
  static determineZone(coordinates) {
    const [lng, lat] = coordinates;

    for (const [zone, bounds] of Object.entries(this.ZONE_BOUNDARIES)) {
      if (lat >= bounds.latMin && lat <= bounds.latMax &&
          lng >= bounds.lngMin && lng <= bounds.lngMax) {
        return zone;
      }
    }

    return 'Central'; // Default zone
  }

  // Route complaint to appropriate department
  static async routeComplaint(complaint) {
    try {
      // Find department by category
      const department = await Department.findOne({
        categories: complaint.category
      });

      if (!department) {
        console.warn(`No department found for category: ${complaint.category}`);
        return {
          department: null,
          zone: 'Central',
          assignedTo: null,
          estimatedHours: 72
        };
      }

      // Determine zone
      const zone = this.determineZone(complaint.location.coordinates);

      // Find contact for the zone
      const contact = department.contacts.find(c => c.zone === zone) ||
                      department.contacts[0];

      // Calculate estimated resolution based on priority
      const priorityMultiplier = {
        critical: 0.5,
        high: 0.75,
        medium: 1,
        low: 1.5
      };

      const estimatedHours = department.avgResolutionHours *
        (priorityMultiplier[complaint.priority?.level] || 1);

      return {
        department: department._id,
        departmentName: department.name,
        zone,
        assignedTo: contact,
        estimatedHours,
        estimatedResolution: new Date(Date.now() + estimatedHours * 60 * 60 * 1000)
      };
    } catch (error) {
      console.error('Routing error:', error.message);
      return {
        department: null,
        zone: 'Central',
        assignedTo: null,
        estimatedHours: 72
      };
    }
  }
}

module.exports = RoutingService;
