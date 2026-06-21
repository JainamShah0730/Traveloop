const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

function mapActivityDTO(act) {
  return {
    id: act.id,
    name: act.name,
    notes: act.notes,
    duration_mins: act.duration_mins,
    type: act.type,
    cost: act.cost,
    is_paid: act.is_paid
  };
}

function mapStopDTO(stop) {
  return {
    id: stop.id,
    city_name: stop.city_name,
    country: stop.country,
    lat: stop.lat,
    lng: stop.lng,
    from_date: stop.from_date,
    to_date: stop.to_date,
    order_index: stop.order_index,
    activities: stop.activities ? stop.activities.map(mapActivityDTO) : []
  };
}
const prisma = require("../db");

async function verifyTripAccess(tripId, userId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { collaborators: true },
  });
  if (!trip) return { trip: null, allowed: false, isOwner: false };
  const isOwner = trip.user_id === userId;
  const isCollab = trip.collaborators.some((c) => c.user_id === userId);
  return { trip, allowed: isOwner || isCollab, isOwner };
}

// POST /api/trips/:tripId/stops — add stop
router.post("/:tripId/stops", auth, async (req, res) => {
  try {
    const { allowed, trip } = await verifyTripAccess(req.params.tripId, req.user.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (!allowed) return res.status(403).json({ error: "Forbidden." });

    const { city_name, country, lat, lng, from_date, to_date } = req.body;
    if (!city_name || !country || lat == null || lng == null || !from_date || !to_date) {
      return res.status(400).json({ error: "city_name, country, lat, lng, from_date, to_date required." });
    }

    const maxOrder = await prisma.stop.aggregate({
      where: { trip_id: req.params.tripId },
      _max: { order_index: true },
    });
    const order_index = (maxOrder._max.order_index ?? -1) + 1;

    const stop = await prisma.stop.create({
      data: {
        trip_id: req.params.tripId,
        city_name, country,
        lat: parseFloat(lat), lng: parseFloat(lng),
        from_date: new Date(from_date), to_date: new Date(to_date),
        order_index,
      },
      select: {
        id: true, city_name: true, country: true, lat: true, lng: true, from_date: true, to_date: true, order_index: true
      }
    });
    return res.status(201).json(mapStopDTO(stop));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// POST /api/stops/:tripId/stops/ai — add stop with AI generated activities
router.post("/:tripId/stops/ai", auth, async (req, res) => {
  try {
    const { allowed, trip } = await verifyTripAccess(req.params.tripId, req.user.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (!allowed) return res.status(403).json({ error: "Forbidden." });

    const { city_name, country, lat, lng, from_date, to_date } = req.body;
    if (!city_name || !country || lat == null || lng == null || !from_date || !to_date) {
      return res.status(400).json({ error: "city_name, country, lat, lng, from_date, to_date required." });
    }

    const { generateItinerary } = require("../services/gemini");
    const itineraryJson = await generateItinerary({
      name: trip.name,
      destination: city_name,
      start_date: from_date,
      end_date: to_date,
      total_budget: 15000,
      preferences: ["Top attractions", "Local food"]
    });

    const maxOrder = await prisma.stop.aggregate({
      where: { trip_id: req.params.tripId },
      _max: { order_index: true },
    });
    const order_index = (maxOrder._max.order_index ?? -1) + 1;

    const stop = await prisma.stop.create({
      data: {
        trip_id: req.params.tripId,
        city_name, country,
        lat: parseFloat(lat), lng: parseFloat(lng),
        from_date: new Date(from_date), to_date: new Date(to_date),
        order_index,
        activities: {
          create: (Array.isArray(itineraryJson) ? itineraryJson : []).map(item => ({
            name: item.notes || `Day ${item.day} in ${item.area}`,
            type: "sightseeing", 
            cost: Number(item.cost ?? item.estimated_budget) || 0,
            duration_mins: parseInt(item.duration) || 120,
            notes: `Day ${item.day} ${item.category || ''}`.trim()
          }))
        }
      },
      select: {
        id: true, city_name: true, country: true, lat: true, lng: true, from_date: true, to_date: true, order_index: true,
        activities: {
          select: { id: true, name: true, type: true, cost: true, duration_mins: true, notes: true, is_paid: true }
        }
      }
    });
    return res.status(201).json(mapStopDTO(stop));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// PUT /api/stops/:id — update stop
router.put("/:id", auth, async (req, res) => {
  try {
    const stop = await prisma.stop.findUnique({ where: { id: req.params.id } });
    if (!stop) return res.status(404).json({ error: "Stop not found." });

    const { allowed } = await verifyTripAccess(stop.trip_id, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden." });

    const { city_name, country, lat, lng, from_date, to_date, order_index } = req.body;
    const updated = await prisma.stop.update({
      where: { id: req.params.id },
      data: {
        ...(city_name !== undefined && { city_name }),
        ...(country !== undefined && { country }),
        ...(lat !== undefined && { lat: parseFloat(lat) }),
        ...(lng !== undefined && { lng: parseFloat(lng) }),
        ...(from_date !== undefined && { from_date: new Date(from_date) }),
        ...(to_date !== undefined && { to_date: new Date(to_date) }),
        ...(order_index !== undefined && { order_index }),
      },
      select: {
        id: true, city_name: true, country: true, lat: true, lng: true, from_date: true, to_date: true, order_index: true
      }
    });
    return res.status(200).json(mapStopDTO(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE /api/stops/:id — delete stop (cascades)
router.delete("/:id", auth, async (req, res) => {
  try {
    const stop = await prisma.stop.findUnique({ where: { id: req.params.id } });
    if (!stop) return res.status(404).json({ error: "Stop not found." });

    const { allowed } = await verifyTripAccess(stop.trip_id, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden." });

    await prisma.stop.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: "Stop deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// PUT /api/trips/:tripId/stops/reorder — reorder stops
router.put("/:tripId/stops/reorder", auth, async (req, res) => {
  try {
    const { allowed } = await verifyTripAccess(req.params.tripId, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden." });

    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: "orderedIds array required." });

    const updates = orderedIds.map((id, index) =>
      prisma.stop.update({ where: { id }, data: { order_index: index } })
    );
    await prisma.$transaction(updates);

    return res.status(200).json({ message: "Reordered." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
