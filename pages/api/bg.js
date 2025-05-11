import cache from 'memory-cache';

const CACHE_KEY_PREFIX = 'sunData-';
const CACHE_EXPIRY = 6 * 60 * 60 * 1000; // 6 hours

const DEFAULT_COORDS = {
  lat: 57.6529,
  lng: 11.9106
};

export default async function handler(req, res) {
  try {
    const { lat, lng } = req.query;
    const coordinates = {
      lat: parseFloat(lat) || DEFAULT_COORDS.lat,
      lng: parseFloat(lng) || DEFAULT_COORDS.lng
    };

    const cacheKey = `${CACHE_KEY_PREFIX}${coordinates.lat},${coordinates.lng}`;
    let cachedData = cache.get(cacheKey);
    
    if (!cachedData) {
      const apiUrl = `https://api.sunrise-sunset.org/json?lat=${coordinates.lat}&lng=${coordinates.lng}&formatted=0`;
      const response = await fetch(apiUrl);

      if (!response.ok) throw new Error(`API responded with ${response.status}`);

      const data = await response.json();
      
      if (data.status !== "OK" || !data.results) {
        throw new Error('Invalid API response structure');
      }

      cachedData = {
        ...data.results,
        coordinates, 
        retrievedAt: new Date().toISOString()
      };
      cache.put(cacheKey, cachedData, CACHE_EXPIRY);
    }

    res.status(200).json({
      status: 'OK',
      data: cachedData,
    });

  } catch (error) {
    console.error('Sunrise-sunset API error:', error);

    const staleData = cache.get(cacheKey);
    if (staleData) {
      return res.status(200).json({
        status: 'STALE',
        data: staleData,
        warning: 'Using cached data due to API error',
        error: error.message
      });
    }

    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      details: 'Failed to fetch sunrise-sunset data'
    });
  }
}