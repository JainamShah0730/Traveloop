const express = require("express");
const auth = require("../middleware/auth");
const prisma = require("../db");
const { generateJournal } = require("../services/AIService");

const router = express.Router();

router.post("/generate/:tripId", auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.tripId },
      include: { stops: { include: { activities: true } }, notes: true }
    });
    
    if (!trip || trip.user_id !== req.user.id) {
      return res.status(404).json({ error: "Not found or forbidden" });
    }

    const journalContent = await generateJournal(trip);

    // See if a journal already exists, or create a draft
    let journal = await prisma.journal.findUnique({ where: { tripId: trip.id } });
    if (journal) {
      journal = await prisma.journal.update({
        where: { id: journal.id },
        data: {
          title: journalContent.title,
          story: journalContent.story
        }
      });
    } else {
      journal = await prisma.journal.create({
        data: {
          tripId: trip.id,
          userId: req.user.id,
          title: journalContent.title,
          story: journalContent.story,
          isPublished: false
        }
      });
    }

    return res.status(200).json({ journal, generatedContent: journalContent });
  } catch (error) {
    console.error("Journal generate error:", error);
    return res.status(500).json({ error: "Failed to generate journal" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { tripId, title, story, isPublished, coverPhoto } = req.body;
    
    let journal = await prisma.journal.findUnique({ where: { tripId } });
    if (journal) {
      journal = await prisma.journal.update({
        where: { id: journal.id },
        data: { title, story, isPublished, coverPhoto }
      });
    } else {
      journal = await prisma.journal.create({
        data: { tripId, userId: req.user.id, title, story, isPublished, coverPhoto }
      });
    }
    
    return res.status(200).json(journal);
  } catch (error) {
    return res.status(500).json({ error: "Failed to save journal" });
  }
});

router.patch("/:id/publish", auth, async (req, res) => {
  try {
    const journal = await prisma.journal.findUnique({ where: { id: req.params.id } });
    if (!journal || journal.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    const updated = await prisma.journal.update({
      where: { id: req.params.id },
      data: { isPublished: !journal.isPublished }
    });
    
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Failed to publish journal" });
  }
});

router.get("/trip/:tripId", auth, async (req, res) => {
  try {
    const journal = await prisma.journal.findUnique({
      where: { tripId: req.params.tripId },
      include: { photos: true, trip: true, user: { select: { name: true, avatar_url: true } } }
    });
    
    if (!journal) return res.status(404).json({ error: "Not found" });
    if (!journal.isPublished && journal.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    return res.status(200).json(journal);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch journal" });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const journals = await prisma.journal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { trip: true }
    });
    return res.status(200).json(journals);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch journals" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const journal = await prisma.journal.findUnique({
      where: { id: req.params.id },
      include: { photos: true, trip: true, user: { select: { name: true, avatar_url: true } } }
    });
    
    if (!journal) return res.status(404).json({ error: "Not found" });
    if (!journal.isPublished && journal.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    return res.status(200).json(journal);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch journal" });
  }
});

module.exports = router;
