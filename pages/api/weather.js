import cache from 'memory-cache';

const cacheKey = 'weatherCache';
const cacheExpiry = 15 * 60 * 1000;

export default async function handler(req, res) {
  const { lat = 57.65, lon = 11.916, hour } = req.query;
  const requestedHour = hour ? parseInt(hour, 10) : new Date().getHours();

  let cachedWeather = cache.get(cacheKey);

  if (!cachedWeather) {
    try {
      const openMeteoResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=is_day&timezone=auto&forecast_days=1&forecast_minutely_15=1&hourly=precipitation_probability,weather_code,is_day,temperature_2m,uv_index&forecast_days=1&forecast_hours=6`
      );

      if (!openMeteoResponse.ok) {
        throw new Error(`OpenMeteo API error: ${openMeteoResponse.statusText}`);
      }

      const openMeteoData = await openMeteoResponse.json();

      const hourlyData = openMeteoData.hourly;
      const minsData = openMeteoData.minutely_15;

      const weatherCodeToIcon = (code, isDay) => {
        const dayNight = isDay ? 'd' : 'n';
        const codeMap = {
          0: '01', 1: '01', 2: '02', 3: '03',
          45: '50', 48: '50', 51: '09', 53: '09',
          55: '09', 56: '13', 57: '13', 61: '10',
          63: '10', 65: '10', 66: '13', 67: '13',
          71: '13', 73: '13', 75: '13', 77: '13',
          80: '09', 81: '09', 82: '10', 85: '13',
          86: '13', 95: '11', 96: '11', 99: '11'
        };

        const iconCode = codeMap[code] || '03';
        return `${iconCode}${dayNight}`;
      };

      const hourlyForecast = hourlyData.time.map((time, index) => ({
        time,
        temperature: hourlyData.temperature_2m[index],
        uvIndex: hourlyData.uv_index[index],
        precipitationProbability: hourlyData.precipitation_probability[index],
        weatherCode: hourlyData.weather_code[index],
        isDay: hourlyData.is_day[index] === 1,
        icon: weatherCodeToIcon(hourlyData.weather_code[index], hourlyData.is_day[index] === 1)
      }));

      const nowHour = requestedHour;
      const currentConditions = hourlyForecast.find(h => {
        const forecastTime = new Date(h.time);
        return forecastTime.getHours() === nowHour;
      }) || hourlyForecast[0];

      const maxUvIndex6h = Math.max(...hourlyData.uv_index);

      const highHours = hourlyData.precipitation_probability.filter(prob => prob > 50);
      const hasHighRainProbability = highHours.length >= 2;

      const combinedData = {
        current: {
          temp: currentConditions.temperature,
          weather: {
            icon: currentConditions.icon,
            description: `Weather code: ${currentConditions.weatherCode}`
          }
        },
        hourly: hourlyForecast,
        isDay: currentConditions.isDay,
        maxUvIndex6h,
        hasRainAlert: hasHighRainProbability,
        currentUvIndex: currentConditions.uvIndex,
        lastUpdated: new Date().toISOString(),
        location: { lat, lon }
      };

      cache.put(cacheKey, combinedData, cacheExpiry);
      cachedWeather = combinedData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  }

  return res.status(200).json(cachedWeather);
}