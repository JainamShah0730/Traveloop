// src/services/TravelAgent.js
// CommonJS. Uses existing OpenAI SDK pointed at DeepSeek.

const OpenAI = require('openai'); // already installed
const { FlightTool }  = require('./tools/FlightTool');
const { WeatherTool } = require('./tools/WeatherTool');
const { HotelTool }   = require('./tools/HotelTool');
const { MapsTool }    = require('./tools/MapsTool');
const { BudgetTool }  = require('./tools/BudgetTool');

// Use existing DeepSeek client setup from your project
const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey:  process.env.DEEPSEEK_API_KEY,
});

// ─── Tool definitions (OpenAI function-calling format) ───────────────────────

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_flights',
      description: 'Search available flights between two cities. Returns cheapest options with prices, departure times, and duration.',
      parameters: {
        type: 'object',
        properties: {
          origin:      { type: 'string', description: 'Origin city or IATA code e.g. "Mumbai" or "BOM"' },
          destination: { type: 'string', description: 'Destination city e.g. "Goa"' },
          depart_date: { type: 'string', description: 'Departure date YYYY-MM-DD' },
          return_date: { type: 'string', description: 'Return date YYYY-MM-DD (omit for one-way)' },
          travelers:   { type: 'number', description: 'Number of travelers' }
        },
        required: ['origin', 'destination', 'depart_date', 'travelers']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather forecast for a destination during travel dates. Returns daily forecast, temperature, rain probability, and travel advisories.',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string' },
          start_date:  { type: 'string', description: 'YYYY-MM-DD' },
          end_date:    { type: 'string', description: 'YYYY-MM-DD' }
        },
        required: ['destination', 'start_date', 'end_date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_hotels',
      description: 'Search hotels at a destination within budget. Returns options with price per night, rating, and amenities.',
      parameters: {
        type: 'object',
        properties: {
          destination:      { type: 'string' },
          checkin:          { type: 'string', description: 'YYYY-MM-DD' },
          checkout:         { type: 'string', description: 'YYYY-MM-DD' },
          budget_per_night: { type: 'number', description: 'Max price per night per person in INR' },
          style:            { type: 'string', description: 'budget | comfort | luxury' }
        },
        required: ['destination', 'checkin', 'checkout', 'budget_per_night']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_route',
      description: 'Get travel time and distance between two places within a city. Use when planning daily activities to avoid scheduling geographically distant places back-to-back.',
      parameters: {
        type: 'object',
        properties: {
          origin:      { type: 'string', description: 'Starting place name' },
          destination: { type: 'string', description: 'Destination place name' },
          mode:        { type: 'string', description: 'walking | driving | transit | taxi' }
        },
        required: ['origin', 'destination', 'mode']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'predict_budget',
      description: 'Predict realistic budget breakdown for a trip. Returns estimated costs per category based on destination, duration, and travel style.',
      parameters: {
        type: 'object',
        properties: {
          destination:   { type: 'string' },
          duration_days: { type: 'number' },
          travelers:     { type: 'number' },
          style:         { type: 'string', description: 'budget | mid | luxury' },
          total_budget:  { type: 'number', description: "User's total budget in INR" }
        },
        required: ['destination', 'duration_days', 'travelers', 'style', 'total_budget']
      }
    }
  }
];

// ─── System prompt ────────────────────────────────────────────────────────────

