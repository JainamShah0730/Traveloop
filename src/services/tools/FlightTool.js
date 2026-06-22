/**
 * FlightTool — Search flights between cities
 * 
 * Returns structured placeholder data with caching.
 * Replace the placeholder logic with real Amadeus/Duffel API when available.
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

const FlightTool = {
  async search({ origin, destination, depart_date, return_date, travelers }) {
    const cacheKey = `flight:${origin}:${destination}:${depart_date}:${travelers}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
    } catch (err) {
      console.warn('Redis get failed (FlightTool):', err.message);
    }

    // Structured placeholder — replace with real Amadeus/Skyscanner API call
    const basePrice = 4000 + Math.floor(Math.random() * 3000);
    const result = {
      origin,
      destination,
      depart_date,
      return_date: return_date || null,
      travelers,
      options: [
        {
          id: `f1-${Date.now()}`,
          airline: 'IndiGo',
          flightNo: `6E-${Math.floor(Math.random() * 900) + 100}`,
          departTime: '06:20',
          arriveTime: '07:55',
          duration: '1h 35m',
          stops: 0,
          pricePerPerson: basePrice,
          badge: 'Cheapest'
        },
        {
          id: `f2-${Date.now()}`,
          airline: 'Air India',
          flightNo: `AI-${Math.floor(Math.random() * 900) + 100}`,
          departTime: '08:45',
          arriveTime: '10:20',
          duration: '1h 35m',
          stops: 0,
          pricePerPerson: basePrice + Math.floor(Math.random() * 1500) + 500,
          badge: 'Best value'
        },
        {
          id: `f3-${Date.now()}`,
          airline: 'SpiceJet',
          flightNo: `SG-${Math.floor(Math.random() * 900) + 100}`,
          departTime: '14:10',
          arriveTime: '15:50',
          duration: '1h 40m',
          stops: 0,
          pricePerPerson: basePrice + Math.floor(Math.random() * 800) + 200,
          badge: 'Fastest'
        }
      ]
    };

    // Cache 1 hour
    try {
      await redis.set(cacheKey, JSON.stringify(result), { ex: 3600 });
    } catch (err) {
      console.warn('Redis set failed (FlightTool):', err.message);
    }

    return result;
  }
};

module.exports = { FlightTool };
