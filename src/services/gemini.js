/**
 * AI Service (Gemini)
 * 
 * This service uses Google Gemini to power legacy and lightweight features:
 * - Manual trip builder's "suggest activities"
 * - Packing lists
 * - Older full-itinerary regeneration
 * 
 * Note: DeepSeek is used in a separate service (AIService.js) for newer flagship features like the AI Copilot.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function suggestActivities({ cityName, country, travelStyle, existingActivities }) {
  const prompt = `Suggest 3 activities for ${cityName}, ${country} (${travelStyle} style). Already planned: ${existingActivities.length ? existingActivities.join(", ") : "none"}. Return ONLY a JSON array, no markdown. Each object: { "name": string, "type": "food"|"sightseeing"|"hotel"|"transport"|"shopping"|"other", "cost": number, "duration_mins": number, "notes": string }`;
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(text); } catch (err) { console.error("JSON Error:", text); throw new Error("AI response was not valid JSON"); }
}

async function generatePackingList({ destinations, totalDays, activityTypes, season }) {
  const prompt = `Packing list for ${totalDays}-day trip to ${destinations.join(", ")}. Season: ${season}. Activities: ${activityTypes.join(", ")}. Return ONLY JSON object, no markdown. Keys: "Clothing","Documents","Electronics","Health","Toiletries","Misc". Values: arrays of item strings.`;
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(text); } catch (err) { console.error("JSON Error:", text); throw new Error("AI response was not valid JSON"); }
}

async function generateItinerary({ name, destination, start_date, end_date, total_budget, preferences }) {
  const totalDays = Math.max(1, Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1);

  const prompt = `You are a travel planner. Generate a day-by-day itinerary as a JSON array.
Each item in the array must have exactly these fields:
- day: number (1, 2, 3...)
- location: string (place name)
- area: string (neighborhood or region)
- duration: string (e.g. "2 hours", "Half day")
- category: string (e.g. "Culture & History", "Beach & Relax")
- estimated_budget: number (in INR, numbers only)
- cost: number (in INR, numbers only)
- notes: string (1-sentence description)

For each activity, include a realistic estimated cost in INR
as a number in the field 'cost'. Never omit or leave cost as null.
Free activities should have cost: 0.

Return ONLY valid JSON. No markdown, no explanation, no extra text.

User message:
Trip: ${name}
Destination: ${destination}
Start: ${start_date}
End: ${end_date}
Total Trip Duration: ${totalDays} days
Total budget: ₹${total_budget}
Travel preferences: ${preferences.join(", ")}

CRITICAL: You MUST generate activities for exactly ${totalDays} days. Do not generate fewer days.
Generate an itinerary covering Day 1 through Day ${totalDays}. Fit within the total budget.`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { 
    return JSON.parse(text); 
  } catch (err) { 
    console.error("JSON Error:", text); 
    throw new Error("AI response was not valid JSON"); 
  }
}

module.exports = { suggestActivities, generatePackingList, generateItinerary };
