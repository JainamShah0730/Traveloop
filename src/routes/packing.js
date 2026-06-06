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

// GET /api/packing/:tripId
router.get("/:tripId", auth, async (req, res) => {
  try {
    const { allowed } = await verifyTripAccess(req.params.tripId, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const items = await prisma.packingItem.findMany({
      where: { trip_id: req.params.tripId },
      orderBy: { category: 'asc' }
    });
    return res.status(200).json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/packing/:tripId
router.post("/:tripId", auth, async (req, res) => {
  try {
    const { allowed } = await verifyTripAccess(req.params.tripId, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { name, category } = req.body;
    if (!name || !category) return res.status(400).json({ error: "Name and category required" });

    const item = await prisma.packingItem.create({
      data: {
        trip_id: req.params.tripId,
        name,
        category,
        is_checked: false
      }
    });
    return res.status(201).json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/packing/:id/toggle
router.put("/:id/toggle", auth, async (req, res) => {
  try {
    const item = await prisma.packingItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const { allowed } = await verifyTripAccess(item.trip_id, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const updated = await prisma.packingItem.update({
      where: { id: req.params.id },
      data: { is_checked: !item.is_checked }
    });
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/packing/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await prisma.packingItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const { allowed } = await verifyTripAccess(item.trip_id, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    await prisma.packingItem.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: "Item deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
