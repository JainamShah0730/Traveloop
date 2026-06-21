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
function generateDayActivities(city, highlights, dayIndex, pricePerDay, tierName, absoluteDayNumber = dayIndex + 1) {
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
    notes: `Day ${absoluteDayNumber} breakfast | Start: 08:00`,
  });

  // 2. Morning sightseeing (09:30 - 12:00)
  const morningHighlight = highlights[dayIndex * 2 % highlights.length] || `Explore ${city} morning`;
  activities.push({
    name: morningHighlight,
    type: 'sightseeing',
    cost: Math.round(costSplit.sightseeing * 0.6),
    duration_mins: 150,
    notes: `Day ${absoluteDayNumber} morning exploration | Start: 09:30`,
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
    notes: `Day ${absoluteDayNumber} lunch | Start: 12:30`,
  });

  // 4. Afternoon sightseeing (14:00 - 16:30)
  const afternoonHighlight = highlights[(dayIndex * 2 + 1) % highlights.length] || `${city} afternoon exploration`;
  activities.push({
    name: afternoonHighlight,
    type: 'sightseeing',
    cost: Math.round(costSplit.sightseeing * 0.4),
    duration_mins: 150,
    notes: `Day ${absoluteDayNumber} afternoon exploration | Start: 14:00`,
  });

  // 5. Local transport / transfers (17:00 - 17:30)
  activities.push({
    name: `Local transport in ${city}`,
    type: 'transport',
    cost: costSplit.transport,
    duration_mins: 30,
    notes: `Day ${absoluteDayNumber} transport | Start: 17:00`,
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
    notes: `Day ${absoluteDayNumber} dinner | Start: 19:00`,
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
    notes: `Day ${absoluteDayNumber} accommodation | Check-in: 21:00`,
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
      let absoluteDayCounter = 1;

      stops.forEach((stop, stopIndex) => {
        const stopHighlights = getHighlightsForStop(pkg.highlights, stopIndex, stops.length);
        const cityDays = stopIndex === lastIndex ? daysPerCity + remainingDays : daysPerCity;

        for (let dayIdx = 0; dayIdx < cityDays; dayIdx++) {
          const dayActivities = generateDayActivities(
            stop.city_name,
            stopHighlights,
            dayIdx,
            tier.price_per_day_inr,
            tier.tier_name,
            absoluteDayCounter
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
          
          absoluteDayCounter++;
        }
      });
      await Promise.all(activityPromises);

      // STEP 4 — Return the trip with nested data in ONE query
      const fullTrip = await prisma.trip.findUnique({
        where: { id: trip.id },
        select: {
          id: true, name: true, cover_photo: true, start_date: true, end_date: true, total_budget: true, is_public: true,
          stops: {
            orderBy: { order_index: 'asc' },
            select: {
              id: true, city_name: true, country: true, lat: true, lng: true, from_date: true, to_date: true, order_index: true,
              activities: {
                orderBy: { created_at: 'asc' },
                select: { id: true, name: true, type: true, cost: true, duration_mins: true, notes: true, is_paid: true }
              }
            }
          }
        }
      });

      // Add default empty arrays for relations so frontend doesn't break
      const tripResponse = {
        ...fullTrip,
        collaborators: [],
        packing_items: [],
        notes: [],
        travelersCount: 1
      };

      return res.status(201).json({ success: true, trip: tripResponse });
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

    const { canAccessTrip } = require("../utils/tripAccess");
    const { allowed } = await canAccessTrip(tripId, req.user.id);
    if (!allowed) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete ALL existing activities for all stops
    const stopIds = trip.stops.map(s => s.id);
    await prisma.activity.deleteMany({
      where: { stop_id: { in: stopIds } }
    });

    // Regenerate activities for each stop
    const activityPromises = [];
    let absoluteDayCounter = 1;

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
          tierLabel,
          absoluteDayCounter
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
        
        absoluteDayCounter++;
      }
    });

    await Promise.all(activityPromises);

    // Return updated trip
    const fullTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true, name: true, cover_photo: true, start_date: true, end_date: true, total_budget: true, is_public: true,
        stops: {
          orderBy: { order_index: 'asc' },
          select: {
            id: true, city_name: true, country: true, lat: true, lng: true, from_date: true, to_date: true, order_index: true,
            activities: {
              orderBy: { created_at: 'asc' },
              select: { id: true, name: true, type: true, cost: true, duration_mins: true, notes: true, is_paid: true }
            }
          }
        }
      }
    });

    // Add default empty arrays for relations so frontend doesn't break
    const tripResponse = {
      ...fullTrip,
      collaborators: trip.collaborators || [],
      packing_items: trip.packing_items || [],
      notes: trip.notes || [],
      travelersCount: 1 // If this is used, it should be fetched, but usually this route relies on GET /:id reloading
    };

    return res.status(200).json({ success: true, trip: tripResponse });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. GET /api/packages
