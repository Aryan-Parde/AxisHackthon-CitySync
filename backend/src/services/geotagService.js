const config = require('../config/env');

const OPENROUTER_MODEL = 'google/gemini-2.0-flash-001'; // Stable multimodal model via OpenRouter

async function callOpenRouter(messages) {
  if (!config.openRouterApiKey) {
    throw new Error('OpenRouter API not configured.');
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'CitySync Geotag'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: messages,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const json = await response.json();
  return json.choices[0].message.content;
}

class GeotagService {

  /**
   * Extract geotag information from an image using Gemini AI Vision.
   * Looks for GPS Map Camera-style overlays with lat/long, city, date/time.
   * @param {string} imageBase64 - base64 encoded image (with or without data URI prefix)
   * @returns {Object} { isGeotagged, latitude, longitude, city, address, timestamp, raw }
   */
  static async extractGeotag(imageBase64) {
    if (!config.openRouterApiKey || !imageBase64) {
      return { isGeotagged: false, error: 'OpenRouter API not configured or no image provided' };
    }

    try {
      let cleanBase64 = imageBase64;
      if (!cleanBase64.startsWith('data:image')) {
          cleanBase64 = `data:image/jpeg;base64,${cleanBase64}`;
      }

      const prompt = `Analyze this image carefully. Look for any geotagging information embedded as a text overlay, watermark, stamp, or banner on the image. 
These markings are typically added by "GPS Map Camera", "Timestamp Camera", or similar apps used for evidence collection. The text is usually found in a semi-transparent or solid banner at the bottom or top of the image.

Examples of data to look for:
- Lat 21.126735° Long 79.047921° (or Latitude/Longitude)
- City Names: Nagpur, Maharashtra, India
- Full Addresses: 43f2+7jr, S Ambazari Rd, Ambedkar Nagar, Nagpur...
- Sunday, 12/04/2026 06:17 AM GMT +05:30

Extract ALL geolocation information you can find from the text overlay ON THE IMAGE itself. 
Do not guess the location from the image content (trees, buildings); ONLY extract what is written in the overlay text.

Return ONLY a valid JSON object. Do not include markdown formatting or extra text.

{
  "isGeotagged": true or false,
  "latitude": 21.126735,
  "longitude": 79.047921,
  "city": "Nagpur",
  "state": "Maharashtra",
  "address": "43f2+7jr, S Ambazari Rd...",
  "timestamp": "Sunday, 12/04/2026 06:17 AM GMT +05:30",
  "plusCode": "43f2+7jr"
}

If no text overlay with location data is found, set "isGeotagged": false and the rest to null. Ensure latitude and longitude are numbers, not strings.`;

      let content = [];
      content.push({ type: 'text', text: prompt });
      content.push({ type: 'image_url', image_url: { url: cleanBase64 } });

      const responseText = await callOpenRouter([{ role: 'user', content }]);

      
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Geotag extraction: No JSON in response:', responseText);
        return { isGeotagged: false, error: 'Could not parse AI response' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      console.log(`\n📍 Geotag Extraction Result:`);
      console.log(`   Geotagged: ${parsed.isGeotagged ? '✅ Yes' : '❌ No'}`);
      if (parsed.isGeotagged) {
        console.log(`   Location: ${parsed.latitude}, ${parsed.longitude}`);
        console.log(`   City: ${parsed.city}, ${parsed.state}`);
        console.log(`   Address: ${parsed.address}`);
        console.log(`   Timestamp: ${parsed.timestamp}`);
      }
      console.log('');

      return parsed;
    } catch (error) {
      console.error('Geotag extraction error:', error.message);
      return { isGeotagged: false, error: error.message };
    }
  }

  /**
   * Validate timestamp is within a given interval (in hours) from current time.
   * @param {string} timestampStr - timestamp string from geotag (e.g. "Sunday, 12/04/2026 06:17 AM GMT +05:30")
   * @param {number} maxHours - maximum age in hours (default 24 = 1 day)
   * @returns {{ valid: boolean, message: string, parsedDate: Date|null }}
   */
  static validateTimestamp(timestampStr, maxHours = 24) {
    if (!timestampStr) {
      return { valid: false, message: 'No timestamp found in geotag', parsedDate: null };
    }

    try {
      // Try to parse the timestamp - handle various formats from GPS camera apps
      // Format: "Sunday, 12/04/2026 06:17 AM GMT +05:30"
      // Format: "12/04/2026 06:17 AM"
      // Format: standard date strings
      let cleanStr = timestampStr
        .replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*/i, '')
        .replace(/GMT\s*/, '')
        .trim();
      
      // Try DD/MM/YYYY format (common in India)
      const ddmmMatch = cleanStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(.*)/);
      if (ddmmMatch) {
        const [_, dd, mm, yyyy, time] = ddmmMatch;
        cleanStr = `${yyyy}-${mm}-${dd} ${time}`;
      }

      const parsedDate = new Date(cleanStr);
      
      if (isNaN(parsedDate.getTime())) {
        // If direct parse fails, try more aggressive parsing
        console.warn('Could not parse geotag timestamp:', timestampStr);
        // Be lenient - accept if we can't parse (don't block the user)
        return { valid: true, message: 'Timestamp format not recognized, accepted', parsedDate: null };
      }

      const now = new Date();
      const diffMs = Math.abs(now.getTime() - parsedDate.getTime());
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours > maxHours) {
        return { 
          valid: false, 
          message: `Photo is ${Math.round(diffHours)} hours old. Must be taken within the last ${maxHours} hours.`,
          parsedDate 
        };
      }

      return { valid: true, message: 'Timestamp is within range', parsedDate };
    } catch (error) {
      console.error('Timestamp validation error:', error);
      return { valid: true, message: 'Could not validate timestamp, accepted', parsedDate: null };
    }
  }

  /**
   * Calculate distance between two lat/lng points using Haversine formula.
   * @returns distance in meters
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Validate that a resolution photo's geotag is within radius of the complaint location.
   * @param {Object} geotag - extracted geotag { latitude, longitude }
   * @param {Array} complaintCoords - [lng, lat] from complaint
   * @param {number} maxRadiusMeters - max distance in meters (default 100)
   * @returns {{ valid: boolean, distance: number, message: string }}
   */
  static validateProximity(geotag, complaintCoords, maxRadiusMeters = 100) {
    if (!geotag?.latitude || !geotag?.longitude || !complaintCoords) {
      return { valid: false, distance: null, message: 'Missing coordinates for proximity check' };
    }

    const [complaintLng, complaintLat] = complaintCoords;
    const distance = this.calculateDistance(
      geotag.latitude, geotag.longitude,
      complaintLat, complaintLng
    );

    const valid = distance <= maxRadiusMeters;
    
    console.log(`📏 Proximity Check:`);
    console.log(`   Complaint: ${complaintLat}, ${complaintLng}`);
    console.log(`   Photo:     ${geotag.latitude}, ${geotag.longitude}`);
    console.log(`   Distance:  ${Math.round(distance)}m (max: ${maxRadiusMeters}m)`);
    console.log(`   Result:    ${valid ? '✅ Within range' : '❌ Too far'}\n`);

    return {
      valid,
      distance: Math.round(distance),
      message: valid 
        ? `Photo taken ${Math.round(distance)}m from complaint location` 
        : `Photo is ${Math.round(distance)}m away from the complaint. Must be within ${maxRadiusMeters}m.`
    };
  }
}

module.exports = GeotagService;
