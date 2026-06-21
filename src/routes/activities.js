const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = require("../db");

function mapActivityDTO(act) {
  return {
    name: act.name,
    description: act.notes,
    time: act.duration_mins,
    location: act.type
  };
}

async function verifyStopAccess(stopId, userId) {
  const stop = await prisma.stop.findUnique({
    where: { id: stopId },
    include: { trip: { include: { collaborators: true } } },
  });
  if (!stop) return { stop: null, allowed: false };
  const isOwner = stop.trip.user_id === userId;
  const isCollab = stop.trip.collaborators.some((c) => c.user_id === userId);
  return { stop, allowed: isOwner || isCollab };
}

// POST /api/stops/:stopId/activities — create activity
router.post("/:stopId/activities", auth, async (req, res) => {
  try {
    const { stop, allowed } = await verifyStopAccess(req.params.stopId, req.user.id);
    if (!stop) return res.status(404).json({ error: "Stop not found." });
    if (!allowed) return res.status(403).json({ error: "Forbidden." });

    const { name, type, cost, duration_mins, notes } = req.body;
    if (!name || !type) return res.status(400).json({ error: "name and type required." });

    const activity = await prisma.activity.create({
      data: {
        stop_id: req.params.stopId,
        name,
        type,
        cost: cost || 0,
        duration_mins: duration_mins || 60,
        notes: notes || null,
      },
      select: {
        id: true, name: true, type: true, cost: true, duration_mins: true, notes: true, is_paid: true
      }
    });
    return res.status(201).json(mapActivityDTO(activity));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// PUT /api/activities/:id — update activity
router.put("/:id", auth, async (req, res) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: { stop: { include: { trip: { include: { collaborators: true } } } } },
    });
    if (!activity) return res.status(404).json({ error: "Activity not found." });

    const trip = activity.stop.trip;
    const isOwner = trip.user_id === req.user.id;
    const isCollab = trip.collaborators.some((c) => c.user_id === req.user.id);
    if (!isOwner && !isCollab) return res.status(403).json({ error: "Forbidden." });

    const { name, type, cost, duration_mins, notes } = req.body;
    const updated = await prisma.activity.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(cost !== undefined && { cost }),
        ...(duration_mins !== undefined && { duration_mins }),
        ...(notes !== undefined && { notes }),
      },
      select: {
        id: true, name: true, type: true, cost: true, duration_mins: true, notes: true, is_paid: true
      }
    });
    return res.status(200).json(mapActivityDTO(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE /api/activities/:id — delete activity
router.delete("/:id", auth, async (req, res) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: { stop: { include: { trip: { include: { collaborators: true } } } } },
    });
    if (!activity) return res.status(404).json({ error: "Activity not found." });

    const trip = activity.stop.trip;
    const isOwner = trip.user_id === req.user.id;
    const isCollab = trip.collaborators.some((c) => c.user_id === req.user.id);
    if (!isOwner && !isCollab) return res.status(403).json({ error: "Forbidden." });

    await prisma.activity.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: "Activity deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// PATCH /api/activities/:id/toggle-paid
router.patch("/:id/toggle-paid", auth, async (req, res) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: { stop: { include: { trip: { include: { collaborators: true } } } } },
    });
    if (!activity) return res.status(404).json({ error: "Activity not found." });

    const trip = activity.stop.trip;
    const isOwner = trip.user_id === req.user.id;
    const isCollab = trip.collaborators.some((c) => c.user_id === req.user.id);
    if (!isOwner && !isCollab) return res.status(403).json({ error: "Forbidden." });

    const updated = await prisma.activity.update({
      where: { id: req.params.id },
      data: { is_paid: !activity.is_paid },
      select: {
        id: true, name: true, type: true, cost: true, duration_mins: true, notes: true, is_paid: true
      }
    });
    return res.status(200).json(mapActivityDTO(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
