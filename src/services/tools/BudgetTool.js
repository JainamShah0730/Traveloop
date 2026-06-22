/**
 * BudgetTool — Predict realistic budget breakdown for a trip
 * 
 * Pure computation — no external API needed.
 * Uses destination cost multipliers and style-tiered daily costs.
 */

const DESTINATION_COST_INDEX = {
  'goa': 1.2,
  'manali': 0.9,
  'kashmir': 1.1,
  'rishikesh': 0.8,
  'jaipur': 1.0,
  'udaipur': 1.3,
  'kerala': 1.1,
  'ladakh': 1.4,
  'andaman': 1.5,
  'bali': 1.4,
  'thailand': 1.3,
  'singapore': 2.0,
  'dubai': 2.5,
  'europe': 4.0,
  'paris': 4.5,
  'london': 5.0,
  'switzerland': 5.0,
  'japan': 3.5,
  'maldives': 5.5,
  'new york': 4.0,
  'default': 1.0
};

// Base daily costs in INR per person (India baseline)
const BASE_COSTS = {
  budget: { hotel: 800, food: 600, activities: 400, transport: 300 },
  mid: { hotel: 2500, food: 1200, activities: 1000, transport: 600 },
  luxury: { hotel: 8000, food: 3000, activities: 2500, transport: 1500 }
};

const BudgetTool = {
  async predict({ destination, duration_days, travelers, style, total_budget }) {
    const budgetPerPerson = Math.round(total_budget / Math.max(1, travelers));
    const dest = (destination || '').toLowerCase();

    // Find cost multiplier — check exact match, then partial match
    let multiplier = DESTINATION_COST_INDEX[dest];
    if (!multiplier) {
      const partialKey = Object.keys(DESTINATION_COST_INDEX).find(k => dest.includes(k));
      multiplier = partialKey ? DESTINATION_COST_INDEX[partialKey] : DESTINATION_COST_INDEX['default'];
    }

    const baseCosts = BASE_COSTS[style] || BASE_COSTS.mid;

    const dailyCosts = {};
    for (const [key, value] of Object.entries(baseCosts)) {
      dailyCosts[key] = Math.round(value * multiplier);
    }

    // Estimate flight cost (rough per-person round-trip)
    const flightEstimate = Math.round(multiplier * 6000);

    const breakdown = {
      flights: flightEstimate,
      accommodation: dailyCosts.hotel * duration_days,
      food: dailyCosts.food * duration_days,
      activities: dailyCosts.activities * duration_days,
      localTransport: dailyCosts.transport * duration_days,
    };
    breakdown.total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    breakdown.remaining = budgetPerPerson - breakdown.total;
    breakdown.isRealistic = breakdown.remaining >= 0;

    return {
      budgetPerPerson,
      breakdown,
      verdict: breakdown.isRealistic
        ? `₹${budgetPerPerson.toLocaleString('en-IN')} is realistic for ${duration_days} days in ${destination}`
        : `₹${budgetPerPerson.toLocaleString('en-IN')} is tight — consider reducing to ${Math.round(duration_days * 0.7)} days or choosing budget accommodation`,
      dailyCosts,
      multiplier,
      cheapestDateSuggestion: 'Travel mid-week (Tue/Wed) for 15-20% cheaper flights'
    };
  }
};

module.exports = { BudgetTool };
