const express = require("express");
const auth = require("../middleware/auth");
const db = require("../db");
const { canAccessTrip } = require("../utils/tripAccess");

const router = express.Router();

// GET /api/invoice/trip/:tripId
router.get("/trip/:tripId", auth, async (req, res) => {
  try {
    const tripId = req.params.tripId;

    const { allowed } = await canAccessTrip(tripId, req.user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden." });

    // 1. Get trip details
    const trip = await db.trip.findUnique({ 
      where: { id: tripId },
      select: { id: true, name: true, start_date: true, end_date: true, total_budget: true }
    });
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    // 2. Get all travelers
    const travelers = await db.tripTraveler.findMany({
      where: { tripId },
      orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
      select: { id: true, name: true, email: true, isOwner: true }
    });

    // 3. Get all expenses
    const expenses = await db.expense.findMany({
      where: { tripId },
      orderBy: { date: "asc" },
      select: {
        id: true, title: true, amount: true, category: true, date: true, splitType: true, paidById: true,
        paidBy: { select: { name: true } },
        participants: { select: { travelerId: true, share: true, settled: true, traveler: { select: { name: true } } } }
      }
    });

    // 4. Calculate totals
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const travelersCount = Math.max(1, travelers.length);
    const totalBudget = (trip.total_budget || 0) * travelersCount; // Multiply base budget by travelers
    const remaining = totalBudget - totalSpent;

    // 5. Category breakdown
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // 6. Per-traveler summary
    const perTraveler = travelers.map(t => {
      // Total paid by this traveler
      const paid = expenses
        .filter(e => e.paidById === t.id)
        .reduce((sum, e) => sum + e.amount, 0);

      // Total share this traveler owes
      const owes = expenses
        .flatMap(e => e.participants)
        .filter(p => p.travelerId === t.id)
        .reduce((sum, p) => sum + p.share, 0);

      return {
        traveler: { id: t.id, name: t.name, email: t.email, isOwner: t.isOwner },
        totalPaid: Math.round(paid * 100) / 100,
        totalOwes: Math.round(owes * 100) / 100,
        netBalance: Math.round((paid - owes) * 100) / 100
      };
    });

    res.json({
      invoiceId: `INV-${trip.id.slice(-8).toUpperCase()}`,
      generatedDate: new Date().toISOString(),
      trip: {
        id: trip.id,
        name: trip.name,
        // The user model had `destination` in the schema? Wait.
        // Actually `Trip` doesn't have `destination`, it has `name`. It has stops but we will just pass what we can.
        // Let's stick to the structure.
        start_date: trip.start_date,
        end_date: trip.end_date,
        budget: totalBudget
      },
      travelers,
      expenses,
      summary: {
        totalBudget,
        totalSpent: Math.round(totalSpent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentSpent: totalBudget > 0
          ? Math.round((totalSpent / totalBudget) * 100)
          : 0,
        byCategory
      },
      perTraveler
    });
  } catch (error) {
    console.error("Invoice Error:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

module.exports = router;
