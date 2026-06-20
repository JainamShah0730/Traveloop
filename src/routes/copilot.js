const express = require("express");
const auth = require("../middleware/auth");
const prisma = require("../db");
const requireAdmin = require("../middleware/requireAdmin");
const { generateItinerary, generateFlightHotelOptions, generateMealsOnly } = require("../services/AIService");
const { buildMealConstraintText } = require("../utils/mealUtils");

const router = express.Router();

router.post("/generate", auth, async (req, res) => {
  try {
    const { destination, duration, budget, travelers, style, itineraryId, food_pref } = req.body;
    
    const travelersCount = Math.max(1, parseInt(travelers, 10) || 1);
    const budgetPerPerson = Math.round(budget / travelersCount);

    // Fetch travelers for this itinerary/trip to get their meal preferences
    let travelerDetails = [];
    if (itineraryId) {
      travelerDetails = await prisma.tripTraveler.findMany({
        where: { itineraryId },
        select: { name: true, mealPref: true }
      });
    }

    // If no travelers yet (first generation), use the food_pref from form
    // as the single traveler preference
    if (travelerDetails.length === 0 && food_pref) {
      travelerDetails = [{
        name: req.user.name,
        mealPref: food_pref
      }];
    }

    const { resolveGroupMealPreference, buildMealConstraintText } = require("../utils/mealUtils");
    const groupMealPref = resolveGroupMealPreference(travelerDetails);
    const mealConstraintText = buildMealConstraintText(travelerDetails);

    // Budget enforcement: retry up to 2 times if AI returns over-budget
    const MAX_RETRIES = 2;
    let itinerary = null;
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      const raw = await generateItinerary({
        destination,
        total_days: duration,
        budget_per_person: budgetPerPerson,
        total_travelers: travelersCount,
        style,
        mealConstraintText
      });

      // Sum all per-person cost breakdown values
      const breakdown = raw.cost_breakdown_per_person || {};
      const totalUsed = Object.values(breakdown).reduce((a, b) => a + (Number(b) || 0), 0);

      if (totalUsed <= budgetPerPerson * 1.02) {
        // Within 2% tolerance — accept
        itinerary = raw;
        itinerary.budget_used_per_person = totalUsed;
        itinerary.budget_remaining_per_person = budgetPerPerson - totalUsed;
        itinerary.groupMealPref = groupMealPref;
        break;
      }

      attempt++;
      console.warn(`Attempt ${attempt}: AI returned over-budget itinerary. Budget: ${budgetPerPerson}, Used: ${totalUsed}. Retrying...`);

      if (attempt > MAX_RETRIES) {
        // After retries exhausted, clamp: scale each category proportionally to fit
        const scaleFactor = budgetPerPerson / totalUsed;
        Object.keys(breakdown).forEach(key => {
          breakdown[key] = Math.round(breakdown[key] * scaleFactor);
        });
        itinerary = raw;
        itinerary.cost_breakdown_per_person = breakdown;
        itinerary.budget_used_per_person = budgetPerPerson;
        itinerary.budget_remaining_per_person = 0;
        itinerary.budget_note = "Costs adjusted to fit your budget.";
        itinerary.groupMealPref = groupMealPref;
        break;
      }
    }

    // Save to AiItinerary
    const record = await prisma.aiItinerary.create({
      data: {
        userId: req.user.id,
        destination,
        budget: Number(budget),
        duration: Number(duration),
        travelers: travelersCount,
        budgetPerPerson,
        data: itinerary
      }
    });

    // Auto-add the logged-in user as traveler[0] (owner)
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (user) {
        await prisma.tripTraveler.create({
          data: {
            itineraryId: record.id,
            isOwner: true,
            name: user.name,
            email: user.email,
          }
        });
      }
    } catch (travelerErr) {
      console.warn("Could not auto-add owner as traveler:", travelerErr.message);
    }

    return res.status(200).json({ record, itinerary, travelers: travelersCount, budgetPerPerson, totalBudget: budget });
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
                if (day.morning?.activity) acts.push({ name: day.morning.activity, type: "sightseeing", cost: day.morning.cost_per_person || day.morning.cost || 0, notes: `Day ${dayNum} Start: 10:00 ${day.morning.tip || ''}`.trim() });
                if (day.afternoon?.activity) acts.push({ name: day.afternoon.activity, type: "sightseeing", cost: day.afternoon.cost_per_person || day.afternoon.cost || 0, notes: `Day ${dayNum} Start: 14:00 ${day.afternoon.tip || ''}`.trim() });
                if (day.evening?.activity) acts.push({ name: day.evening.activity, type: "sightseeing", cost: day.evening.cost_per_person || day.evening.cost || 0, notes: `Day ${dayNum} Start: 19:00 ${day.evening.tip || ''}`.trim() });
                if (day.hotel?.name) acts.push({ name: day.hotel.name, type: "hotel", cost: day.hotel.cost_per_person_per_night || day.hotel.cost_per_night || 0, notes: `Day ${dayNum} Check-in: 15:00` });
                if (day.meals?.total_food_cost_per_person > 0 || day.meals?.total_food_cost > 0) acts.push({ name: "Meals", type: "food", cost: day.meals.total_food_cost_per_person || day.meals.total_food_cost || 0, notes: `Day ${dayNum} Breakfast: ${day.meals.breakfast || ''}, Lunch: ${day.meals.lunch || ''}, Dinner: ${day.meals.dinner || ''}` });
                
                // Add flight/transport on day 1 if it exists in the global cost breakdown
                if (dayNum === 1 && itinerary.cost_breakdown_per_person?.flights) {
                  acts.push({
                    name: "Round-trip Flights",
                    type: "transport",
                    cost: Number(itinerary.cost_breakdown_per_person.flights) || 0,
                    notes: `Day 1 Flight Booking`
                  });
                }
                
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

    // Transfer travelers from itinerary to the new trip
    await prisma.tripTraveler.updateMany({
      where: { itineraryId: aiRecord.id },
      data: { tripId: trip.id }
    });

    return res.status(200).json(trip);
  } catch (error) {
    console.error("Save to trip error:", error);
    return res.status(500).json({ error: "Failed to save itinerary to trip" });
  }
});

