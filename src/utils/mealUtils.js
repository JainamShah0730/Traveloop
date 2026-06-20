/**
 * Given an array of traveler meal preferences,
 * return the most restrictive combined preference to pass to DeepSeek.
 *
 * Priority (most restrictive first):
 * jain > vegan > veg > non-veg > any
 */
function resolveGroupMealPreference(travelers) {
  if (!travelers || travelers.length === 0) return 'any';
  
  const prefs = travelers.map(t => t.mealPref || 'any');
  const priority = ['jain', 'vegan', 'veg', 'non-veg', 'any'];

  for (const pref of priority) {
    if (prefs.includes(pref)) return pref;
  }
  return 'any';
}

/**
 * Build a human-readable meal constraint string for the DeepSeek prompt.
 */
function buildMealConstraintText(travelers) {
  const resolved = resolveGroupMealPreference(travelers);
  const counts = {};
  travelers.forEach(t => {
    const p = t.mealPref || 'any';
    counts[p] = (counts[p] || 0) + 1;
  });

  const lines = [];

  if (resolved === 'jain') {
    lines.push('Group includes Jain traveler(s). All restaurant suggestions MUST be Jain-friendly.');
    lines.push('Jain diet excludes: meat, fish, eggs, root vegetables (onion, garlic, potato, carrot, beetroot, radish, turnip).');
    lines.push('Suggest: Pure Jain veg restaurants, Gujarati thali houses, Rajasthani sweet shops (confirm Jain menu). Always mention "Jain menu available."');
  } else if (resolved === 'vegan') {
    lines.push('Group includes vegan traveler(s). All restaurant suggestions must be vegan-friendly.');
    lines.push('No dairy (milk, paneer, ghee, butter, curd, cream, cheese), no eggs, no meat. Suggest vegan cafes and plant-based restaurants.');
  } else if (resolved === 'veg') {
    lines.push('All travelers are vegetarian. Suggest only vegetarian restaurants and dishes.');
    lines.push('No meat, no fish. Eggs are allowed unless specified. Note: no non-veg restaurants even if they have a veg section.');
  } else if (resolved === 'non-veg') {
    lines.push('Travelers eat non-vegetarian food. Suggest local specialties — fish in coastal areas, lamb in Rajasthan, etc.');
  } else {
    lines.push('No specific meal restrictions. Suggest a variety of local restaurants.');
  }

  // General rules for all
  lines.push('');
  lines.push('GENERAL RULES FOR MEALS:');
  lines.push('- Always name the specific dish, not just the restaurant');
  lines.push('- Format: "Restaurant Name, Area — Dish Name (why it fits)"');
  lines.push('- Example: "Anand Veg, Fort — Jain thali with 12 sabzis, no root veg"');
  lines.push('- Never say "a local restaurant" — always name it');

  // List each traveler's preference for DeepSeek's awareness
  if (travelers.length > 0) {
    const prefSummary = travelers
      .map(t => `${t.name || 'Traveler'}: ${t.mealPref || 'any'}`)
      .join(', ');
    lines.push(`\nIndividual preferences: ${prefSummary}`);
  }

  return lines.join('\n');
}

module.exports = {
  resolveGroupMealPreference,
  buildMealConstraintText
};
