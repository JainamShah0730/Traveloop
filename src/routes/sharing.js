const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = require("../db");

async function getTrip(tripId) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    include: { collaborators: true },
  });
}

// POST /api/trips/:id/invite — invite collaborator (owner only)
router.post("/:id/invite", auth, async (req, res) => {
  try {
    const trip = await getTrip(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (trip.user_id !== req.user.id) return res.status(403).json({ error: "Owner only." });

    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: "email and role required." });

    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) return res.status(404).json({ error: "User not found. They must register first." });

    const existing = trip.collaborators.find((c) => c.user_id === invitee.id);
    if (existing) return res.status(409).json({ error: "Already a collaborator." });

    const collab = await prisma.collaborator.create({
      data: { trip_id: req.params.id, user_id: invitee.id, role },
      include: { user: { select: { name: true, avatar_url: true } } },
    });
    return res.status(201).json(collab);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// GET /api/trips/:id/collaborators — list collaborators
router.get("/:id/collaborators", auth, async (req, res) => {
  try {
    const trip = await getTrip(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });

    const isOwner = trip.user_id === req.user.id;
    const isCollab = trip.collaborators.some((c) => c.user_id === req.user.id);
    if (!isOwner && !isCollab) return res.status(403).json({ error: "Forbidden." });

    const collaborators = await prisma.collaborator.findMany({
      where: { trip_id: req.params.id },
      include: { user: { select: { name: true, email: true, avatar_url: true } } },
    });
    return res.status(200).json(collaborators);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE /api/trips/:id/collaborators/:userId — remove collaborator
router.delete("/:id/collaborators/:userId", auth, async (req, res) => {
  try {
    const trip = await getTrip(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });

    // Cannot remove the trip owner
    if (req.params.userId === trip.user_id) {
      return res.status(400).json({ error: "Cannot remove the trip owner." });
    }

    const isOwner = trip.user_id === req.user.id;
    const isSelf = req.user.id === req.params.userId;
    if (!isOwner && !isSelf) return res.status(403).json({ error: "Owner only (or remove yourself)." });

    await prisma.collaborator.deleteMany({
      where: { trip_id: req.params.id, user_id: req.params.userId },
    });
    return res.status(200).json({ message: "Collaborator removed." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// PUT /api/trips/:id/visibility — toggle public/private
router.put("/:id/visibility", auth, async (req, res) => {
  try {
    const trip = await getTrip(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (trip.user_id !== req.user.id) return res.status(403).json({ error: "Owner only." });

    const { is_public } = req.body;
    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: { is_public },
      select: { id: true, name: true, slug: true, is_public: true },
    });
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// GET /api/trips/:id/share-link — get shareable link
router.get("/:id/share-link", auth, async (req, res) => {
  try {
    const trip = await getTrip(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });

    const isOwner = trip.user_id === req.user.id;
    const isCollab = trip.collaborators.some((c) => c.user_id === req.user.id);
    if (!isOwner && !isCollab) return res.status(403).json({ error: "Forbidden." });

    return res.status(200).json({
      url: `https://traveloop.vercel.app/trips/public/${trip.slug}`,
      slug: trip.slug,
      is_public: trip.is_public,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// POST /api/trips/:id/regenerate-slug — generate new slug
router.post("/:id/regenerate-slug", auth, async (req, res) => {
  try {
    const trip = await getTrip(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found." });
    if (trip.user_id !== req.user.id) return res.status(403).json({ error: "Owner only." });

    const newSlug = trip.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: { slug: newSlug },
      select: { id: true, slug: true },
    });
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
