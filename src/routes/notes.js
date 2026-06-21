const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = require("../db");

// Helper to verify user can access this trip
async function verifyTripAccess(tripId, userId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { collaborators: true },
  });
  if (!trip) return { allowed: false };
  const isOwner = trip.user_id === userId;
  const isCollab = trip.collaborators.some((c) => c.user_id === userId);
  return { allowed: isOwner || isCollab };
}

// GET /api/notes/user/reminders
router.get("/user/reminders", auth, async (req, res) => {
  try {
    // Find all trips the user has access to
    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { user_id: req.user.id },
          { collaborators: { some: { user_id: req.user.id } } }
        ]
      },
      select: { id: true, name: true }
    });
    
    const tripIds = trips.map(t => t.id);

    const reminders = await prisma.note.findMany({
      where: {
        trip_id: { in: tripIds },
        has_reminder: true,
        is_read: false
      },
      orderBy: { reminder_time: 'asc' },
      select: { id: true, title: true, type: true, content: true, has_reminder: true, reminder_time: true, is_read: true, trip_id: true }
    });

    // Attach trip name for context and strip internal trip_id
    const enrichedReminders = reminders.map(r => {
      const { trip_id, ...safe } = r;
      return {
        ...safe,
        tripName: trips.find(t => t.id === trip_id)?.name || 'Unknown Trip'
      };
    });

    return res.status(200).json(enrichedReminders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/notes/:tripId
router.get("/:tripId", auth, async (req, res) => {
  try {
    const { allowed } = await verifyTripAccess(req.params.tripId, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const notes = await prisma.note.findMany({
      where: { trip_id: req.params.tripId },
      orderBy: { updated_at: 'desc' },
      select: { id: true, title: true, type: true, content: true, has_reminder: true, reminder_time: true, is_read: true }
    });
    return res.status(200).json(notes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/notes/:tripId
router.post("/:tripId", auth, async (req, res) => {
  try {
    const { allowed } = await verifyTripAccess(req.params.tripId, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { title, type, content, has_reminder, reminder_time } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const note = await prisma.note.create({
      data: {
        trip_id: req.params.tripId,
        title,
        type: type || "ideas",
        content,
        has_reminder: has_reminder || false,
        reminder_time: reminder_time ? new Date(reminder_time) : null
      },
      select: { id: true, title: true, type: true, content: true, has_reminder: true, reminder_time: true, is_read: true }
    });
    return res.status(201).json(note);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notes/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!note) return res.status(404).json({ error: "Note not found" });

    const { allowed } = await verifyTripAccess(note.trip_id, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { title, type, content, has_reminder, reminder_time, is_read } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const dataToUpdate = { content };
    if (title !== undefined) dataToUpdate.title = title;
    if (type !== undefined) dataToUpdate.type = type;
    if (has_reminder !== undefined) dataToUpdate.has_reminder = has_reminder;
    if (reminder_time !== undefined) dataToUpdate.reminder_time = reminder_time ? new Date(reminder_time) : null;
    if (is_read !== undefined) dataToUpdate.is_read = is_read;

    const updated = await prisma.note.update({
      where: { id: req.params.id },
      data: dataToUpdate,
      select: { id: true, title: true, type: true, content: true, has_reminder: true, reminder_time: true, is_read: true }
    });
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/notes/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!note) return res.status(404).json({ error: "Note not found" });

    const { allowed } = await verifyTripAccess(note.trip_id, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    await prisma.note.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: "Note deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notes/trip/:tripId/mark-read
router.put("/trip/:tripId/mark-read", auth, async (req, res) => {
  try {
    const { allowed } = await verifyTripAccess(req.params.tripId, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const updated = await prisma.note.updateMany({
      where: {
        trip_id: req.params.tripId,
        has_reminder: true,
        is_read: false
      },
      data: { is_read: true }
    });

    return res.status(200).json({ message: "Marked all as read", count: updated.count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notes/user/reminders/mark-read
router.put("/user/reminders/mark-read", auth, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { user_id: req.user.id },
          { collaborators: { some: { user_id: req.user.id } } }
        ]
      },
      select: { id: true }
    });
    const tripIds = trips.map(t => t.id);

    const updated = await prisma.note.updateMany({
      where: {
        trip_id: { in: tripIds },
        has_reminder: true,
        is_read: false
      },
      data: { is_read: true }
    });

    return res.status(200).json({ message: "Marked all as read", count: updated.count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
