const express = require("express");
const auth = require("../middleware/auth");
const prisma = require("../db");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { tripId, question, type, options } = req.body;
    const poll = await prisma.poll.create({
      data: {
        tripId,
        createdBy: req.user.id,
        question,
        type,
        options: {
          create: options.map(opt => ({ label: opt }))
        }
      },
      select: {
        id: true, question: true, type: true, status: true, createdAt: true,
        options: { select: { id: true, label: true, votes: { select: { userId: true } } } },
        votes: { select: { userId: true, optionId: true } }
      }
    });

    // Create Notification Note
    await prisma.note.create({
      data: {
        trip_id: tripId,
        title: `New Poll: ${question}`,
        type: "system_alert",
        content: `${req.user.name || 'Someone'} created a new poll. Cast your vote!`,
        has_reminder: true,
        reminder_time: new Date()
      }
    });

    return res.status(201).json(poll);
  } catch (error) {
    console.error("Create poll error:", error);
    return res.status(500).json({ error: "Failed to create poll" });
  }
});

router.get("/trip/:tripId", auth, async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      where: { tripId: req.params.tripId },
      select: {
        id: true, question: true, type: true, status: true, createdAt: true,
        options: { select: { id: true, label: true, votes: { select: { userId: true } } } },
        votes: { select: { userId: true, optionId: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json(polls);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch polls" });
  }
});

router.post("/:pollId/vote", auth, async (req, res) => {
  try {
    const { optionId } = req.body;
    const { pollId } = req.params;

    // Remove existing vote for this user on this poll
    await prisma.vote.deleteMany({
      where: {
        pollId,
        userId: req.user.id
      }
    });

    await prisma.vote.create({
      data: {
        pollId,
        optionId,
        userId: req.user.id
      }
    });

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        id: true, question: true, type: true, status: true, createdAt: true,
        options: { select: { id: true, label: true, votes: { select: { userId: true } } } },
        votes: { select: { userId: true, optionId: true } }
      }
    });

    return res.status(200).json(poll);
  } catch (error) {
    console.error("Vote error:", error);
    return res.status(500).json({ error: "Failed to vote" });
  }
});

router.patch("/:pollId/close", auth, async (req, res) => {
  try {
    const poll = await prisma.poll.update({
      where: { id: req.params.pollId },
      data: { status: "closed" },
      select: {
        id: true, question: true, type: true, status: true, createdAt: true,
        options: { select: { id: true, label: true, votes: { select: { userId: true } } } },
        votes: { select: { userId: true, optionId: true } }
      }
    });
    return res.status(200).json(poll);
  } catch (error) {
    return res.status(500).json({ error: "Failed to close poll" });
  }
});

module.exports = router;
