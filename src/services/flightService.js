const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const { Duffel } = require('@duffel/api');
const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN });

// Fetch a real flight price from Duffel
async function getRealPrice(origin, destination, dateStr) {
  try {
    const offerRequest = await duffel.offerRequests.create({
      slices: [{ origin, destination, departure_date: dateStr }],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy'
    });
    if (offerRequest.data.offers && offerRequest.data.offers.length > 0) {
      // Return the cheapest offer amount
      return parseFloat(offerRequest.data.offers[0].total_amount);
    }
  } catch (err) {
    console.log(`Duffel API fallback for ${origin}-${destination} (Requires valid IATA codes):`, err.message);
  }
  return null;
}

// Generate prices for a whole month, using Duffel to anchor the base price
async function generatePriceGrid(origin, destination, month) {
  const [year, monthStr] = month.split('-');
  const daysInMonth = new Date(year, parseInt(monthStr, 10), 0).getDate();
  
  const prices = {};
  let min_price = Infinity;
  let max_price = -Infinity;

  // Try to get a real price for the 15th of the month to use as a realistic base
  const testDate = `${year}-${monthStr}-15`;
  let basePrice = await getRealPrice(origin, destination, testDate);
  
  // Fallback to random if the API call fails (e.g. non-IATA codes were used)
  if (!basePrice) {
    basePrice = 8000 + Math.floor(Math.random() * 5000);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${monthStr}-${d.toString().padStart(2, '0')}`;
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();

    // 10% chance of no flight
    if (Math.random() < 0.1) {
      prices[dateStr] = null;
      continue;
    }

    // Weekends are more expensive
    let price = basePrice;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      price += 1000 + Math.floor(Math.random() * 1500);
    } else {
      price += Math.floor(Math.random() * 1000) - 500;
    }

    // Occasional very cheap or very expensive days
    if (Math.random() < 0.05) price -= 800;
    if (Math.random() < 0.05) price += 2000;

    // Ensure price > 0
    price = Math.max(1500, price);

    prices[dateStr] = price;
    if (price < min_price) min_price = price;
    if (price > max_price) max_price = price;
  }

  return {
    origin,
    destination,
    month,
    currency: 'INR',
    prices,
    min_price,
    max_price
  };
}

async function getPriceGrid(origin, destination, month) {
  const cacheKey = `price-grid:${origin}:${destination}:${month}`;
  
  const cachedData = await redis.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  // Generate or fetch
  const data = await generatePriceGrid(origin, destination, month);

  // Store in cache with 2-hour TTL (7200 seconds)
  await redis.set(cacheKey, data, { ex: 7200 });

  return data;
}

module.exports = {
  getPriceGrid,
  getRealPrice
};
