const express = require('express');
const router = express.Router();
const prisma = require("../db");
const auth = require('../middleware/auth');

// 1. GET /api/destinations
router.get('/destinations', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({
      where: { is_active: true },
      include: {
        _count: {
          select: { packages: true }
        }
      }
    });

    const response = destinations.map(dest => ({
      id: dest.id,
      name: dest.name,
      country: dest.country,
      region: dest.region,
      type: dest.type,
      cover_photo: dest.cover_photo,
      description: dest.description,
      package_count: dest._count.packages
    }));

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. GET /api/destinations/:id/packages
router.get('/destinations/:id/packages', async (req, res) => {
  try {
    const { id } = req.params;
    const destination = await prisma.destination.findUnique({
      where: { id },
      include: {
        packages: {
          include: {
            budgetTiers: true
          }
        }
      }
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    // Sort budget tiers for each package
    const packages = destination.packages.map(pkg => {
      const sortedTiers = [...pkg.budgetTiers].sort((a, b) => {
        const order = { 'Backpacker': 1, 'Standard': 2, 'Premium': 3 };
        return (order[a.tier_name] || 99) - (order[b.tier_name] || 99);
      });
      return { ...pkg, budgetTiers: sortedTiers };
    });

    res.json({ destination, packages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. GET /api/destinations/:id/packages/suggest
router.get('/destinations/:id/packages/suggest', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Missing dates' });
    }

    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    
    const packages = await prisma.travelPackage.findMany({
      where: { destination_id: id },
      include: { budgetTiers: true }
    });

    if (packages.length === 0) {
      return res.json({ calculated_days: days, suggestions: [] });
    }

    // Sort by closeness to requested days
    const sortedPackages = packages.map(pkg => {
      const diff = Math.abs(pkg.duration_days - days);
      return { pkg, diff };
    }).sort((a, b) => a.diff - b.diff);

    const suggestions = sortedPackages.slice(0, 2).map(item => {
      const pkg = item.pkg;
      // Sort budget tiers
      const sortedTiers = [...pkg.budgetTiers].sort((a, b) => {
        const order = { 'Backpacker': 1, 'Standard': 2, 'Premium': 3 };
        return (order[a.tier_name] || 99) - (order[b.tier_name] || 99);
      });
      pkg.budgetTiers = sortedTiers;

      return {
        package: pkg,
        match_type: item.pkg.duration_days === days ? 'exact' : 'closest'
      };
    });

    res.json({ calculated_days: days, suggestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. POST /api/trips/from-package
const CITY_COORDS = {
  'Srinagar': { lat: 34.0837, lng: 74.7973 },
  'Gulmarg': { lat: 34.0484, lng: 74.3805 },
  'Pahalgam': { lat: 34.0161, lng: 75.3150 },
  'Sonamarg': { lat: 34.3025, lng: 75.2953 },
  'Leh': { lat: 34.1526, lng: 77.5771 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Jodhpur': { lat: 26.2389, lng: 73.0243 },
  'Udaipur': { lat: 24.5854, lng: 73.7125 },
  'Jaisalmer': { lat: 26.9157, lng: 70.9083 },
  'Pushkar': { lat: 26.4897, lng: 74.5511 },
  'Panaji': { lat: 15.4909, lng: 73.8278 },
  'North Goa': { lat: 15.5631, lng: 73.8146 },
  'South Goa': { lat: 15.2832, lng: 74.0539 },
  'Shimla': { lat: 31.1048, lng: 77.1734 },
  'Manali': { lat: 32.2432, lng: 77.1892 },
  'Kasol': { lat: 32.0100, lng: 77.3150 },
  'Kufri': { lat: 31.0987, lng: 77.2671 },
  'Kochi': { lat: 9.9312, lng: 76.2673 },
  'Munnar': { lat: 10.0889, lng: 77.0595 },
  'Alleppey': { lat: 9.4981, lng: 76.3388 },
  'Kovalam': { lat: 8.3988, lng: 76.9828 },
  'Agra': { lat: 27.1767, lng: 78.0081 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Kyoto': { lat: 35.0116, lng: 135.7681 },
  'Osaka': { lat: 34.6937, lng: 135.5023 },
  'Hakone': { lat: 35.2327, lng: 139.1070 },
  'Takayama': { lat: 36.1462, lng: 137.2522 },
  'Kanazawa': { lat: 36.5613, lng: 136.6562 },
  'Hiroshima': { lat: 34.3853, lng: 132.4553 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Florence': { lat: 43.7696, lng: 11.2558 },
  'Venice': { lat: 45.4408, lng: 12.3155 },
  'Ubud': { lat: -8.5069, lng: 115.2625 },
  'Seminyak': { lat: -8.6913, lng: 115.1686 },
  'Uluwatu': { lat: -8.8291, lng: 115.0849 },
  'Nusa Penida': { lat: -8.7275, lng: 115.5444 },
  'Manhattan': { lat: 40.7831, lng: -73.9712 },
  'Brooklyn': { lat: 40.6782, lng: -73.9442 },
  'Queens': { lat: 40.7282, lng: -73.7949 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Versailles': { lat: 48.8049, lng: 2.1204 },
  'Loire Valley': { lat: 47.3499, lng: 0.6863 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Phuket': { lat: 7.8804, lng: 98.3923 },
  'Chiang Mai': { lat: 18.7883, lng: 98.9853 },
  'Koh Samui': { lat: 9.5120, lng: 100.0136 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
  'Istanbul': { lat: 41.0082, lng: 28.9784 },
  'Cappadocia': { lat: 38.6431, lng: 34.8289 },
  'Ephesus': { lat: 37.9415, lng: 27.3418 },
  'Athens': { lat: 37.9838, lng: 23.7275 },
  'Santorini': { lat: 36.3932, lng: 25.4615 },
  'Mykonos': { lat: 37.4467, lng: 25.3289 },
  'Crete': { lat: 35.2401, lng: 24.4709 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Oxford': { lat: 51.7520, lng: -1.2577 },
  'Edinburgh': { lat: 55.9533, lng: -3.1883 },
  'Bath': { lat: 51.3811, lng: -2.3590 },
};

// Helper: compute the from_date for a given stop index
function calculateFromDate(startDate, stopIndex, daysPerCity) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + stopIndex * daysPerCity);
  return date;
}

// Helper: compute the to_date for a given stop index
function calculateToDate(startDate, stopIndex, daysPerCity, remainingDays, lastIndex) {
  const date = new Date(startDate);
  const extra = stopIndex === lastIndex ? remainingDays : 0;
  date.setDate(date.getDate() + (stopIndex + 1) * daysPerCity + extra);
  return date;
}

// Helper: slice the highlights array for a specific stop
function getHighlightsForStop(highlights, stopIndex, totalStops) {
  const perStop = Math.ceil(highlights.length / totalStops);
  return highlights.slice(stopIndex * perStop, (stopIndex + 1) * perStop);
}

/**
 * Generate a rich day-by-day activity schedule for a stop.
 * Each day gets: breakfast, sightseeing blocks, lunch, dinner, hotel
 * Costs are distributed from the budget tier's per-day price.
 */
function generateDayActivities(city, highlights, dayIndex, pricePerDay, tierName) {
  // Cost distribution based on tier
  const costSplit = {
    food_breakfast: Math.round(pricePerDay * 0.06),
    food_lunch: Math.round(pricePerDay * 0.10),
    food_dinner: Math.round(pricePerDay * 0.14),
    hotel: Math.round(pricePerDay * 0.40),
    transport: Math.round(pricePerDay * 0.10),
    sightseeing: Math.round(pricePerDay * 0.20),
  };

  const activities = [];

  // 1. Breakfast (08:00 - 09:00)
  const breakfastOptions = [
    `Breakfast at local café in ${city}`,
    `Morning breakfast — ${city} specialties`,
    `Hotel breakfast buffet`,
    `Traditional ${city} breakfast`,
  ];
  activities.push({
    name: breakfastOptions[dayIndex % breakfastOptions.length],
    type: 'food',
    cost: costSplit.food_breakfast,
    duration_mins: 60,
    notes: `Day ${dayIndex + 1} breakfast | Start: 08:00`,
  });

  // 2. Morning sightseeing (09:30 - 12:00)
  const morningHighlight = highlights[dayIndex * 2 % highlights.length] || `Explore ${city} morning`;
  activities.push({
    name: morningHighlight,
    type: 'sightseeing',
    cost: Math.round(costSplit.sightseeing * 0.6),
    duration_mins: 150,
    notes: `Day ${dayIndex + 1} morning exploration | Start: 09:30`,
  });

  // 3. Lunch (12:30 - 13:30)
  const lunchOptions = [
    `Lunch at a popular ${city} restaurant`,
    `Local cuisine lunch — ${city} flavors`,
    `Street food lunch tour in ${city}`,
    `Authentic ${city} lunch experience`,
  ];
  activities.push({
    name: lunchOptions[dayIndex % lunchOptions.length],
    type: 'food',
    cost: costSplit.food_lunch,
    duration_mins: 60,
    notes: `Day ${dayIndex + 1} lunch | Start: 12:30`,
  });

  // 4. Afternoon sightseeing (14:00 - 16:30)
  const afternoonHighlight = highlights[(dayIndex * 2 + 1) % highlights.length] || `${city} afternoon exploration`;
  activities.push({
    name: afternoonHighlight,
    type: 'sightseeing',
    cost: Math.round(costSplit.sightseeing * 0.4),
    duration_mins: 150,
    notes: `Day ${dayIndex + 1} afternoon exploration | Start: 14:00`,
  });

  // 5. Local transport / transfers (17:00 - 17:30)
  activities.push({
    name: `Local transport in ${city}`,
    type: 'transport',
    cost: costSplit.transport,
    duration_mins: 30,
    notes: `Day ${dayIndex + 1} transport | Start: 17:00`,
  });

  // 6. Dinner (19:00 - 20:30)
  const dinnerOptions = [
    `Dinner at ${tierName === 'Premium' ? 'fine dining restaurant' : 'popular local restaurant'} in ${city}`,
    `${city} evening dinner experience`,
    `Cultural dinner in ${city}`,
    `Signature ${city} dinner`,
  ];
  activities.push({
    name: dinnerOptions[dayIndex % dinnerOptions.length],
    type: 'food',
    cost: costSplit.food_dinner,
    duration_mins: 90,
    notes: `Day ${dayIndex + 1} dinner | Start: 19:00`,
  });

  // 7. Hotel check-in / overnight (21:00)
  const hotelOptions = {
    'Backpacker': `Hostel stay in ${city}`,
    'Standard': `Hotel stay in ${city}`,
    'Premium': `Luxury hotel stay in ${city}`,
  };
  activities.push({
    name: hotelOptions[tierName] || `Accommodation in ${city}`,
    type: 'hotel',
    cost: costSplit.hotel,
    duration_mins: 480,
    notes: `Day ${dayIndex + 1} accommodation | Check-in: 21:00`,
  });

  return activities;
}

router.post('/trips/from-package', auth, async (req, res) => {
  try {
    const { package_id, budget_tier_id, start_date, custom_trip_name } = req.body;

    if (!package_id || !budget_tier_id || !start_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 30-second timeout guard
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Trip creation timed out')), 30000)
    );

    const creationLogic = async () => {
      const pkg = await prisma.travelPackage.findUnique({
        where: { id: package_id },
        include: { destination: true }
      });

      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }

      const tier = await prisma.budgetTier.findUnique({
        where: { id: budget_tier_id }
      });

      if (!tier) {
        return res.status(404).json({ error: 'Budget tier not found' });
      }

      const startDateObj = new Date(start_date);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(endDateObj.getDate() + pkg.duration_days);

      const slug = `${pkg.destination.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      const cities = pkg.cities_covered;
      const daysPerCity = Math.floor(pkg.duration_days / cities.length);
      const remainingDays = pkg.duration_days % cities.length;
      const lastIndex = cities.length - 1;

      // STEP 1 — Create the trip (sequential, generates trip.id)
      const trip = await prisma.trip.create({
        data: {
          user_id: req.user.id,
          name: custom_trip_name || `${pkg.destination.name} ${pkg.duration_days}-Day Trip`,
          start_date: startDateObj,
          end_date: endDateObj,
          total_budget: tier.total_inr,
          is_public: false,
          slug: slug,
          cover_photo: pkg.destination.cover_photo
        }
      });

      // STEP 2 — Create ALL stops in parallel
      const stopDataArray = cities.map((city, index) => ({
        trip_id: trip.id,
        city_name: city,
        country: pkg.destination.country,
        lat: CITY_COORDS[city]?.lat ?? 0,
        lng: CITY_COORDS[city]?.lng ?? 0,
        from_date: calculateFromDate(startDateObj, index, daysPerCity),
        to_date: calculateToDate(startDateObj, index, daysPerCity, remainingDays, lastIndex),
        order_index: index
      }));

      const stops = await Promise.all(
        stopDataArray.map(data => prisma.stop.create({ data }))
      );

      // STEP 3 — Generate rich day-by-day activities for ALL stops in parallel
      const activityPromises = [];
      stops.forEach((stop, stopIndex) => {
        const stopHighlights = getHighlightsForStop(pkg.highlights, stopIndex, stops.length);
        const cityDays = stopIndex === lastIndex ? daysPerCity + remainingDays : daysPerCity;

        for (let dayIdx = 0; dayIdx < cityDays; dayIdx++) {
          const dayActivities = generateDayActivities(
            stop.city_name,
            stopHighlights,
            dayIdx,
            tier.price_per_day_inr,
            tier.tier_name
          );

          dayActivities.forEach(act => {
            activityPromises.push(
              prisma.activity.create({
                data: {
                  stop_id: stop.id,
                  name: act.name,
                  type: act.type,
                  cost: act.cost,
                  duration_mins: act.duration_mins,
                  notes: act.notes,
                }
              })
            );
          });
        }
      });
      await Promise.all(activityPromises);

      // STEP 4 — Return the trip with nested data in ONE query
      const fullTrip = await prisma.trip.findUnique({
        where: { id: trip.id },
        include: {
          stops: {
            orderBy: { order_index: 'asc' },
            include: { activities: true }
          }
        }
      });

      return res.status(201).json({ success: true, trip: fullTrip });
    };

    await Promise.race([creationLogic(), timeoutPromise]);

  } catch (error) {
    console.error(error);
    if (error.message === 'Trip creation timed out') {
      return res.status(504).json({ error: 'Trip creation timed out. Please try again.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. POST /api/trips/:id/regenerate-activities
// Regenerates activities for an existing trip using the rich day-by-day format.
// This fixes old trips that only have 1 activity per stop with cost=0.
router.post('/trips/:id/regenerate-activities', auth, async (req, res) => {
  try {
    const tripId = req.params.id;
    const { price_per_day_inr, tier_name } = req.body;

    // Default to Standard tier if not provided
    const pricePerDay = price_per_day_inr || 5000;
    const tierLabel = tier_name || 'Standard';

    // Fetch the trip with stops
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stops: {
          orderBy: { order_index: 'asc' },
          include: { activities: true }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete ALL existing activities for all stops
    const stopIds = trip.stops.map(s => s.id);
    await prisma.activity.deleteMany({
      where: { stop_id: { in: stopIds } }
    });

    // Regenerate activities for each stop
    const activityPromises = [];
    trip.stops.forEach((stop) => {
      const fromDate = new Date(stop.from_date);
      const toDate = new Date(stop.to_date);
      const cityDays = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)));

      // Use city name as a highlight if we don't have package highlights
      const highlights = [
        `Explore ${stop.city_name} landmarks`,
        `${stop.city_name} heritage walk`,
        `${stop.city_name} cultural tour`,
        `Hidden gems of ${stop.city_name}`,
        `${stop.city_name} photo walk`,
        `Local markets in ${stop.city_name}`,
      ];

      for (let dayIdx = 0; dayIdx < cityDays; dayIdx++) {
        const dayActivities = generateDayActivities(
          stop.city_name,
          highlights,
          dayIdx,
          pricePerDay,
          tierLabel
        );

        dayActivities.forEach(act => {
          activityPromises.push(
            prisma.activity.create({
              data: {
                stop_id: stop.id,
                name: act.name,
                type: act.type,
                cost: act.cost,
                duration_mins: act.duration_mins,
                notes: act.notes,
              }
            })
          );
        });
      }
    });

    await Promise.all(activityPromises);

    // Return updated trip
    const fullTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stops: {
          orderBy: { order_index: 'asc' },
          include: { activities: true }
        }
      }
    });

    return res.status(200).json({ success: true, trip: fullTrip });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
