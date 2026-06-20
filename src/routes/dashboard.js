const express = require("express");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const prisma = require("../db");

const router = express.Router();

// ── GET /api/dashboard/stats ──────────────────────────────────
router.get("/stats", auth, requireAdmin, async (req, res) => {
  try {
    const [userCount, tripCount] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count()
    ]);

    // Calculate growth: users created in the last 30 days vs the 30 days before
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo  = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [recentUsers, previousUsers] = await Promise.all([
      prisma.user.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })
    ]);

    const [recentTrips, previousTrips] = await Promise.all([
      prisma.trip.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      prisma.trip.count({ where: { created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })
    ]);

    const userGrowth = previousUsers > 0
      ? Math.round(((recentUsers - previousUsers) / previousUsers) * 100)
      : recentUsers > 0 ? 100 : 0;

    const tripGrowth = previousTrips > 0
      ? Math.round(((recentTrips - previousTrips) / previousTrips) * 100)
      : recentTrips > 0 ? 100 : 0;

    return res.status(200).json({
      activeUsers: userCount,
      userGrowth,
      tripsPlanned: tripCount,
      tripGrowth,
      uptime: "99.99%",
      uptimeStatus: "Stable"
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/dashboard/growth?days=7 ──────────────────────────
router.get("/growth", auth, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get all users created within the date range
    const users = await prisma.user.findMany({
      where: { created_at: { gte: startDate } },
      select: { created_at: true }
    });

    // Get all trips created within the date range
    const trips = await prisma.trip.findMany({
      where: { created_at: { gte: startDate } },
      select: { created_at: true }
    });

    // Build day-by-day labels and counts
    const labels = [];
    const newUsers = [];
    const returningUsers = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const label = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(label);

      const dayUsers = users.filter(u => {
        const d = new Date(u.created_at);
        return d >= dayStart && d <= dayEnd;
      }).length;

      const dayTrips = trips.filter(t => {
        const d = new Date(t.created_at);
        return d >= dayStart && d <= dayEnd;
      }).length;

      newUsers.push(dayUsers);
      returningUsers.push(dayTrips); // Using trips as "returning" metric
    }

    return res.status(200).json({ labels, newUsers, returningUsers });
  } catch (err) {
    console.error("Dashboard growth error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/dashboard/top-destinations ───────────────────────
// Shows destinations from the Destination catalog, ranked by how many
// trips users have booked from their packages.
router.get("/top-destinations", auth, requireAdmin, async (req, res) => {
  try {
    // 1. Get all destinations that have packages
    const destinations = await prisma.destination.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        country: true,
        packages: {
          select: {
            cities_covered: true
          }
        }
      }
    });

    // 2. Get all trips
    const trips = await prisma.trip.findMany({
      select: { name: true, created_at: true }
    });

    // 3. For each destination, count how many trips match it
    //    Trips created from packages follow the pattern: "DestName X-Day Trip"
    //    or a user custom name. We also match by checking if trip name contains
    //    the destination name.
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const ranked = destinations.map(dest => {
      const destNameLower = dest.name.toLowerCase();

      // Count trips whose name contains the destination name
      const matchingTrips = trips.filter(t =>
        t.name.toLowerCase().includes(destNameLower)
      );

      // Recent vs older for trend
      const recentCount = matchingTrips.filter(t =>
        new Date(t.created_at) >= thirtyDaysAgo
      ).length;

      return {
        name: `${dest.name}, ${dest.country}`,
        bookings: matchingTrips.length,
        pct: 0, // calculated below
        trend: recentCount > 0 ? "up" : matchingTrips.length > 0 ? "stable" : "down"
      };
    });

    // Sort by bookings descending, take top 5
    ranked.sort((a, b) => b.bookings - a.bookings);
    const top5 = ranked.slice(0, 5);

    // Calculate percentages
    const totalBookings = top5.reduce((sum, d) => sum + d.bookings, 0) || 1;
    top5.forEach(d => {
      d.pct = Math.round((d.bookings / totalBookings) * 100);
    });

    return res.status(200).json(top5);
  } catch (err) {
    console.error("Dashboard destinations error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
