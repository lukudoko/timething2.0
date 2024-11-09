// pages/api/sunrise-sunset.js
import cache from 'memory-cache';
import { toZonedTime } from 'date-fns-tz';

const cacheKey = 'sunriseSunsetCache';
const gradientCacheKey = 'backgroundGradientCache';
const cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  const timeZone = 'Europe/Stockholm'; // CEST timezone

// Function to generate background gradient
const generateBackgroundGradient = (sunData) => {
  if (!sunData) {
    console.error('Error: Sunrise-sunset data not available.');
    return '';
  }

  const times = [
    sunData.astronomical_twilight_begin,
    sunData.nautical_twilight_begin,
    sunData.civil_twilight_begin,
    sunData.sunrise,
    sunData.solar_noon,
    sunData.sunset,
    sunData.civil_twilight_end,
    sunData.nautical_twilight_end,
    sunData.astronomical_twilight_end,
  ];



  const totalDayDurationMinutes = 24 * 60;
  const percentagesArray = times.map(value => {
    const tid = new Date(value);
    const time = toZonedTime(tid, timeZone);
    const minutesSinceMidnight = time.getHours() * 60 + time.getMinutes();
    return parseFloat(((minutesSinceMidnight / totalDayDurationMinutes) * 100).toFixed(1));
  });

  percentagesArray[3] += 5;
  percentagesArray[5] -= 5;
  percentagesArray.sort((a, b) => a - b);

  const colors = ['#051937', '#8e3661', '#e48239', '#38BDF8', '#38BDF8', '#38BDF8','#d47e97', '#6c4771', '#051937'];
  const gradientStops = colors.map((color, index) => {
    const percentage = percentagesArray[index];

    return `${color} ${percentage}%`;
  });


 return `linear-gradient(to bottom, ${gradientStops.join(', ')})`;
};

export default async function handler(req, res) {
  const { query } = req;
  const { type } = query; // Expecting 'gradient' or 'data'

  // Fetch and cache sunrise-sunset data if not cached
  let cachedData = cache.get(cacheKey);

  if (!cachedData) {
    try {
      const apiEndpoint = 'https://api.sunrise-sunset.org/json?lat=57.6529&lng=11.9106&formatted=0&tzid=CET';
      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.results) {
        throw new Error('Invalid data structure from API');
      }

      cachedData = data.results;
      cache.put(cacheKey, cachedData, cacheExpiry);
    } catch (error) {
      console.error('Error fetching sunrise-sunset data:', error);
      return res.status(500).json({ error: 'Failed to fetch sunrise-sunset data' });
    }
  }

  // Handle different query types
  if (type === 'gradient') {
    let cachedGradient = cache.get(gradientCacheKey);
 

    if (!cachedGradient) {
      const gradient = generateBackgroundGradient(cachedData);
      cache.put(gradientCacheKey, gradient, cacheExpiry);
      cachedGradient = gradient;
    }

    return res.status(200).json({ gradient: cachedGradient });
  }

  // Default response with sunrise-sunset data
  return res.status(200).json(cachedData);
}
