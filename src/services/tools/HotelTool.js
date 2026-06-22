/**
 * HotelTool — Search hotels at a destination
 * 
 * Returns structured placeholder data tiered by budget/style.
 * Replace with real hotel API (Booking.com, Goibibo, etc.) when available.
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

// Hotel templates per style
const HOTEL_TEMPLATES = {
  budget: [
    { name: 'Zostel', ratingBase: 3.8, amenities: ['WiFi', 'Common Kitchen', 'Lockers'], priceMultiplier: 0.6 },
    { name: 'goSTOPS', ratingBase: 3.5, amenities: ['WiFi', 'Cafe', 'Activities'], priceMultiplier: 0.5 },
    { name: 'Backpacker Panda', ratingBase: 3.6, amenities: ['WiFi', 'Laundry', 'Common Area'], priceMultiplier: 0.55 },
  ],
  comfort: [
    { name: 'Treebo Trend', ratingBase: 4.0, amenities: ['WiFi', 'AC', 'Breakfast', 'Room Service'], priceMultiplier: 1.0 },
    { name: 'FabHotel', ratingBase: 3.9, amenities: ['WiFi', 'AC', 'TV', 'Parking'], priceMultiplier: 0.9 },
    { name: 'Lemon Tree', ratingBase: 4.2, amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym'], priceMultiplier: 1.2 },
  ],
  luxury: [
    { name: 'Taj Hotel', ratingBase: 4.7, amenities: ['WiFi', 'Pool', 'Spa', 'Fine Dining', 'Butler Service'], priceMultiplier: 3.0 },
    { name: 'ITC Grand', ratingBase: 4.6, amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'], priceMultiplier: 2.8 },
    { name: 'The Leela', ratingBase: 4.8, amenities: ['WiFi', 'Pool', 'Spa', 'Golf', 'Concierge'], priceMultiplier: 3.2 },
  ]
};

const HotelTool = {
  async search({ destination, checkin, checkout, budget_per_night, style }) {
    const effectiveStyle = style || 'comfort';
    const cacheKey = `hotel:${destination}:${checkin}:${checkout}:${budget_per_night}:${effectiveStyle}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
    } catch (err) {
      console.warn('Redis get failed (HotelTool):', err.message);
    }

    // Calculate nights
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));

    const templates = HOTEL_TEMPLATES[effectiveStyle] || HOTEL_TEMPLATES.comfort;
    const baseBudget = budget_per_night || 2000;

    const options = templates.map((t, idx) => {
      const pricePerNight = Math.round(baseBudget * t.priceMultiplier * (0.9 + Math.random() * 0.2));
      const rating = Math.round((t.ratingBase + (Math.random() * 0.3 - 0.15)) * 10) / 10;

      return {
        id: `h${idx + 1}-${Date.now()}`,
        name: `${t.name} ${destination}`,
        rating: Math.min(5.0, rating),
        pricePerNight,
        totalCost: pricePerNight * nights,
        nights,
        amenities: t.amenities,
        badge: idx === 0 ? 'Best rated' : idx === 1 ? 'Best value' : 'Budget pick',
        style: effectiveStyle
      };
    });

    // Sort by price
    options.sort((a, b) => a.pricePerNight - b.pricePerNight);

    const result = {
      destination,
      checkin,
      checkout,
      nights,
      style: effectiveStyle,
      options
    };

    // Cache 2 hours
    try {
      await redis.set(cacheKey, JSON.stringify(result), { ex: 7200 });
    } catch (err) {
      console.warn('Redis set failed (HotelTool):', err.message);
    }

    return result;
  }
};

module.exports = { HotelTool };
