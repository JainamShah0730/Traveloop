const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = require("../db");

async function canAccess(tripId, userId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { collaborators: true },
  });
  if (!trip) return { trip: null, allowed: false, isOwner: false };
  const isOwner = trip.user_id === userId;
  const isCollab = trip.collaborators.some((c) => c.user_id === userId);
  return { trip, allowed: isOwner || isCollab, isOwner };
}

router.get("/", auth, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { user_id: req.user.id },
          { collaborators: { some: { user_id: req.user.id } } },
        ],
      },
      include: { stops: { include: { activities: { select: { cost: true } } } } },
      orderBy: { created_at: "desc" },
    });
    const tripIds = trips.map(t => t.id);
    const travelerCounts = await prisma.tripTraveler.groupBy({
      by: ['tripId'],
      where: { tripId: { in: tripIds } },
      _count: { id: true }
    });
    
    const countMap = {};
    travelerCounts.forEach(c => {
      if (c.tripId) countMap[c.tripId] = c._count.id;
    });

    const result = trips.map((t) => {
      const stopsCount = t.stops.length;
      const tCount = Math.max(1, countMap[t.id] || 1);
      const totalCost = t.stops.reduce((s, st) => s + st.activities.reduce((a, ac) => a + ac.cost, 0), 0) * tCount;
      const { stops, ...data } = t;
      return { ...data, stops_count: stopsCount, total_activities_cost: totalCost, travelersCount: tCount };
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const raw = req.body;
    const name = raw.name || raw.title;
    const cover_photo = raw.cover_photo || raw.coverImageUrl;
    const start_date = raw.start_date || raw.startDate;
    const end_date = raw.end_date || raw.endDate;
    const total_budget = raw.total_budget || raw.totalBudgetINR || 0;
    const is_public = raw.is_public || false;
    const stops = raw.stops;

    if (!name || !start_date || !end_date) return res.status(400).json({ error: "name/title, start_date/startDate, end_date/endDate required." });
    const slug = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    
    let tripData = {
      user_id: req.user.id, name, cover_photo: cover_photo || null, 
      start_date: new Date(start_date), end_date: new Date(end_date), 
      total_budget: parseFloat(total_budget) || 0, slug, is_public: is_public || false 
    };

    console.log("RECEIVED STOPS LENGTH:", stops ? stops.length : 'undefined or null');

    if (stops && Array.isArray(stops)) {
      tripData.stops = {
        create: stops.map((s) => ({
          city_name: s.city_name || s.city || "City", 
          country: s.country || "Country", 
          lat: s.lat || 0, 
          lng: s.lng || 0,
          from_date: new Date(s.from_date || s.fromDate || start_date), 
          to_date: new Date(s.to_date || s.toDate || end_date), 
          order_index: s.order_index || 0,
          activities: s.activities && Array.isArray(s.activities) ? {
            create: s.activities.map((a) => ({
              name: a.name, type: a.type || 'other', cost: a.cost || 0, duration_mins: a.duration_mins || 60, notes: a.notes || ''
            }))
          } : undefined
        }))
      };
    }

    const trip = await prisma.trip.create({
      data: tripData,
    });
    
    // Create travelers from travelersList or default
    const travelersList = raw.travelersList || [];
    if (travelersList.length > 0) {
      for (const t of travelersList) {
        await prisma.tripTraveler.create({
          data: {
            tripId: trip.id,
            isOwner: t.isOwner || false,
            name: t.name || 'Traveler',
            email: t.email || '',
            phone: t.phone || null,
            age: t.age ? parseInt(t.age) : null,
            mealPref: t.mealPref || null,
            seatPref: t.seatPref || null
          }
        });
      }
    } else {
      // Default owner
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      await prisma.tripTraveler.create({
        data: {
          tripId: trip.id,
          isOwner: true,
          name: user ? user.name : 'You (Owner)',
          email: user ? user.email : 'you@example.com'
        }
      });
    }

    return res.status(201).json(trip);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const { allowed, trip } = await canAccess(req.params.id, req.user.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (!allowed) return res.status(403).json({ error: "Forbidden." });
    const full = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        stops: { orderBy: { order_index: "asc" }, include: { activities: { orderBy: { created_at: "asc" } } } },
        collaborators: { include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } } },
        packing_items: true, notes: true,
      },
    });

    const travelersCount = await prisma.tripTraveler.count({
      where: { tripId: req.params.id }
    });

    const responseData = {
      ...full,
      tripId: full.id,
      title: full.name,
      destination: full.stops[0]?.city_name || 'Destination',
      startDate: full.start_date,
      endDate: full.end_date,
      travelersCount: Math.max(1, travelersCount),
      stops: full.stops.map(stop => {
        const daysMap = {};
        stop.activities.forEach(act => {
          let dayNum = 1;
          const match = act.notes?.match(/Day (\d+)/i);
          if (match) dayNum = parseInt(match[1]);
          if (!daysMap[dayNum]) daysMap[dayNum] = [];
          daysMap[dayNum].push(act);
        });
        const days = Object.keys(daysMap).sort((a,b) => Number(a)-Number(b)).map(dayNumber => ({
          dayNumber: parseInt(dayNumber),
          activities: daysMap[dayNumber]
        }));
        
        return {
          ...stop,
          stopId: stop.id,
          city: stop.city_name,
          days
        };
      })
    };

    return res.status(200).json(responseData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { trip, isOwner } = await canAccess(req.params.id, req.user.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (!isOwner) return res.status(403).json({ error: "Owner only." });
    const { name, cover_photo, start_date, end_date, total_budget, is_public } = req.body;
    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(cover_photo !== undefined && { cover_photo }),
        ...(start_date !== undefined && { start_date: new Date(start_date) }),
        ...(end_date !== undefined && { end_date: new Date(end_date) }),
        ...(total_budget !== undefined && { total_budget }),
        ...(is_public !== undefined && { is_public }),
      },
    });
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── NEW PATCH ROUTE: FULL TRIP AUTO-SAVE SYNC ──
router.patch("/:id", auth, async (req, res) => {
  try {
    const { trip, isOwner } = await canAccess(req.params.id, req.user.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (!isOwner) return res.status(403).json({ error: "Owner only." });

    const { name, cover_photo, start_date, end_date, total_budget, is_public, stops } = req.body;

    // 1. Update trip basic fields
    await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(cover_photo !== undefined && { cover_photo }),
        ...(start_date !== undefined && { start_date: new Date(start_date) }),
        ...(end_date !== undefined && { end_date: new Date(end_date) }),
        ...(total_budget !== undefined && { total_budget }),
        ...(is_public !== undefined && { is_public }),
      },
    });

    // 2. Sync stops and activities
    if (stops && Array.isArray(stops)) {
      // Get current stops
      const currentStops = await prisma.stop.findMany({ where: { trip_id: req.params.id }, select: { id: true } });
      const currentStopIds = currentStops.map((s) => s.id);
      const incomingStopIds = stops.map((s) => s.id).filter(Boolean);

      // Delete stops that are no longer in the payload
      const stopsToDelete = currentStopIds.filter((id) => !incomingStopIds.includes(id));
      if (stopsToDelete.length > 0) {
        await prisma.stop.deleteMany({ where: { id: { in: stopsToDelete } } });
      }

      // Upsert stops and their activities
      for (const stop of stops) {
        const stopData = {
          city_name: stop.city_name,
          country: stop.country,
          lat: stop.lat,
          lng: stop.lng,
          from_date: new Date(stop.from_date),
          to_date: new Date(stop.to_date),
          order_index: stop.order_index,
        };

        let dbStop;
        if (stop.id && currentStopIds.includes(stop.id)) {
          dbStop = await prisma.stop.update({ where: { id: stop.id }, data: stopData });
        } else {
          dbStop = await prisma.stop.create({ data: { ...stopData, trip_id: req.params.id } });
        }

        // Sync activities for this stop
        if (stop.activities && Array.isArray(stop.activities)) {
          const currentActs = await prisma.activity.findMany({ where: { stop_id: dbStop.id }, select: { id: true } });
          const currentActIds = currentActs.map((a) => a.id);
          const incomingActIds = stop.activities.map((a) => a.id).filter(Boolean);

          // Delete removed activities
          const actsToDelete = currentActIds.filter((id) => !incomingActIds.includes(id));
          if (actsToDelete.length > 0) {
            await prisma.activity.deleteMany({ where: { id: { in: actsToDelete } } });
          }

          // Upsert activities
          for (const act of stop.activities) {
            const actData = {
              name: act.name,
              type: act.type,
              cost: act.cost,
              duration_mins: act.duration_mins,
              notes: act.notes,
            };

            if (act.id && currentActIds.includes(act.id)) {
              await prisma.activity.update({ where: { id: act.id }, data: actData });
            } else {
              await prisma.activity.create({ data: { ...actData, stop_id: dbStop.id } });
            }
          }
        }
      }
    }

    const finalTrip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        stops: { orderBy: { order_index: "asc" }, include: { activities: { orderBy: { created_at: "asc" } } } }
      }
    });

    return res.status(200).json(finalTrip);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const { trip, isOwner } = await canAccess(req.params.id, req.user.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (!isOwner) return res.status(403).json({ error: "Owner only." });
    await prisma.trip.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: "Trip deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/:id/budget", auth, async (req, res) => {
  try {
    const { trip, allowed } = await canAccess(req.params.id, req.user.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (!allowed) return res.status(403).json({ error: "Forbidden." });
    const full = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { stops: { include: { activities: true, budgets: true } } },
    });
    const travelersCount = await prisma.tripTraveler.count({
      where: { tripId: req.params.id }
    });
    const travelers = Math.max(1, travelersCount);

    let totalSpent = 0;
    const spentByStop = [];
    const catMap = {};
    for (const stop of full.stops) {
      let ss = 0;
      for (const a of stop.activities) { 
        const cost = a.cost * travelers;
        ss += cost; 
        catMap[a.type] = (catMap[a.type] || 0) + cost; 
      }
      for (const b of stop.budgets) { 
        // if budgets is also per person? Usually budgets isn't used much or is fixed
        ss += b.amount; 
      }
      totalSpent += ss;
      spentByStop.push({ stop_id: stop.id, city_name: stop.city_name, spent: ss });
    }
    const spentByCategory = Object.entries(catMap).map(([type, total]) => ({ type, total }));
    const final_total_budget = (full.total_budget || 0) * travelers;
    return res.status(200).json({ total_budget: final_total_budget, total_spent: totalSpent, spent_by_stop: spentByStop, spent_by_category: spentByCategory });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/public/:slug", async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { slug: req.params.slug },
      include: { stops: { orderBy: { order_index: "asc" }, include: { activities: { orderBy: { created_at: "asc" } } } }, user: { select: { id: true, name: true, avatar_url: true } } },
    });
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (!trip.is_public) return res.status(403).json({ error: "Not public." });
    return res.status(200).json(trip);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/public/:slug/copy", auth, async (req, res) => {
  try {
    const orig = await prisma.trip.findUnique({
      where: { slug: req.params.slug },
      include: { stops: { include: { activities: true } } },
    });
    if (!orig) return res.status(404).json({ error: "Trip not found." });
    if (!orig.is_public) return res.status(403).json({ error: "Not public." });
    const newSlug = orig.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const newTrip = await prisma.trip.create({
      data: {
        user_id: req.user.id, name: orig.name, cover_photo: orig.cover_photo,
        start_date: orig.start_date, end_date: orig.end_date, total_budget: orig.total_budget,
        slug: newSlug, is_public: false,
        stops: {
          create: orig.stops.map((s) => ({
            city_name: s.city_name, country: s.country, lat: s.lat, lng: s.lng,
            from_date: s.from_date, to_date: s.to_date, order_index: s.order_index,
            activities: { create: s.activities.map((a) => ({ name: a.name, type: a.type, cost: a.cost, duration_mins: a.duration_mins, notes: a.notes })) },
          })),
        },
      },
      include: { stops: { include: { activities: true } } },
    });
    return res.status(201).json(newTrip);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

const { generateItinerary } = require("../services/gemini");

router.post("/:tripId/generate-itinerary", auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { preferences } = req.body;
    
    if (!preferences || !Array.isArray(preferences)) {
      return res.status(400).json({ error: "preferences array required." });
    }

    const { trip, allowed } = await canAccess(tripId, req.user.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (!allowed) return res.status(403).json({ error: "Forbidden." });

    const fullTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { stops: true }
    });

    const destinationName = fullTrip.stops?.[0]?.city_name || fullTrip.name;

    const itineraryJson = await generateItinerary({
      name: fullTrip.name,
      destination: destinationName,
      start_date: fullTrip.start_date.toISOString().split('T')[0],
      end_date: fullTrip.end_date.toISOString().split('T')[0],
      total_budget: fullTrip.total_budget,
      preferences
    });

    if (!Array.isArray(itineraryJson)) {
      throw new Error("AI did not return an array");
    }

    let totalNewBudget = 0;

    // Delete existing stops to replace them entirely, as requested by full regeneration logic
    await prisma.stop.deleteMany({
      where: { trip_id: tripId }
    });

    const createdStops = [];

    // Group items by location
    const locationGroups = {};
    for (const item of itineraryJson) {
      if (!locationGroups[item.location]) {
        locationGroups[item.location] = {
           items: [],
           area: item.area || "Unknown",
           minDay: item.day,
           maxDay: item.day
        };
      }
      locationGroups[item.location].items.push(item);
      if (item.day < locationGroups[item.location].minDay) locationGroups[item.location].minDay = item.day;
      if (item.day > locationGroups[item.location].maxDay) locationGroups[item.location].maxDay = item.day;
    }

    let orderIndex = 0;
    for (const location of Object.keys(locationGroups)) {
      const group = locationGroups[location];
      const fromDate = new Date(fullTrip.start_date);
      fromDate.setDate(fromDate.getDate() + (group.minDay - 1));
      const toDate = new Date(fullTrip.start_date);
      toDate.setDate(toDate.getDate() + (group.maxDay - 1));

      const stop = await prisma.stop.create({
        data: {
          trip_id: tripId,
          city_name: location,
          country: group.area,
          lat: 0,
          lng: 0,
          from_date: fromDate,
          to_date: toDate,
          order_index: orderIndex++,
          activities: {
            create: group.items.map(item => {
              totalNewBudget += Number(item.estimated_budget) || 0;
              return {
                name: item.notes || `Day ${item.day} in ${item.area}`,
                type: "sightseeing", 
                cost: Number(item.cost ?? item.estimated_budget) || 0,
                duration_mins: parseInt(item.duration) || 120,
                notes: `Day ${item.day} ${item.category || ''}`
              };
            })
          }
        },
        include: { activities: true }
      });
      createdStops.push(stop);
    }

    // Update the trip's total budget
    await prisma.trip.update({
      where: { id: tripId },
      data: { total_budget: totalNewBudget }
    });

    return res.status(200).json(createdStops);
  } catch (err) {
    console.error("Generate itinerary error:", err);
    return res.status(500).json({ error: "Failed to generate itinerary." });
  }
});

module.exports = router;
