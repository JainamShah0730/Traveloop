/**
 * AI Service (DeepSeek)
 * 
 * This service uses DeepSeek to power the newer flagship features:
 * - AI Copilot (full itinerary generation and targeted meal updates)
 * - Journal writing
 * - Flight and hotel suggestions
 * 
 * Note: Gemini is used in a separate service (gemini.js) for legacy/lightweight features.
 */

const { OpenAI } = require("openai");

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || 'missing-key-update-env'
});

const COPILOT_SYSTEM_PROMPT = `You are Travelloop's AI travel planner. Your ONLY job is to create a
detailed, realistic day-by-day travel itinerary that fits EXACTLY within
the user's stated PER-PERSON budget.

MEAL PREFERENCE RULES — CRITICAL:
\${mealConstraintText}

RULES — never break these:
1. NEVER exceed the user's per-person budget. The sum of all costs in the
   itinerary (flights + hotels + activities + food + transport) MUST
   be less than or equal to the stated budget_per_person.
2. GOLDEN RULE: All costs MUST be per-person. Never multiply by the number
   of travelers. The frontend handles that.
3. Always allocate per-person budget:
   - Flights / transport to destination: 30-40%
   - Accommodation: 25-35% (cost per person, per night)
   - Food (all meals): 15-20%
   - Activities and sightseeing: 10-15%
   - Local transport: 5-8%
4. If budget is too low for the destination, say so in budget_note.
5. Recommend REAL named places — actual hotel names, restaurants, spots.
   Never say "a budget hotel" or "a local restaurant" — NAME them.
6. Quality tier by per-person budget:
   Under ₹15,000: hostels, street food, free attractions
   ₹15,000–₹40,000: 2-3 star hotels, local restaurants
   ₹40,000–₹1,00,000: 3-4 star hotels, mid-range dining
   Above ₹1,00,000: 4-5 star hotels, fine dining
7. Include at least one free activity per day.
8. Adapt to the user's travel style.
9. CRITICAL RULE: You MUST generate activities for EXACTLY the number of days requested by the user in 'duration'. If the user says duration is 9, the 'days' array MUST contain exactly 9 items. DO NOT STOP EARLY.

CRITICAL BUDGET ENFORCEMENT:
Your cost_breakdown_per_person values MUST satisfy this check:
  flights + accommodation + food + activities + local_transport <= budget_per_person

If you cannot fit all categories within budget_per_person, reduce quality tier:
  - First reduce accommodation (switch to lower star hotel)
  - Then reduce activities (replace paid activities with free ones)
  - Then reduce food (switch from restaurants to street food)
  NEVER exceed budget_per_person. Return budget_used_per_person <= budget_per_person always.

Before returning the JSON, mentally verify:
  sum(cost_breakdown_per_person values) <= budget_per_person
If not, reduce costs until they fit. Do not return an over-budget response.

Respond ONLY with valid JSON matching the schema below. No preamble,
no markdown backticks, no explanation.

{
  "destination": string,
  "total_days": number,
  "total_travelers": number,
  "budget_per_person": number,
  "budget_used_per_person": number,
  "budget_remaining_per_person": number,
  "budget_note": string,
  "cost_breakdown_per_person": {
    "flights": number, "accommodation": number,
    "food": number, "activities": number, "local_transport": number
  },
  "days": [{
    "day": number, "date": string, "title": string,
    "morning": { "activity": string, "cost_per_person": number, "tip": string },
    "afternoon": { "activity": string, "cost_per_person": number, "tip": string },
    "evening": { "activity": string, "cost_per_person": number, "tip": string },
    "hotel": { "name": string, "cost_per_person_per_night": number, "rating": number },
    "meals": {
      "breakfast": string, "lunch": string, "dinner": string,
      "total_food_cost_per_person": number
    },
    "day_total_per_person": number
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
  const mealText = userInput.mealConstraintText || 'No specific meal restrictions.';
  const systemPrompt = COPILOT_SYSTEM_PROMPT.replace('\${mealConstraintText}', mealText);
  
  const prompt = `${systemPrompt}\n\nUser Input:\n${JSON.stringify(userInput, null, 2)}`;
  
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "deepseek-chat",
    max_tokens: 8192
  });
  
  let raw = completion.choices[0].message.content;
  
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
  
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "deepseek-chat",
    max_tokens: 2000
  });
  
  let raw = completion.choices[0].message.content;
  
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
    .replaceAll('\${destination}', params.destination)
    .replaceAll('\${origin}', params.origin)
    .replaceAll('\${departDate}', params.departDate)
    .replaceAll('\${returnDate}', params.returnDate)
    .replaceAll('\${nights}', params.nights)
    .replaceAll('\${travelers}', params.travelers)
    .replaceAll('\${flightHotelBudget}', params.budget)
    .replaceAll('\${hotel_pref}', params.hotel_pref);

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "deepseek-chat",
    max_tokens: 2000
  });
  
  let raw = completion.choices[0].message.content;
  
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

async function generateMealsOnly(itinerary, mealConstraintText, travelersCount) {
  const mealsPrompt = `
You are updating ONLY the meal suggestions in an existing travel itinerary.
Do NOT change activities, hotels, costs, or any other field.

DESTINATION: ${itinerary.destination}
DURATION: ${itinerary.total_days || itinerary.days?.length} days
TRAVELERS: ${travelersCount}

UPDATED MEAL PREFERENCES:
${mealConstraintText}

Current itinerary days (for context — do not change anything except meals):
${JSON.stringify((itinerary.days || []).map(d => ({
  day: d.day,
  date: d.date,
  title: d.title,
  hotel: d.hotel?.name
})))}

For each day, return ONLY the updated meals object.
Respond ONLY with valid JSON — an array of { day, meals } objects:
[
  {
    "day": 1,
    "meals": {
      "breakfast": "Restaurant Name — Specific dish (why it fits: [veg/jain/vegan])",
      "lunch": "Restaurant Name — Specific dish",
      "dinner": "Restaurant Name — Specific dish",
      "total_food_cost_per_person": number
    }
  }
]
No preamble. No backticks. Just the JSON array.
`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: mealsPrompt }],
    model: "deepseek-chat",
    max_tokens: 2000
  });

  let raw = completion.choices[0].message.content;
  
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("JSON parse error in generateMealsOnly:", e);
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  }
}

module.exports = { generateItinerary, generateJournal, generateFlightHotelOptions, generateMealsOnly };
