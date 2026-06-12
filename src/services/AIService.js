const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with the key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const COPILOT_SYSTEM_PROMPT = `You are Travelloop's AI travel planner. Your ONLY job is to create a
detailed, realistic day-by-day travel itinerary that fits EXACTLY within
the user's stated budget.

RULES — never break these:
1. NEVER exceed the user's total budget. The sum of all costs in the
   itinerary (flights + hotels + activities + food + transport) MUST
   be less than or equal to the stated budget.
2. Always allocate budget:
   - Flights / transport to destination: 30-40%
   - Accommodation: 25-35%
   - Food (all meals): 15-20%
   - Activities and sightseeing: 10-15%
   - Local transport: 5-8%
3. If budget is too low for the destination, say so in budget_note.
4. Recommend REAL named places — actual hotel names, restaurants, spots.
   Never say "a budget hotel" or "a local restaurant" — NAME them.
5. Quality tier by per-person budget:
   Under ₹15,000: hostels, street food, free attractions
   ₹15,000–₹40,000: 2-3 star hotels, local restaurants
   ₹40,000–₹1,00,000: 3-4 star hotels, mid-range dining
   Above ₹1,00,000: 4-5 star hotels, fine dining
6. Include at least one free activity per day.
7. Adapt to the user's travel style (adventure/relaxation/cultural/
   family/honeymoon).
8. CRITICAL RULE: You MUST generate activities for EXACTLY the number of days requested by the user in 'duration'. If the user says duration is 9, the 'days' array MUST contain exactly 9 items. DO NOT STOP EARLY.

Respond ONLY with valid JSON matching the schema below. No preamble,
no markdown backticks, no explanation.

{
  "destination": string,
  "total_days": number,
  "total_travelers": number,
  "budget_total": number,
  "budget_used": number,
  "budget_remaining": number,
  "budget_note": string,
  "cost_breakdown": {
    "flights": number, "accommodation": number,
    "food": number, "activities": number, "local_transport": number
  },
  "days": [{
    "day": number, "date": string, "title": string,
    "morning": { "activity": string, "cost": number, "tip": string },
    "afternoon": { "activity": string, "cost": number, "tip": string },
    "evening": { "activity": string, "cost": number, "tip": string },
    "hotel": { "name": string, "cost_per_night": number, "rating": number },
    "meals": {
      "breakfast": string, "lunch": string, "dinner": string,
      "total_food_cost": number
    },
    "day_total": number
  }],
  "tips": [string],
  "best_time_to_visit": string,
  "packing_essentials": [string]
}`;

const JOURNAL_SYSTEM_PROMPT = `You are a travel writer. Given the details of a completed trip, write
a vivid, personal travel journal story in first person.

Use the trip itinerary, notes, and expenses to create:
1. An engaging narrative (300-500 words) in first person
2. Key highlights (3-5 bullet points)
3. What to do differently next time (2-3 points)
4. A one-line summary the user can share

Tone: warm, personal, specific — like writing for a friend.
Reference real places and activities from the trip data.

Respond ONLY with JSON:
{
  "title": string,
  "story": string,
  "highlights": [string],
  "do_differently": [string],
  "one_liner": string
}`;

async function generateItinerary(userInput) {
  const prompt = `${COPILOT_SYSTEM_PROMPT}\n\nUser Input:\n${JSON.stringify(userInput, null, 2)}`;
  
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
    }
  });
  let raw = result.response.text();
  
  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = JSON.parse(raw);
    }
  } catch (e) {
    console.error("JSON parse error:", e);
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e2) {
      console.error('Truncated AI response:', raw.slice(-200));
      throw new Error('AI response was truncated or malformed. Try generating again.');
    }
  }

  // Validate all days are present
  if (parsed && parsed.total_days && (!parsed.days || parsed.days.length < parsed.total_days)) {
    throw new Error(`Expected ${parsed.total_days} days, got ${parsed.days?.length}`);
  }

  return parsed;
}

async function generateJournal(tripData) {
  const prompt = `${JOURNAL_SYSTEM_PROMPT}\n\nTrip Data:\n${JSON.stringify(tripData, null, 2)}`;
  
  const result = await model.generateContent(prompt);
  let raw = result.response.text();
  
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("JSON parse error:", e);
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  }
}

const FLIGHT_HOTEL_PROMPT = `You are Travelloop's flight and hotel advisor. 

Given a trip with these details:
- Destination: \${destination}
- Origin: \${origin}  
- Dates: \${departDate} to \${returnDate} (\${nights} nights)
- Travelers: \${travelers}
- Total remaining budget for flights + hotels: ₹\${flightHotelBudget}
- Hotel preference: \${hotel_pref} (budget / comfort / luxury)

Suggest exactly 3 flight options and 3 hotel options.

RULES:
1. All options must be REAL airlines and REAL hotel names that exist in \${destination}
2. Total flight cost + total hotel cost for ALL travelers must fit within the budget
3. For each flight: assign one of these badges — "Best value", "Fastest", "Budget pick"
4. For each hotel: assign one of these badges — "Best rated", "Best value", "Budget pick"  
5. Different badge per option — no two options get the same badge
6. Hotel total = pricePerNight × \${nights} × 1 room (assume shared room for budget)
7. Sort each list: best option first, budget option last

Respond ONLY with valid JSON matching this exact shape. No preamble, no backticks:
{
  "flights": [
    { "id": "f1", "airline": string, "flightNo": string, "depart": "HH:MM",
      "arrive": "HH:MM", "duration": string, "price": number,
      "pricePerPerson": number, "badge": string }
  ],
  "hotels": [
    { "id": "h1", "name": string, "rating": number, "pricePerNight": number,
      "totalCost": number, "amenities": [string], "badge": string }
  ]
}`;

async function generateFlightHotelOptions(params) {
  const prompt = FLIGHT_HOTEL_PROMPT
    .replace('${destination}', params.destination)
    .replace('${origin}', params.origin)
    .replace('${departDate}', params.departDate)
    .replace('${returnDate}', params.returnDate)
    .replace('${nights}', params.nights)
    .replace('${travelers}', params.travelers)
    .replace('${flightHotelBudget}', params.budget)
    .replace('${hotel_pref}', params.hotel_pref);

  const result = await model.generateContent(prompt);
  let raw = result.response.text();
  
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("JSON parse error:", e);
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  }
}

module.exports = { generateItinerary, generateJournal, generateFlightHotelOptions };
