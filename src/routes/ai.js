const express = require("express");
const auth = require("../middleware/auth");
const { suggestActivities, generatePackingList } = require("../services/gemini");

const router = express.Router();
const prisma = require("../db");

// POST /api/ai/suggest-activities
router.post("/suggest-activities", auth, async (req, res) => {
  try {
    const { stopId, travelStyle } = req.body;
    if (!stopId || !travelStyle) {
      return res.status(400).json({ error: "stopId and travelStyle required." });
    }

    const stop = await prisma.stop.findUnique({
      where: { id: stopId },
      include: {
        activities: { select: { name: true } },
        trip: { include: { collaborators: true } },
      },
    });

    if (!stop) return res.status(404).json({ error: "Stop not found." });

    const trip = stop.trip;
    const isOwner = trip.user_id === req.user.id;
    const isCollab = trip.collaborators.some((c) => c.user_id === req.user.id);
    if (!isOwner && !isCollab) return res.status(403).json({ error: "Forbidden." });

    const existingActivities = stop.activities.map((a) => a.name);

    const suggestions = await suggestActivities({
      cityName: stop.city_name,
      country: stop.country,
      travelStyle,
      existingActivities,
    });

    return res.status(200).json(suggestions);
  } catch (err) {
    console.error("AI suggest-activities error:", err);
    return res.status(500).json({ error: "AI service failed." });
  }
});

// POST /api/ai/packing-list
router.post("/packing-list", auth, async (req, res) => {
  try {
    const { tripId } = req.body;
    if (!tripId) return res.status(400).json({ error: "tripId required." });

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        collaborators: true,
        stops: { include: { activities: { select: { type: true } } } },
      },
    });

    if (!trip) return res.status(404).json({ error: "Trip not found." });

    const isOwner = trip.user_id === req.user.id;
    const isCollab = trip.collaborators.some((c) => c.user_id === req.user.id);
    if (!isOwner && !isCollab) return res.status(403).json({ error: "Forbidden." });

    const destinations = trip.stops.map((s) => s.city_name);
    const activityTypes = [...new Set(trip.stops.flatMap((s) => s.activities.map((a) => a.type)))];

    const startMonth = new Date(trip.start_date).getMonth();
    let season;
    if (startMonth >= 2 && startMonth <= 4) season = "spring";
    else if (startMonth >= 5 && startMonth <= 7) season = "summer";
    else if (startMonth >= 8 && startMonth <= 9) season = "autumn";
    else if (startMonth === 10 || startMonth === 1) season = "winter";
    else season = "monsoon";

    const diffMs = new Date(trip.end_date) - new Date(trip.start_date);
    const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const packingList = await generatePackingList({
      destinations,
      totalDays,
      activityTypes,
      season,
    });

    return res.status(200).json(packingList);
  } catch (err) {
    console.error("AI packing-list error:", err);
    return res.status(500).json({ error: "AI service failed." });
  }
});

module.exports = router;
