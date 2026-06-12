const express = require("express");
const auth = require("../middleware/auth");
const prisma = require("../db");
const { calculateBalances, calculateSplitShares } = require("../services/expenseService");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { tripId, title, amount, currency, splitType, category, participants } = req.body;
    
    // Calculate shares
    const shares = calculateSplitShares(amount, splitType, participants);
    
    const expense = await prisma.expense.create({
      data: {
        tripId,
        title,
        amount: Number(amount),
        currency: currency || "INR",
        paidById: req.user.id,
        splitType,
        category,
        participants: {
          create: shares.map(s => ({
            userId: s.userId,
            share: s.share
          }))
        }
      },
      include: { participants: true, paidBy: true }
    });
    
    return res.status(201).json(expense);
  } catch (error) {
    console.error("Create expense error:", error);
    return res.status(500).json({ error: "Failed to create expense" });
  }
});

router.get("/trip/:tripId", auth, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { tripId: req.params.tripId },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar_url: true } } } },
        paidBy: { select: { id: true, name: true, avatar_url: true } }
      },
      orderBy: { date: "desc" }
    });
    return res.status(200).json(expenses);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

router.get("/trip/:tripId/balances", auth, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { tripId: req.params.tripId },
      include: { participants: true }
    });
    
    // get trip members
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.tripId },
      include: { 
        collaborators: { include: { user: true } },
        user: true // Owner
      }
    });

    const members = [
      { userId: trip.user.id, name: trip.user.name, avatar_url: trip.user.avatar_url },
      ...trip.collaborators.map(c => ({ userId: c.user.id, name: c.user.name, avatar_url: c.user.avatar_url }))
    ];

    const balances = calculateBalances(expenses, members);
    
    const balancesList = members.map(m => ({
      userId: m.userId,
      name: m.name,
      avatar_url: m.avatar_url,
      balance: balances[m.userId] || 0
    }));

    return res.status(200).json(balancesList);
  } catch (error) {
    console.error("Balances error:", error);
    return res.status(500).json({ error: "Failed to fetch balances" });
  }
});

router.post("/settle", auth, async (req, res) => {
  try {
    const { tripId, fromUserId, toUserId, amount } = req.body;
    
    if (req.user.id !== fromUserId && req.user.id !== toUserId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const settlement = await prisma.settlement.create({
      data: {
        tripId,
        fromUserId,
        toUserId,
        amount: Number(amount),
        settled: true,
        settledAt: new Date()
      }
    });

    await prisma.expense.create({
      data: {
        tripId,
        title: "Settlement Payment",
        amount: Number(amount),
        currency: "INR",
        paidById: fromUserId, 
        splitType: "custom",
        category: "other",
        participants: {
          create: [{
            userId: toUserId,
            share: Number(amount), 
            settled: true
          }]
        }
      }
    });

    return res.status(200).json(settlement);
  } catch (error) {
    console.error("Settle error:", error);
    return res.status(500).json({ error: "Failed to settle" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { trip: true }
    });
    
    if (!expense) return res.status(404).json({ error: "Not found" });
    
    if (expense.paidById !== req.user.id && expense.trip.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.expense.delete({
      where: { id: req.params.id }
    });

    return res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete expense" });
  }
});

module.exports = router;
