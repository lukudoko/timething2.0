import cache from 'memory-cache';

const cacheKey = 'sunriseSunsetCache';
const cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

async function fetchAndCacheSunriseSunsetData() {
  const apiEndpoint = 'https://api.sunrise-sunset.org/json?lat=57.6529&lng=11.9106&formatted=0';
  const response = await fetch(apiEndpoint);

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.results) {
    throw new Error('Invalid data structure from API');
  }

  // Cache the results and revalidate after expiry
  cache.put(cacheKey, data.results, cacheExpiry);
  console.log('Cache updated with new sunrise-sunset data.');

  // Revalidate cache after the expiry time
  setTimeout(fetchAndCacheSunriseSunsetData, cacheExpiry);
}

export default async function handler(req, res) {
  let cachedData = cache.get(cacheKey);

  if (!cachedData) {
    try {
      console.log('Cache miss. Fetching new data...');
      await fetchAndCacheSunriseSunsetData(); // Fetch and cache data
      cachedData = cache.get(cacheKey); // Get the new cached data
    } catch (error) {
      console.error('Error fetching sunrise-sunset data:', error);
      return res.status(500).json({ error: 'Failed to fetch sunrise-sunset data' });
    }
  }

  return res.status(200).json(cachedData);
}