router.post("/package/:id", auth, requireAdmin, async (req, res) => {
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

// POST /api/copilot/:id/confirm-selection
// Persist user's flight + hotel selection into the AiItinerary and update day cards
router.post("/:id/confirm-selection", auth, async (req, res) => {
  try {
    const { selectedFlight, selectedHotel } = req.body;
    const itineraryId = req.params.id;

    if (!selectedFlight && !selectedHotel) {
      return res.status(400).json({ error: "selectedFlight or selectedHotel required" });
    }

    // Verify ownership
    const itinerary = await prisma.aiItinerary.findUnique({
      where: { id: itineraryId }
    });
    if (!itinerary) return res.status(404).json({ error: "Itinerary not found" });
    if (itinerary.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    // Update itinerary data JSON with selected flight/hotel
    const { updateItineraryWithSelections } = require("../utils/itineraryUtils");
    const updatedData = updateItineraryWithSelections(
      itinerary.data,
      selectedFlight,
      selectedHotel
    );

    await prisma.aiItinerary.update({
      where: { id: itineraryId },
      data: {
        selectedFlight: selectedFlight || undefined,
        selectedHotel: selectedHotel || undefined,
        data: updatedData,
      }
    });

    return res.status(200).json({ success: true, updatedData });
  } catch (error) {
    console.error("Confirm selection error:", error);
    return res.status(500).json({ error: "Failed to confirm selection" });
  }
});

// POST /api/copilot/:id/regenerate-meals
// Body: { travelers: [{ name, mealPref }] }
router.post("/:id/regenerate-meals", auth, async (req, res) => {
  try {
    const { travelers } = req.body;
    const itineraryId = req.params.id;

    const aiRecord = await prisma.aiItinerary.findUnique({
      where: { id: itineraryId }
    });

    if (!aiRecord || aiRecord.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { resolveGroupMealPreference, buildMealConstraintText } = require("../utils/mealUtils");
    const groupMealPref = resolveGroupMealPreference(travelers);
    const mealConstraintText = buildMealConstraintText(travelers);
    
    // Targeted prompt — only regenerate meals, keep everything else
    const updatedMeals = await generateMealsOnly(aiRecord.data, mealConstraintText, travelers.length);

    // Merge updated meals into existing itinerary data
    const updatedDays = (aiRecord.data.days || []).map(day => {
      const updated = updatedMeals.find(m => m.day === day.day);
      return updated && updated.meals ? { ...day, meals: updated.meals } : day;
    });

    // Recalculate food cost in breakdown
    const totalFoodPerPerson = updatedDays.reduce(
      (sum, d) => sum + (d.meals?.total_food_cost_per_person || 0), 0
    );

    const updatedData = {
      ...aiRecord.data,
      days: updatedDays,
      groupMealPref,
      cost_breakdown_per_person: {
        ...(aiRecord.data.cost_breakdown_per_person || {}),
        food: totalFoodPerPerson
      }
    };

    await prisma.aiItinerary.update({
      where: { id: itineraryId },
      data: { data: updatedData }
    });

    res.json({ success: true, updatedData });
  } catch (error) {
    console.error("Regenerate meals error:", error);
    res.status(500).json({ error: "Failed to regenerate meals" });
  }
});

router.patch("/share/:id", auth, async (req, res) => {
  try {
    const aiRecord = await prisma.aiItinerary.findUnique({
      where: { id: req.params.id }
    });
    
    if (!aiRecord) {
      return res.status(404).json({ error: "Not found" });
    }
    
    if (aiRecord.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { isShared } = req.body;
    const updatedRecord = await prisma.aiItinerary.update({
      where: { id: req.params.id },
      data: { isShared }
    });
    return res.status(200).json(updatedRecord);
  } catch (error) {
    console.error("Share error:", error);
    return res.status(500).json({ error: "Failed to update share status" });
  }
});

module.exports = router;
