const express = require("express");
const auth = require("../middleware/auth");
const prisma = require("../db");

const router = express.Router();

// POST /api/travelers
// Add a traveler to a trip/itinerary/package
router.post("/", auth, async (req, res) => {
  try {
    const { tripId, itineraryId, packageId, name, email, phone, age, mealPref, seatPref, isOwner } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // Validate age if provided
    if (age !== undefined && age !== null) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        return res.status(400).json({ error: "Age must be between 1 and 120" });
      }
    }

    // Build the where clause for counting existing travelers
    const whereConditions = [];
    if (tripId) whereConditions.push({ tripId });
    if (itineraryId) whereConditions.push({ itineraryId });
    if (packageId) whereConditions.push({ packageId });

    if (whereConditions.length === 0) {
      return res.status(400).json({ error: "One of tripId, itineraryId, or packageId is required" });
    }

    // Check max travelers (12 per trip/itinerary/package)
    const existing = await prisma.tripTraveler.count({
      where: { OR: whereConditions }
    });

    if (existing >= 12) {
      return res.status(400).json({ error: "Maximum 12 travelers per trip" });
    }

    const traveler = await prisma.tripTraveler.create({
      data: {
        tripId: tripId || null,
        itineraryId: itineraryId || null,
        packageId: packageId || null,
        isOwner: isOwner || false,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        age: age ? parseInt(age) : null,
        mealPref: mealPref || null,
        seatPref: seatPref || null,
      }
    });

    res.json({ success: true, traveler });
  } catch (error) {
    console.error("Add traveler error:", error);
    res.status(500).json({ error: "Failed to add traveler" });
  }
});

// GET /api/travelers?itineraryId=xxx OR ?packageId=xxx OR ?tripId=xxx
router.get("/", auth, async (req, res) => {
  try {
    const { tripId, itineraryId, packageId } = req.query;
    const where = {};
    if (tripId) where.tripId = tripId;
    if (itineraryId) where.itineraryId = itineraryId;
    if (packageId) where.packageId = packageId;

    if (Object.keys(where).length === 0) {
      return res.status(400).json({ error: "Provide tripId, itineraryId, or packageId" });
    }

    const travelers = await prisma.tripTraveler.findMany({
      where,
      orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }]
    });

    res.json({ travelers, count: travelers.length });
  } catch (error) {
    console.error("Get travelers error:", error);
    res.status(500).json({ error: "Failed to fetch travelers" });
  }
});

// DELETE /api/travelers/:id
// Remove a traveler — cannot remove the owner
router.delete("/:id", auth, async (req, res) => {
  try {
    const traveler = await prisma.tripTraveler.findUnique({
      where: { id: req.params.id }
    });

    if (!traveler) {
      return res.status(404).json({ error: "Traveler not found" });
    }

    if (traveler.isOwner) {
      return res.status(400).json({ error: "Cannot remove the trip owner" });
    }

    await prisma.tripTraveler.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete traveler error:", error);
    res.status(500).json({ error: "Failed to remove traveler" });
  }
});

// PATCH /api/travelers/:id
// Update traveler info
router.patch("/:id", auth, async (req, res) => {
  try {
    const { name, email, phone, age, mealPref, seatPref } = req.body;

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }
    }

    // Validate age if provided
    if (age !== undefined && age !== null) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        return res.status(400).json({ error: "Age must be between 1 and 120" });
      }
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.trim().toLowerCase();
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (age !== undefined) data.age = age ? parseInt(age) : null;
    if (mealPref !== undefined) data.mealPref = mealPref;
    if (seatPref !== undefined) data.seatPref = seatPref;

    const updated = await prisma.tripTraveler.update({
      where: { id: req.params.id },
      data
    });

    res.json({ success: true, traveler: updated });
  } catch (error) {
    console.error("Update traveler error:", error);
    res.status(500).json({ error: "Failed to update traveler" });
  }
});

module.exports = router;