const AGENT_SYSTEM_PROMPT = `You are Travelloop's AI Travel Agent — a personal travel assistant that helps users plan trips from start to finish.

YOUR PERSONALITY:
- Proactive: if a user mentions "7 days" and "beaches", automatically search for flights, check weather, find hotels.
- Specific: always name real places, real airlines, real hotels. Never say "a nice hotel" — say "Zostel Panjim 3-star ₹900/night".
- Budget-aware: ALWAYS keep the per-person budget visible. Every recommendation must include a cost.
- Weather-conscious: if weather data shows rain during the trip, mention it and adjust the itinerary.
- Time-aware: use route data to ensure activities are geographically sensible on the same day.

WHEN USER MENTIONS A TRIP:
1. Identify: destination, duration, budget, travelers, origin, style
2. Call tools in parallel where possible: search_flights + get_weather + search_hotels + predict_budget
3. If any tool fails, continue with what succeeded and note the gap
4. Build a complete response with: best flight, weather summary, recommended hotel, day-by-day plan, budget breakdown

BUDGET RULES:
- All costs are PER PERSON
- Budget check: sum(flights + hotels + food + activities + transport) <= budget_per_person
- If over budget: reduce accommodation quality first, then activities
- Always show: "₹X used · ₹Y remaining" in the response

RESPONSE FORMAT for trip planning queries:
## [Destination] — [Duration] Trip

**Best flight:** [airline] · [depart] → [arrive] · ₹[price]/person
**Hotel:** [name] · [rating]★ · ₹[price]/night/person
**Weather:** [summary]

**Budget breakdown (per person):**
- Flights: ₹X
- Hotel: ₹X  
- Food: ₹X
- Activities: ₹X
- Transport: ₹X
- **Total: ₹X** (₹Y remaining from your ₹Z budget)

**Day-by-day plan:**
[Day 1 — Arrival]
Morning: [activity] (₹X)
Afternoon: [activity] (₹X)
Evening: [activity] (₹X)

**Tips:**
- [3-5 specific, actionable tips]

For follow-up questions, respond conversationally.
For optimization requests, use get_route to recalculate travel times.
For budget questions, use predict_budget to show alternatives.`;

// ─── Tool executor ────────────────────────────────────────────────────────────

async function callTool(toolName, args) {
  switch (toolName) {
    case 'search_flights':  return FlightTool.search(args);
    case 'get_weather':     return WeatherTool.getForecast(args);
    case 'search_hotels':   return HotelTool.search(args);
    case 'get_route':       return MapsTool.getRoute(args);
    case 'predict_budget':  return BudgetTool.predict(args);
    default: throw new Error(`Unknown tool: ${toolName}`);
  }
}

// ─── Main agent function ──────────────────────────────────────────────────────

async function runTravelAgent({ userMessage, userId, conversationHistory = [] }) {
  // Cap history at 10 messages to prevent token overflow
  const cappedHistory = conversationHistory.slice(-10);

  const messages = [
    { role: 'system',  content: AGENT_SYSTEM_PROMPT },
    ...cappedHistory,
    { role: 'user',    content: userMessage }
  ];

  let toolsCalled = [];

  // Agentic loop — keep running until DeepSeek stops calling tools
  while (true) {
    const response = await client.chat.completions.create({
      model:       'deepseek-chat',
      messages,
      tools:       TOOLS,
      tool_choice: 'auto',
      max_tokens:  4000,
    });

    const choice = response.choices[0];

    // Add assistant message to history
    messages.push(choice.message);

    // If no tool calls — we're done
    if (choice.finish_reason !== 'tool_calls' || !choice.message.tool_calls?.length) {
      const finalText = choice.message.content || '';
      return { response: finalText, toolsCalled, messages };
    }

    // Execute all tool calls in parallel
    const toolCalls = choice.message.tool_calls;
    const toolResults = await Promise.allSettled(
      toolCalls.map(async (tc) => {
        const args = JSON.parse(tc.function.arguments);
        try {
          const result = await callTool(tc.function.name, args);
          toolsCalled.push(tc.function.name);
          return {
            role:         'tool',
            tool_call_id: tc.id,
            content:      JSON.stringify(result)
          };
        } catch (err) {
          // Tool failed — return error so agent can work around it
          return {
            role:         'tool',
            tool_call_id: tc.id,
            content:      JSON.stringify({ error: err.message, fallback: true })
          };
        }
      })
    );

    // Add tool results to messages and continue the loop
    toolResults.forEach(r => {
      if (r.status === 'fulfilled') {
        messages.push(r.value);
      }
    });
  }
}

module.exports = { runTravelAgent };
