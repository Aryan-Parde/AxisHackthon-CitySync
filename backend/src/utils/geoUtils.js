const axios = require('axios');
const config = require('../config/env');

class GeoUtils {
  // Reverse geocode coordinates to address using Mapbox
  static async reverseGeocode(lng, lat) {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${config.mapboxToken}&country=IN&language=en`
      );

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        return {
          address: feature.place_name,
          ward: feature.context?.find(c => c.id.startsWith('locality'))?.text || '',
          zone: feature.context?.find(c => c.id.startsWith('district'))?.text || ''
        };
      }

      return { address: '', ward: '', zone: '' };
    } catch (error) {
      console.error('Geocoding error:', error.message);
      return { address: '', ward: '', zone: '' };
    }
  }

  // Forward geocode address to coordinates
  static async forwardGeocode(address) {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${config.mapboxToken}&country=IN&language=en&limit=5`
      );

      return response.data.features.map(f => ({
        address: f.place_name,
        coordinates: f.center, // [lng, lat]
        relevance: f.relevance
      }));
    } catch (error) {
      console.error('Forward geocoding error:', error.message);
      return [];
    }
  }

  // Calculate bounding box for a center point and radius
  static getBoundingBox(lng, lat, radiusKm) {
    const R = 6371; // Earth's radius in km
    const dLat = radiusKm / R * (180 / Math.PI);
    const dLng = radiusKm / (R * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);

    return {
      sw: [lng - dLng, lat - dLat],
      ne: [lng + dLng, lat + dLat]
    };
  }
}

module.exports = GeoUtils;