router.get('/packages', async (req, res) => {
  try {
    const { featured, region, duration, maxBudget, source, style } = req.query;
    
    let whereClause = {};
    if (featured === 'true') whereClause.isFeatured = true;
    if (region) whereClause.region = region;
    if (source) whereClause.source = source;
    // Duration: map '3', '5', '7', '10' filters roughly
    if (duration) {
      if (duration === '10') {
        whereClause.duration_days = { gte: 10 };
      } else {
        whereClause.duration_days = parseInt(duration);
      }
    }
    
    const packages = await prisma.travelPackage.findMany({
      where: whereClause,
      orderBy: featured === 'true' ? { id: 'desc' } : { id: 'desc' },
      include: {
        destination: true,
        budgetTiers: true
      }
    });

    // Post-filter by maxBudget and style if needed
    let filtered = packages;
    if (maxBudget) {
      const budgetLimit = parseInt(maxBudget);
      filtered = filtered.filter(pkg => {
        const minTierPrice = Math.min(...pkg.budgetTiers.map(t => t.total_inr));
        return minTierPrice <= budgetLimit || (pkg.budgetTiers.length === 0);
      });
    }

    if (style) {
      filtered = filtered.filter(pkg => 
        pkg.highlights.some(h => h.toLowerCase().includes(style.toLowerCase())) ||
        pkg.tagline.toLowerCase().includes(style.toLowerCase())
      );
    }

    res.json({ data: filtered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. GET /api/packages/community
router.get('/packages/community', async (req, res) => {
  try {
    const itineraries = await prisma.aiItinerary.findMany({
      where: { isShared: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar_url: true } }
      }
    });

    const data = itineraries.map(it => {
      let preview = {};
      if (typeof it.data === 'string') preview = JSON.parse(it.data);
      else preview = it.data;

      return {
        id: it.id,
        destination: it.destination,
        duration_days: it.duration,
        budget: it.budget,
        user: it.user,
        highlights: preview.days?.slice(0,2).map(d => d.title || d.day) || [],
      };
    });

    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. POST /api/packages/use-community/:itineraryId
router.post('/packages/use-community/:itineraryId', auth, async (req, res) => {
  try {
    const { itineraryId } = req.params;
    
    const original = await prisma.aiItinerary.findUnique({
      where: { id: itineraryId }
    });

    if (!original) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Create a new itinerary for the caller
    const cloned = await prisma.aiItinerary.create({
      data: {
        userId: req.user.id,
        destination: original.destination,
        budget: original.budget,
        duration: original.duration,
        data: original.data,
        isShared: false
      }
    });

    // Mock tripId since full trip creation logic from itinerary is in another endpoint,
    // or just return the cloned itinerary ID so the frontend can redirect
    res.status(201).json({ success: true, tripId: cloned.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 10. POST /api/packages/save-from-copilot
// auth but only admin? We won't strictly check admin here as per user note for testing
router.post('/packages/save-from-copilot', auth, async (req, res) => {
  try {
    const { aiItineraryId, title, coverPhoto, highlights, isFeatured, region } = req.body;
    
    const itinerary = await prisma.aiItinerary.findUnique({
      where: { id: aiItineraryId }
    });

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Parse copilotSeed from itinerary data if possible
    let parsedData = itinerary.data;
    if (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);

    const copilotSeed = {
      destination: itinerary.destination,
      duration: itinerary.duration,
      budget: itinerary.budget,
      // more info could be passed, this is a basic stub
    };

    // Need a destination record, or we just map it loosely. The schema requires destination_id.
    // Let's see if destination exists, or create a dummy one
    let destRecord = await prisma.destination.findFirst({
      where: { name: itinerary.destination }
    });

    if (!destRecord) {
      destRecord = await prisma.destination.create({
        data: {
          name: itinerary.destination,
          country: 'Unknown',
          type: 'AI Generated',
          description: 'AI Generated Destination',
          cover_photo: coverPhoto
        }
      });
    }

    const newPackage = await prisma.travelPackage.create({
      data: {
        destination_id: destRecord.id,
        name: title || `${itinerary.destination} AI Trip`,
        duration_days: itinerary.duration,
        tagline: 'AI Generated Trip',
        cities_covered: [itinerary.destination],
        highlights: highlights || [],
        best_season: 'Any',
        source: 'ai_promoted',
        aiItineraryId: itinerary.id,
        copilotSeed: copilotSeed,
        isFeatured: isFeatured || false,
        region: region || 'Unknown'
      }
    });

    res.status(201).json({ success: true, packageId: newPackage.id, destination_id: destRecord.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- V2 ROUTES FOR PACKAGES PAGE REBUILD ---

// 11. GET /api/packages/v2
router.get('/packages/v2', async (req, res) => {
  try {
    const { featured, region, duration, maxBudget, style, limit = 12, cursor } = req.query;

    const where = {
      source: { in: ['manual', 'ai_promoted'] }
    };

    if (featured === 'true') where.isFeatured = true;
    if (region) where.region = region;
    if (duration) where.duration_days = parseInt(duration);
    if (style) {
      // Basic style filtering by tagline/highlights
      where.OR = [
        { tagline: { contains: style, mode: 'insensitive' } },
        { highlights: { has: style } } // Exact match for array elements, fallback to JS filter if needed
      ];
    }

    let packages = await prisma.travelPackage.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { id: 'desc' }
      ],
      take: parseInt(limit),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        destination: true,
        budgetTiers: true
      }
    });

    // Filter by max budget & style in JS due to complex relations / array limitations in Prisma
    if (maxBudget || style) {
      packages = packages.filter(pkg => {
        let match = true;
        if (maxBudget) {
          const budgetLimit = parseInt(maxBudget);
          const minTierPrice = pkg.budgetTiers.length > 0 ? Math.min(...pkg.budgetTiers.map(t => t.total_inr)) : 0;
          if (minTierPrice > budgetLimit) match = false;
        }
        if (style && !where.OR) {
          // If Prisma OR didn't catch it
          const styleLower = style.toLowerCase();
          const styleMatch = pkg.tagline?.toLowerCase().includes(styleLower) || pkg.highlights?.some(h => h?.toLowerCase().includes(styleLower));
          if (!styleMatch) match = false;
        }
        return match;
      });
    }

    // Map to required lean structure
    const leanPackages = packages.map(pkg => {
      const minTierPrice = pkg.budgetTiers.length > 0 ? Math.min(...pkg.budgetTiers.map(t => t.total_inr)) : 0;
      return {
        id: pkg.id,
        title: pkg.name,
        destinationId: pkg.destination_id,
        destination: pkg.destination?.name || 'Unknown',
        country: pkg.destination?.country || 'Unknown',
        region: pkg.region,
        duration: pkg.duration_days,
        pricePerPerson: minTierPrice,
        currency: "INR",
        travelStyle: pkg.tagline,
        source: pkg.source,
        isFeatured: pkg.isFeatured,
        highlights: pkg.highlights,
        coverPhoto: pkg.destination?.cover_photo || null,
        description: pkg.destination?.description || '',
        costBreakdownPerPerson: pkg.costBreakdownPerPerson || null
      };
    });

    res.json({ packages: leanPackages, nextCursor: leanPackages[leanPackages.length - 1]?.id || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 12. GET /api/packages/v2/:id
router.get('/packages/v2/:id', async (req, res) => {
  try {
    const pkg = await prisma.travelPackage.findUnique({
      where: { id: req.params.id },
      include: { destination: true, budgetTiers: true }
    });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    
    // Map to expected structure
    const minTierPrice = pkg.budgetTiers.length > 0 ? Math.min(...pkg.budgetTiers.map(t => t.total_inr)) : 0;
    res.json({
        id: pkg.id,
        title: pkg.name,
        destination: pkg.destination?.name || 'Unknown',
        country: pkg.destination?.country || 'Unknown',
        region: pkg.region,
        duration: pkg.duration_days,
        pricePerPerson: minTierPrice,
        currency: "INR",
        travelStyle: pkg.tagline,
        source: pkg.source,
        isFeatured: pkg.isFeatured,
        highlights: pkg.highlights,
        coverPhoto: pkg.destination?.cover_photo || null,
        description: pkg.destination?.description || '',
        copilotSeed: pkg.copilotSeed,
        costBreakdownPerPerson: pkg.costBreakdownPerPerson || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 13. GET /api/packages/community/list
router.get('/packages/community/list', async (req, res) => {
  try {
    const { limit = 12, cursor } = req.query;

    const itineraries = await prisma.aiItinerary.findMany({
      where: { isShared: true },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true, destination: true, budget: true, duration: true,
        createdAt: true,
        data: true,
        user: { select: { id: true, name: true, avatar_url: true } }
      }
    });

    const previews = itineraries.map(it => {
      let previewData = {};
      if (typeof it.data === 'string') {
        try {
          previewData = JSON.parse(it.data);
        } catch (e) {
          previewData = {};
        }
      } else {
        previewData = it.data || {};
      }

      return {
        id: it.id,
        destination: it.destination,
        budget: it.budget,
        duration: it.duration,
        createdAt: it.createdAt,
        user: it.user,
        dayPreviews: previewData?.days?.slice(0, 2).map(d => d.title || d.day) || []
      };
    });

    res.json({ itineraries: previews, nextCursor: previews[previews.length - 1]?.id || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 14. POST /api/packages/community/use/:itineraryId (Alias)
router.post('/packages/community/use/:itineraryId', auth, async (req, res) => {
  try {
    const source = await prisma.aiItinerary.findUnique({
      where: { id: req.params.itineraryId }
    });
    if (!source) return res.status(404).json({ error: 'Itinerary not found' });

    const copy = await prisma.aiItinerary.create({
      data: {
        userId: req.user.id,
        destination: source.destination,
        budget: source.budget,
        duration: source.duration,
        data: source.data,
        isShared: false
      }
    });

    res.json({ success: true, itinerary: copy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 9. GET /api/packages/:id
router.get('/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await prisma.travelPackage.findUnique({
      where: { id },
      include: { destination: true, budgetTiers: true }
    });

    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    
    res.json({ data: pkg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
