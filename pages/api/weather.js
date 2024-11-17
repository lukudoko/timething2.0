// pages/api/weather.js
import cache from 'memory-cache';

const cacheKey = 'weatherCache';
const cacheExpiry = 15 * 60 * 1000; // 15 minutes in milliseconds

export default async function handler(req, res) {
  const { lat = 57.65, lon = 11.916 } = req.query; // Default coordinates
  const API_KEY = process.env.WEATHER_API_KEY || '7be8a9d34955926d889f6ce6d3ea87fb';

  // Check if data is cached
  let cachedWeather = cache.get(cacheKey);

  if (!cachedWeather) {
    try {
      const apiEndpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the weather data
      cache.put(cacheKey, data, cacheExpiry);
      cachedWeather = data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  }

  return res.status(200).json(cachedWeather);
}
