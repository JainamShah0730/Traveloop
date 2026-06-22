/**
 * MapsTool — Get route/distance between two places
 * 
 * Placeholder estimation by transport mode.
 * Replace with Google Maps Distance Matrix API when GOOGLE_MAPS_API_KEY is configured.
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

const MapsTool = {
  async getRoute({ origin, destination, mode }) {
    const cacheKey = `route:${origin}:${destination}:${mode}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
    } catch (err) {
      console.warn('Redis get failed (MapsTool):', err.message);
    }

    // Speed estimates by mode (km/h)
    const modeEstimates = {
      walking: 5,
      transit: 20,
      taxi: 30,
      driving: 40
    };
    const speed = modeEstimates[mode] || 20;

    // Rough distance estimate (random 2-20 km for same-city routes)
    const distanceKm = Math.round((2 + Math.random() * 18) * 10) / 10;
    const durationMins = Math.round((distanceKm / speed) * 60);

    const result = {
      origin,
      destination,
      mode,
      distanceKm,
      durationMins,
      note: `Estimated ${durationMins} min from ${origin} to ${destination} by ${mode} (~${distanceKm} km)`,
      isEstimate: true,
      apiNeeded: process.env.GOOGLE_MAPS_API_KEY ? null : 'GOOGLE_MAPS_API_KEY not configured — using estimate'
    };

    // Cache 24 hours
    try {
      await redis.set(cacheKey, JSON.stringify(result), { ex: 86400 });
    } catch (err) {
      console.warn('Redis set failed (MapsTool):', err.message);
    }

    return result;
  }
};

module.exports = { MapsTool };
