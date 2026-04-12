/**
 * City coordinates lookup for map centering.
 * Used by dashboard map pages to center on the user's selected city.
 */

const CITY_COORDS = {
  'mumbai': [72.8777, 19.0760],
  'delhi': [77.1025, 28.7041],
  'bangalore': [77.5946, 12.9716],
  'hyderabad': [78.4867, 17.3850],
  'ahmedabad': [72.5714, 23.0225],
  'chennai': [80.2707, 13.0827],
  'kolkata': [88.3639, 22.5726],
  'pune': [73.8567, 18.5204],
  'jaipur': [75.7873, 26.9124],
  'surat': [72.8311, 21.1702],
  'lucknow': [80.9462, 26.8467],
  'kanpur': [80.3319, 26.4499],
  'nagpur': [79.0882, 21.1458],
  'indore': [75.8577, 22.7196],
  'thane': [72.9781, 19.2183],
  'bhopal': [77.4126, 23.2599],
  'visakhapatnam': [83.2185, 17.6868],
  'patna': [85.1376, 25.6093],
  'vadodara': [73.1812, 22.3072],
  'ghaziabad': [77.4538, 28.6692],
  'ludhiana': [75.8573, 30.9010],
  'agra': [78.0322, 27.1767],
  'nashik': [73.7898, 19.9975],
  'faridabad': [77.3178, 28.4089],
  'meerut': [77.7064, 28.9845],
  'rajkot': [70.8022, 22.3039],
  'varanasi': [82.9913, 25.3176],
  'srinagar': [74.7973, 34.0837],
  'aurangabad': [75.3433, 19.8762],
  'dhanbad': [86.4304, 23.7957],
  'amritsar': [74.8723, 31.6340],
  'navi mumbai': [73.0169, 19.0330],
  'allahabad': [81.8463, 25.4358],
  'howrah': [88.2636, 22.5958],
  'ranchi': [85.3096, 23.3441],
  'gwalior': [78.1828, 26.2183],
  'jabalpur': [79.9864, 23.1815],
  'coimbatore': [76.9558, 11.0168],
  'vijayawada': [80.6480, 16.5062],
  'jodhpur': [73.0243, 26.2389],
  'madurai': [78.1198, 9.9252],
  'raipur': [81.6296, 21.2514],
  'kota': [75.8648, 25.2138],
  'chandigarh': [76.7794, 30.7333],
  'guwahati': [91.7362, 26.1445],
  'solapur': [75.9064, 17.6599],
  'hubli': [75.1240, 15.3647],
  'mysore': [76.6394, 12.2958],
  'tiruchirappalli': [78.6569, 10.7905],
  'bareilly': [79.4304, 28.3670],
  'aligarh': [78.0880, 27.8974],
  'tiruppur': [77.3411, 11.1085],
  'moradabad': [78.7733, 28.8386],
  'jalandhar': [75.5762, 31.3260],
  'bhubaneswar': [85.8245, 20.2961],
  'salem': [78.1460, 11.6643],
  'warangal': [79.5941, 17.9784],
  'guntur': [80.4365, 16.3067],
  'bhiwandi': [73.0483, 19.3000],
  'saharanpur': [77.5510, 29.9680],
  'gorakhpur': [83.3732, 26.7606],
  'bikaner': [73.3119, 28.0229],
  'amravati': [77.7523, 20.9374],
  'noida': [77.3910, 28.5355],
  'jamshedpur': [86.1850, 22.8046],
  'bhilai': [81.3509, 21.2094],
  'cuttack': [85.8830, 20.4625],
  'firozabad': [78.3957, 27.1591],
  'kochi': [76.2673, 9.9312],
  'nellore': [79.9865, 14.4426],
  'bhavnagar': [72.1519, 21.7645],
  'dehradun': [78.0322, 30.3165],
  'durgapur': [87.3119, 23.5204],
  'asansol': [86.9661, 23.6889],
  'kolhapur': [74.2433, 16.7050],
  'ajmer': [74.6399, 26.4499],
  'akola': [77.0082, 20.7002],
  'gulbarga': [76.8343, 17.3297],
  'jamnagar': [70.0577, 22.4707],
  'ujjain': [75.7885, 23.1765],
  'loni': [77.2910, 28.7554],
  'siliguri': [88.4275, 26.7271],
  'jhansi': [78.5685, 25.4484],
  'ulhasnagar': [73.1637, 19.2183],
  'sangli': [74.5815, 16.8524],
  'mangalore': [74.8560, 12.9141],
};

/**
 * Get the map center coordinates.
 * Priority: 1) City from localStorage  2) Browser geolocation  3) Default (Nagpur)
 * @returns {Promise<{center: [number, number], zoom: number, source: string}>}
 */
export function getCityCoords(cityName) {
  if (!cityName) return null;
  const key = cityName.toLowerCase().trim();
  return CITY_COORDS[key] || null;
}

/**
 * Get map center from saved city or geolocation
 * @returns {Promise<{center: [number, number], zoom: number, source: string}>}
 */
export async function getMapCenter() {
  // 1. Check localStorage for saved city
  if (typeof window !== 'undefined') {
    const savedCity = localStorage.getItem('citysync_city');
    if (savedCity) {
      const coords = getCityCoords(savedCity);
      if (coords) {
        return { center: coords, zoom: 12, source: 'city' };
      }
    }
  }

  // 2. Try browser geolocation
  try {
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000, // 5 minutes cache
      });
    });
    return {
      center: [position.coords.longitude, position.coords.latitude],
      zoom: 13,
      source: 'geolocation',
    };
  } catch (e) {
    // Geolocation denied or failed — fall through to default
  }

  // 3. Default: Nagpur
  return { center: [79.0882, 21.1458], zoom: 12, source: 'default' };
}

export default CITY_COORDS;
