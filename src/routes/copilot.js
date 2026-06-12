const express = require("express");
const auth = require("../middleware/auth");
const prisma = require("../db");
const { generateItinerary, generateFlightHotelOptions } = require("../services/AIService");

const router = express.Router();

router.post("/generate", auth, async (req, res) => {
  try {
    const { destination, duration, budget, travelers, style } = req.body;
    
    // Call AIService
    const itinerary = await generateItinerary({
      destination,
      total_days: duration,
      budget_total: budget,
      total_travelers: travelers,
      style
    });

    // Save to AiItinerary
    const record = await prisma.aiItinerary.create({
      data: {
        userId: req.user.id,
        destination,
        budget: Number(budget),
        duration: Number(duration),
        data: itinerary
      }
    });

    return res.status(200).json({ record, itinerary });
  } catch (error) {
    console.error("Copilot generate error:", error);
    return res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

router.get("/history", auth, async (req, res) => {
  try {
    const history = await prisma.aiItinerary.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.post("/save/:id", auth, async (req, res) => {
  try {
    const aiRecord = await prisma.aiItinerary.findUnique({
      where: { id: req.params.id }
    });
    
    if (!aiRecord || aiRecord.userId !== req.user.id) {
      return res.status(404).json({ error: "Not found or forbidden" });
    }

    const { name, startDate } = req.body;
    if (!name || !startDate) return res.status(400).json({ error: "name and startDate required" });

    const itinerary = aiRecord.data;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (itinerary.total_days || aiRecord.duration) - 1);

    const slug = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    const trip = await prisma.trip.create({
      data: {
        user_id: req.user.id,
        name,
        start_date: new Date(startDate),
        end_date: endDate,
        total_budget: itinerary.budget_total || aiRecord.budget,
        slug,
        stops: {
          create: [{
            city_name: itinerary.destination || aiRecord.destination,
            country: "Unknown",
            lat: 0,
            lng: 0,
            from_date: new Date(startDate),
            to_date: endDate,
            order_index: 0,
            activities: {
              create: (itinerary.days || []).flatMap((day, idx) => {
                const dayNum = day.day || idx + 1;
                const acts = [];
                if (day.morning?.activity) acts.push({ name: day.morning.activity, type: "sightseeing", cost: day.morning.cost || 0, notes: `Day ${dayNum} Start: 10:00 ${day.morning.tip || ''}`.trim() });
                if (day.afternoon?.activity) acts.push({ name: day.afternoon.activity, type: "sightseeing", cost: day.afternoon.cost || 0, notes: `Day ${dayNum} Start: 14:00 ${day.afternoon.tip || ''}`.trim() });
                if (day.evening?.activity) acts.push({ name: day.evening.activity, type: "sightseeing", cost: day.evening.cost || 0, notes: `Day ${dayNum} Start: 19:00 ${day.evening.tip || ''}`.trim() });
                if (day.hotel?.name) acts.push({ name: day.hotel.name, type: "hotel", cost: day.hotel.cost_per_night || 0, notes: `Day ${dayNum} Check-in: 15:00` });
                if (day.meals?.total_food_cost > 0) acts.push({ name: "Meals", type: "food", cost: day.meals.total_food_cost || 0, notes: `Day ${dayNum} Breakfast: ${day.meals.breakfast || ''}, Lunch: ${day.meals.lunch || ''}, Dinner: ${day.meals.dinner || ''}` });
                return acts;
              })
            }
          }]
        }
      }
    });

    await prisma.aiItinerary.update({
      where: { id: aiRecord.id },
      data: { tripId: trip.id }
    });

    return res.status(200).json(trip);
  } catch (error) {
    console.error("Save to trip error:", error);
    return res.status(500).json({ error: "Failed to save itinerary to trip" });
  }
});

router.post("/package/:id", auth, async (req, res) => {
  try {
    const aiRecord = await prisma.aiItinerary.findUnique({
      where: { id: req.params.id }
    });
    
    if (!aiRecord) {
      return res.status(404).json({ error: "Not found" });
    }

    const itinerary = aiRecord.data;
    
    const destName = itinerary.destination || aiRecord.destination;
    let destination = await prisma.destination.findFirst({
      where: { name: { equals: destName, mode: 'insensitive' } }
    });

    if (!destination) {
      destination = await prisma.destination.create({
        data: {
          name: destName,
          country: "Unknown",
          type: "AI Generated",
          description: "Curated by AI Copilot"
        }
      });
    }

    const duration = Number(itinerary.total_days || aiRecord.duration || 5);
    const total = Number(itinerary.budget_total || aiRecord.budget || 30000);
    const perDay = Math.round(total / duration);

    const newPackage = await prisma.travelPackage.create({
      data: {
        destination_id: destination.id,
        name: `${destName} AI Curated Adventure`,
        duration_days: duration,
        tagline: "Curated by AI Copilot",
        cities_covered: [destName],
        highlights: itinerary.highlights || itinerary.tips || ["Guided Tours", "Local Experiences"],
        best_season: itinerary.best_time_to_visit || "Year Round",
        source: "ai_generated",
        budgetTiers: {
          create: [{
            tier_name: "Standard",
            price_per_day_usd: Math.round(perDay / 80),
            price_per_day_inr: perDay,
            total_usd: Math.round(total / 80),
            total_inr: total,
            accommodation: "3-Star Hotels & Guesthouses",
            food: "Local Eateries & Restaurants",
            transport: "Public & Shared Cabs",
            includes: ["AI Support", "Customizable Itinerary"]
          }]
        }
      }
    });

    return res.status(200).json(newPackage);
  } catch (error) {
    console.error("Save as package error:", error);
    return res.status(500).json({ error: "Failed to save itinerary as package" });
  }
});

// Removed duplicate imports

router.post("/suggest-options", auth, async (req, res) => {
  try {
    const { itineraryId, destination, origin, budget, departDate, returnDate, travelers, hotel_pref } = req.body;
    
    // In a real scenario we'd calculate nights from dates
    const d1 = new Date(departDate || new Date());
    const d2 = new Date(returnDate || new Date(d1.getTime() + 5*24*60*60*1000));
    const nights = Math.max(1, Math.round((d2 - d1) / (1000*60*60*24)));

    const options = await generateFlightHotelOptions({
      destination, origin: origin || "BOM", departDate, returnDate, nights, travelers, budget, hotel_pref
    });

    return res.status(200).json(options);
  } catch (error) {
    console.error("Suggest options error:", error);
    return res.status(500).json({ error: "Failed to generate options" });
  }
});

router.patch("/share/:id", auth, async (req, res) => {
  try {
    const { isShared } = req.body;
    const aiRecord = await prisma.aiItinerary.update({
      where: { id: req.params.id },
      data: { isShared }
    });
    return res.status(200).json(aiRecord);
  } catch (error) {
    console.error("Share error:", error);
    return res.status(500).json({ error: "Failed to update share status" });
  }
});

module.exports = router;
