const express = require("express");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
const prisma = require("../db");

// GET /api/admin/stats
router.get("/stats", auth, requireAdmin, async (req, res) => {
  try {
    const usersCount = await prisma.user.count();
    const tripsCount = await prisma.trip.count();
    
    const topStopsRaw = await prisma.stop.groupBy({
      by: ['city_name'],
      _count: { city_name: true },
      orderBy: { _count: { city_name: 'desc' } },
      take: 5,
    });

    const destinations = topStopsRaw.map((stop, index) => ({
      rank: index + 1,
      city: stop.city_name,
      bookings: stop._count.city_name * 12 + 100, // Mocked scale up for hackathon visual
      growth: index % 2 === 0 ? '+15%' : '+8%' // Mocked growth
    }));

    // If database is empty, provide fake data so the chart isn't empty
    if (destinations.length === 0) {
      destinations.push(
        { rank: 1, city: 'Tokyo, Japan', bookings: 1245, growth: '+45%' },
        { rank: 2, city: 'Paris, France', bookings: 980, growth: '+12%' },
        { rank: 3, city: 'Bali, Indonesia', bookings: 850, growth: '+28%' },
        { rank: 4, city: 'Rome, Italy', bookings: 720, growth: '-5%' },
        { rank: 5, city: 'New York, USA', bookings: 690, growth: '+8%' }
      );
    }

    return res.status(200).json({
      activeUsers: usersCount * 14 + 12000, // Hackathon fake scaling
      tripsPlanned: tripsCount + 8000,      // Hackathon fake scaling
      destinations
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
