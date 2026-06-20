const { Redis } = require('@upstash/redis');

let redis;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  redis = {
    get: async () => null,
    set: async () => null
  };
}
const { Duffel } = require('@duffel/api');
const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || 'dummy_token' });

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
  
  let cachedData = null;
  try {
    cachedData = await redis.get(cacheKey);
  } catch (err) {
    console.warn('Redis get failed (PriceGrid), bypassing cache:', err.message);
  }
  
  if (cachedData) {
    return cachedData;
  }

  // Generate or fetch
  const data = await generatePriceGrid(origin, destination, month);

  // Store in cache with 2-hour TTL (7200 seconds)
  try {
    await redis.set(cacheKey, data, { ex: 7200 });
  } catch (err) {
    console.warn('Redis set failed (PriceGrid):', err.message);
  }

  return data;
}

async function generateFlightOptions(origin, destination, date, travelers, basePrice) {
  const travelersCount = parseInt(travelers, 10) || 1;
  const base = parseInt(basePrice, 10) || 4850;

  const flights = [
    {
      id: `f1-${Date.now()}`,
      airline: "IndiGo",
      flightNo: `6E-${Math.floor(Math.random() * 900) + 100}`,
      departTime: "06:20",
      arriveTime: "07:55",
      duration: "1h 35m",
      stops: 0,
      pricePerPerson: base,
      totalPrice: base * travelersCount,
      badge: "Cheapest",
      aircraft: "Airbus A320"
    },
    {
      id: `f2-${Date.now()}`,
      airline: "Air India",
      flightNo: `AI-${Math.floor(Math.random() * 900) + 100}`,
      departTime: "08:45",
      arriveTime: "10:20",
      duration: "1h 35m",
      stops: 0,
      pricePerPerson: base + 550,
      totalPrice: (base + 550) * travelersCount,
      badge: "Best value",
      aircraft: "Boeing 737"
    },
    {
      id: `f3-${Date.now()}`,
      airline: "SpiceJet",
      flightNo: `SG-${Math.floor(Math.random() * 900) + 100}`,
      departTime: "14:10",
      arriveTime: "15:50",
      duration: "1h 40m",
      stops: 0,
      pricePerPerson: base + 250,
      totalPrice: (base + 250) * travelersCount,
      badge: "Fastest",
      aircraft: "Boeing 737 MAX"
    }
  ];

  // Sort by price (cheapest first)
  flights.sort((a, b) => a.totalPrice - b.totalPrice);

  // Assign badges correctly
  flights[0].badge = "Cheapest";
  
  // Find fastest
  let fastestIdx = 0;
  let minDuration = Infinity;
  flights.forEach((f, idx) => {
    const [h, m] = f.duration.split(/[hm]/).map(x => parseInt(x.trim(), 10) || 0);
    const totalMins = h * 60 + m;
    if (totalMins < minDuration) {
      minDuration = totalMins;
      fastestIdx = idx;
    }
  });

  flights.forEach((f, idx) => {
    if (idx === 0) return; // cheapest already set
    if (idx === fastestIdx && f.badge !== "Cheapest") {
      f.badge = "Fastest";
    } else {
      f.badge = "Best value";
    }
  });

  return {
    date,
    origin,
    destination,
    travelers: travelersCount,
    flights
  };
}

async function getFlightOptions(origin, destination, date, travelers = 1, basePrice = null) {
  const cacheKey = `flights:options:${origin}:${destination}:${date}:${basePrice || 'default'}`;
  let cachedData = null;
  try {
    cachedData = await redis.get(cacheKey);
  } catch (err) {
    console.warn('Redis get failed (FlightOptions), bypassing cache:', err.message);
  }
  
  if (cachedData) {
    return cachedData;
  }

  const data = await generateFlightOptions(origin, destination, date, travelers, basePrice);

  // Store in cache with 1-hour TTL (3600 seconds)
  try {
    await redis.set(cacheKey, data, { ex: 3600 });
  } catch (err) {
    console.warn('Redis set failed (FlightOptions):', err.message);
  }

  return data;
}

module.exports = {
  getPriceGrid,
  getRealPrice,
  getFlightOptions
};
