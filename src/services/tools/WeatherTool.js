/**
 * WeatherTool — Get weather forecast for a destination
 * 
 * Uses wttr.in free API (no key needed).
 * Gracefully falls back on failure.
 */

const { Redis } = require('@upstash/redis');

let redis;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  redis = { get: async () => null, set: async () => null };
}

const WeatherTool = {
  async getForecast({ destination, start_date, end_date }) {
    const cacheKey = `weather:${destination}:${start_date}:${end_date}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
    } catch (err) {
      console.warn('Redis get failed (WeatherTool):', err.message);
    }

    try {
      const url = `https://wttr.in/${encodeURIComponent(destination)}?format=j1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`wttr.in responded with ${res.status}`);

      const weather = await res.json();
      const forecast = (weather.weather || []).slice(0, 7).map((day) => ({
        date: day.date,
        maxTempC: day.maxtempC,
        minTempC: day.mintempC,
        description: day.hourly?.[4]?.weatherDesc?.[0]?.value || 'Clear',
        chanceOfRain: day.hourly?.[4]?.chanceofrain || '0'
      }));

      const result = {
        destination,
        summary: forecast.length > 0
          ? `${forecast[0].description}, ${forecast[0].maxTempC}°C high`
          : 'Weather data unavailable',
        forecast,
        travelAdvisory: forecast.length > 0 && parseInt(forecast[0].chanceOfRain) > 60
          ? 'High chance of rain — pack waterproofs and schedule indoor activities'
          : null
      };

      // Cache 6 hours
      try {
        await redis.set(cacheKey, JSON.stringify(result), { ex: 21600 });
      } catch (err) {
        console.warn('Redis set failed (WeatherTool):', err.message);
      }

      return result;
    } catch (err) {
      console.warn('WeatherTool fetch failed:', err.message);
      return {
        destination,
        summary: 'Weather data unavailable',
        forecast: [],
        travelAdvisory: null,
        error: 'Could not fetch weather data'
      };
    }
  }
};

module.exports = { WeatherTool };
