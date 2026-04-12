const config = require('../config/env');

class GeotagService {

  /**
   * Extract geotag information from an image using Google Gemini AI Vision.
   * Looks for GPS Map Camera-style overlays with lat/long, city, date/time.
   * @param {string} imageBase64 - base64 encoded image (with or without data URI prefix)
   * @returns {Object} { isGeotagged, latitude, longitude, city, address, timestamp, raw }
   */
  static async extractGeotag(imageBase64) {
    const apiKey = config.geminiApiKey || config.openRouterApiKey;
    if (!apiKey || !imageBase64) {
      return { isGeotagged: false, error: 'AI API not configured or no image provided' };
    }

    try {
      // Strip data URI prefix to get raw base64
      let rawBase64 = imageBase64;
      let mimeType = 'image/jpeg';
      if (rawBase64.startsWith('data:image')) {
        const match = rawBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          rawBase64 = match[2];
        } else {
          rawBase64 = rawBase64.split(',')[1] || rawBase64;
        }
      }

      const prompt = `Analyze this image carefully. Look for any geotagging information embedded as a text overlay, watermark, or stamp on the image. 
These markings are typically added by "GPS Map Camera" apps. The text might appear as banners at the top or bottom of the image, or as semi-transparent overlays.
Examples of data to look for:
- Lat 21.126735° Long 79.047921°
- Nagpur, Maharashtra, India
- Sunday, 12/04/2026 06:17 AM GMT +05:30
- Plus codes like 43f2+7jr
- Address text

Extract ALL geolocation information you can find from the text overlay ON THE IMAGE itself.
Return ONLY a valid JSON object with no markdown formatting, no backticks, no comments:

{
  "isGeotagged": true,
  "latitude": 21.126735,
  "longitude": 79.047921,
  "city": "Nagpur",
  "state": "Maharashtra",
  "address": "43f2+7jr, S Ambazari Rd...",
  "timestamp": "Sunday, 12/04/2026 06:17 AM GMT +05:30",
  "plusCode": "43f2+7jr"
}

If no text overlay with location data is found, return:
{"isGeotagged": false, "latitude": null, "longitude": null, "city": null, "state": null, "address": null, "timestamp": null, "plusCode": null}

Ensure latitude and longitude are numbers, not strings.`;

      // Use Google Gemini API directly - try multiple models for reliability
      const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let responseText = '';
      let lastError = null;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: rawBase64
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1000
              }
            })
          });

          if (response.status === 429) {
            console.warn(`Model ${model} rate limited, trying next...`);
            lastError = `Rate limited on ${model}`;
            continue;
          }

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Gemini API error (${model}):`, response.status, errorBody);
            lastError = `Gemini API error: ${response.status}`;
            continue;
          }

          const json = await response.json();
          responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          console.log(`✅ Using model: ${model}`);
          break; // success — stop trying
        } catch (err) {
          lastError = err.message;
          console.warn(`Model ${model} failed: ${err.message}, trying next...`);
          continue;
        }
      }

      if (!responseText) {
        throw new Error(lastError || 'All Gemini models failed');
      }

      console.log('\n🔍 Raw Gemini geotag response:', responseText.substring(0, 300));

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
