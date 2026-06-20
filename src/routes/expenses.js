const express = require("express");
const auth = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

// POST /api/expenses
// Body: { tripId, title, amount, category, paidByTravelerId, splitType, customShares? }
router.post('/', auth, async (req, res) => {
  try {
    const { tripId, title, amount, category,
            paidByTravelerId, splitType = 'equal', customShares } = req.body;

    // Validate
    if (!tripId || !title || !amount || !paidByTravelerId) {
      return res.status(400).json({ error: 'tripId, title, amount, paidByTravelerId required' });
    }

    // STEP 1: Get ALL travelers on this trip
    const travelers = await db.tripTraveler.findMany({
      where: { tripId },
      orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }]
    });

    if (travelers.length === 0) {
      return res.status(400).json({ error: 'No travelers found for this trip' });
    }

    // STEP 2: Calculate each traveler's share
    let shares = [];

    if (splitType === 'equal') {
      const shareAmount = Math.round((amount / travelers.length) * 100) / 100;
      shares = travelers.map(t => ({
        travelerId: t.id,
        share: shareAmount
      }));
      // Fix rounding: add remainder to payer
      const totalShares = shares.reduce((a, b) => a + b.share, 0);
      const diff = Math.round((amount - totalShares) * 100) / 100;
      if (diff !== 0) {
        const payerShare = shares.find(s => s.travelerId === paidByTravelerId);
        if (payerShare) payerShare.share = Math.round((payerShare.share + diff) * 100) / 100;
      }

    } else if (splitType === 'percentage') {
      // customShares = [{ travelerId, percentage }]
      shares = customShares.map(s => ({
        travelerId: s.travelerId,
        share: Math.round((amount * s.percentage / 100) * 100) / 100
      }));

    } else if (splitType === 'custom') {
      // customShares = [{ travelerId, share }]
      shares = customShares;
    }

    // STEP 3: Create expense + participants in a transaction
    const expense = await db.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          tripId,
          title,
          amount,
          category: category || 'other',
          splitType,
          paidById: paidByTravelerId,
          participants: {
            create: shares.map(s => ({
              travelerId: s.travelerId,
              share: s.share,
              settled: s.travelerId === paidByTravelerId
              // Payer's own share is auto-settled
            }))
          }
        },
        include: {
          participants: { include: { traveler: true } },
          paidBy: true
        }
      });
      return exp;
    });

    res.json({ success: true, expense });
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// GET /api/expenses/trip/:tripId
router.get('/trip/:tripId', auth, async (req, res) => {
  try {
    const expenses = await db.expense.findMany({
      where: { tripId: req.params.tripId },
      orderBy: { date: 'desc' },
      include: {
        paidBy: {
          select: { id: true, name: true, isOwner: true }
        },
        participants: {
          include: {
            traveler: {
              select: { id: true, name: true, isOwner: true }
            }
          }
        }
      }
    });

    res.json({ expenses });
  } catch (error) {
    console.error("Fetch expenses error:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// GET /api/expenses/trip/:tripId/balances
router.get('/trip/:tripId/balances', auth, async (req, res) => {
  try {
    const tripId = req.params.tripId;

    // Get all travelers
    let travelers = await db.tripTraveler.findMany({
      where: { tripId },
      orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }]
    });

    // Auto-heal: If no travelers exist for this trip (created before fix), add the owner
    if (travelers.length === 0) {
      const trip = await db.trip.findUnique({ where: { id: tripId }, include: { user: true } });
      if (trip && trip.user) {
        const newTraveler = await db.tripTraveler.create({
          data: {
            tripId,
            isOwner: true,
            name: trip.user.name,
            email: trip.user.email
          }
        });
        travelers = [newTraveler];
      }
    }

    // Get all unsettled expense participants
    const participants = await db.expenseParticipant.findMany({
      where: {
        expense: { tripId },
        settled: false
      },
      include: {
        expense: { include: { paidBy: true } }
      }
    });

    // Calculate net balance per traveler
    const balances = {};
    travelers.forEach(t => { balances[t.id] = 0; });

    participants.forEach(p => {
      const payerId = p.expense.paidById;
      const participantId = p.travelerId;

      if (payerId !== participantId) {
        // participantId owes payerId this share
        balances[payerId]       = (balances[payerId] || 0) + p.share;  // payer gets credit
        balances[participantId] = (balances[participantId] || 0) - p.share;  // participant is debited
      }
    });

    // Build response with traveler names
    const result = travelers.map(t => ({
      traveler: { id: t.id, name: t.name, isOwner: t.isOwner },
      balance: Math.round((balances[t.id] || 0) * 100) / 100,
      status: (balances[t.id] || 0) > 0.5
        ? 'to_receive'
        : (balances[t.id] || 0) < -0.5
          ? 'owes'
          : 'settled'
    }));

    res.json({ balances: result });
  } catch (error) {
    console.error("Balances error:", error);
    res.status(500).json({ error: "Failed to fetch balances" });
  }
});

// POST /api/expenses/settle
router.post('/settle', auth, async (req, res) => {
  try {
    const { tripId, fromTravelerId, toTravelerId, amount } = req.body;

    // Mark all ExpenseParticipant records from this traveler as settled
    await db.expenseParticipant.updateMany({
      where: {
        travelerId: fromTravelerId,
        settled: false,
        expense: { tripId, paidById: toTravelerId }
      },
      data: { settled: true, settledAt: new Date() }
    });

    // Create settlement record
    await db.settlement.create({
      data: { tripId, fromTravelerId, toTravelerId, amount, settled: true, settledAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Settle error:", error);
    res.status(500).json({ error: "Failed to settle" });
  }
});

// DELETE /api/expenses/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const expense = await db.expense.findUnique({
      where: { id: req.params.id },
      include: { trip: true }
    });
    
    if (!expense) return res.status(404).json({ error: "Not found" });
    
    // Assuming the user needs to be the trip owner to delete (or we skip strict auth for this rebuild)
    if (expense.trip.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.expense.delete({
      where: { id: req.params.id }
    });

    return res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Delete expense error:", error);
    return res.status(500).json({ error: "Failed to delete expense" });
  }
});

module.exports = router;
