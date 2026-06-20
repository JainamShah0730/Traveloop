/**
 * Mock Package Data Generator
 * 
 * BUG 4 + 5 FIX: When a user selects a package in mock/offline mode,
 * this generates a complete trip object with:
 * - Multiple stops (one per city in the package)
 * - Day-by-day activities per stop with real costs
 * - Proper day numbers in activity notes (for timeline grouping)
 * - Unique IDs for stops and activities
 * 
 * DATA FLOW:
 * PackageBookingPage → stores package info in ItineraryContext
 * BuilderScreen → on mount, calls generateMockTrip() → sets trip in state
 * TimelineView → reads trip.stops[activeStop].activities → groups by "Day X" in notes
 */

import { getCityImageUrl } from './cityImages';

// ─── City Coordinates (mirrors backend CITY_COORDS) ─────────────────────────
const CITY_COORDS = {
  'Srinagar': { lat: 34.0837, lng: 74.7973 },
  'Gulmarg': { lat: 34.0484, lng: 74.3805 },
  'Pahalgam': { lat: 34.0161, lng: 75.3150 },
  'Sonamarg': { lat: 34.3025, lng: 75.2953 },
  'Kochi': { lat: 9.9312, lng: 76.2673 },
  'Munnar': { lat: 10.0889, lng: 77.0595 },
  'Alleppey': { lat: 9.4981, lng: 76.3388 },
  'Kovalam': { lat: 8.3988, lng: 76.9828 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Jodhpur': { lat: 26.2389, lng: 73.0243 },
  'Udaipur': { lat: 24.5854, lng: 73.7125 },
  'Jaisalmer': { lat: 26.9157, lng: 70.9083 },
  'Pushkar': { lat: 26.4897, lng: 74.5511 },
  'North Goa': { lat: 15.5631, lng: 73.8146 },
  'South Goa': { lat: 15.2832, lng: 74.0539 },
  'Shimla': { lat: 31.1048, lng: 77.1734 },
  'Manali': { lat: 32.2432, lng: 77.1892 },
  'Kasol': { lat: 32.0100, lng: 77.3150 },
  'Kufri': { lat: 31.0987, lng: 77.2671 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Kyoto': { lat: 35.0116, lng: 135.7681 },
  'Osaka': { lat: 34.6937, lng: 135.5023 },
  'Hakone': { lat: 35.2327, lng: 139.1070 },
  'Takayama': { lat: 36.1462, lng: 137.2522 },
  'Kanazawa': { lat: 36.5613, lng: 136.6562 },
  'Hiroshima': { lat: 34.3853, lng: 132.4553 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Florence': { lat: 43.7696, lng: 11.2558 },
  'Venice': { lat: 45.4408, lng: 12.3155 },
  'Ubud': { lat: -8.5069, lng: 115.2625 },
  'Seminyak': { lat: -8.6913, lng: 115.1686 },
  'Uluwatu': { lat: -8.8291, lng: 115.0849 },
  'Nusa Penida': { lat: -8.7275, lng: 115.5444 },
  'Manhattan': { lat: 40.7831, lng: -73.9712 },
  'Brooklyn': { lat: 40.6782, lng: -73.9442 },
  'Queens': { lat: 40.7282, lng: -73.7949 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Versailles': { lat: 48.8049, lng: 2.1204 },
  'Loire Valley': { lat: 47.3499, lng: 0.6863 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Phuket': { lat: 7.8804, lng: 98.3923 },
  'Chiang Mai': { lat: 18.7883, lng: 98.9853 },
  'Koh Samui': { lat: 9.5120, lng: 100.0136 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
  'Istanbul': { lat: 41.0082, lng: 28.9784 },
  'Cappadocia': { lat: 38.6431, lng: 34.8289 },
  'Ephesus': { lat: 37.9415, lng: 27.3418 },
  'Athens': { lat: 37.9838, lng: 23.7275 },
  'Santorini': { lat: 36.3932, lng: 25.4615 },
  'Mykonos': { lat: 37.4467, lng: 25.3289 },
  'Crete': { lat: 35.2401, lng: 24.4709 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Oxford': { lat: 51.7520, lng: -1.2577 },
  'Edinburgh': { lat: 55.9533, lng: -3.1883 },
  'Bath': { lat: 51.3811, lng: -2.3590 },
};

// ─── Unique ID Generator ───────────────────────────────────────────────────────
let idCounter = 0;
function uid(prefix = 'mock') {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * Generate a single day's activities for a city.
 * Mirrors the backend's generateDayActivities() logic exactly.
 * 
 * IMPORTANT: Each activity has "Day X" in its notes field — this is how
 * TimelineView groups activities into day accordions (BUG 1 + 2 fix).
 * 
 * @param {string} city - City name (e.g. "Kochi")
 * @param {string[]} highlights - Array of highlight strings for the city
 * @param {number} dayIndex - 0-based day index within this stop
 * @param {number} pricePerDay - Budget tier price per day in INR
 * @param {string} tierName - "Backpacker" | "Standard" | "Premium"
 * @returns {Array} Array of activity objects
 */
function generateDayActivities(city, highlights, dayIndex, pricePerDay, tierName) {
  // Cost distribution based on tier (mirrors backend)
  const costSplit = {
    food_breakfast: Math.round(pricePerDay * 0.06),
    food_lunch: Math.round(pricePerDay * 0.10),
    food_dinner: Math.round(pricePerDay * 0.14),
    hotel: Math.round(pricePerDay * 0.40),
    transport: Math.round(pricePerDay * 0.10),
    sightseeing: Math.round(pricePerDay * 0.20),
  };

  const activities = [];

  // 1. Breakfast (08:00)
  const breakfastOptions = [
    `Breakfast at local café in ${city}`,
    `Morning breakfast — ${city} specialties`,
    `Hotel breakfast buffet`,
    `Traditional ${city} breakfast`,
  ];
  activities.push({
    id: uid('act'),
    name: breakfastOptions[dayIndex % breakfastOptions.length],
    type: 'food',
    cost: costSplit.food_breakfast,
    duration_mins: 60,
    // BUG 1 FIX: Day number in notes enables per-day timeline grouping
    notes: `Day ${dayIndex + 1} breakfast | Start: 08:00`,
  });

  // 2. Morning sightseeing (09:30)
  const morningHighlight = highlights[(dayIndex * 2) % highlights.length] || `Explore ${city} morning`;
  activities.push({
    id: uid('act'),
    name: morningHighlight,
    type: 'sightseeing',
    cost: Math.round(costSplit.sightseeing * 0.6),
    duration_mins: 150,
    notes: `Day ${dayIndex + 1} morning exploration | Start: 09:30`,
  });

  // 3. Lunch (12:30)
  const lunchOptions = [
    `Lunch at a popular ${city} restaurant`,
    `Local cuisine lunch — ${city} flavors`,
    `Street food lunch tour in ${city}`,
    `Authentic ${city} lunch experience`,
  ];
  activities.push({
    id: uid('act'),
    name: lunchOptions[dayIndex % lunchOptions.length],
    type: 'food',
    cost: costSplit.food_lunch,
    duration_mins: 60,
    notes: `Day ${dayIndex + 1} lunch | Start: 12:30`,
  });

  // 4. Afternoon sightseeing (14:00)
  const afternoonHighlight = highlights[(dayIndex * 2 + 1) % highlights.length] || `${city} afternoon exploration`;
  activities.push({
    id: uid('act'),
    name: afternoonHighlight,
    type: 'sightseeing',
    cost: Math.round(costSplit.sightseeing * 0.4),
    duration_mins: 150,
    notes: `Day ${dayIndex + 1} afternoon exploration | Start: 14:00`,
  });

  // 5. Transport (17:00)
  activities.push({
    id: uid('act'),
    name: `Local transport in ${city}`,
    type: 'transport',
    cost: costSplit.transport,
    duration_mins: 30,
    notes: `Day ${dayIndex + 1} transport | Start: 17:00`,
  });

  // 6. Dinner (19:00)
  const dinnerOptions = [
    `Dinner at ${tierName === 'Premium' ? 'fine dining restaurant' : 'popular local restaurant'} in ${city}`,
    `${city} evening dinner experience`,
    `Cultural dinner in ${city}`,
    `Signature ${city} dinner`,
  ];
  activities.push({
    id: uid('act'),
    name: dinnerOptions[dayIndex % dinnerOptions.length],
    type: 'food',
    cost: costSplit.food_dinner,
    duration_mins: 90,
    notes: `Day ${dayIndex + 1} dinner | Start: 19:00`,
  });

  // 7. Hotel (21:00)
  const hotelOptions = {
    'Backpacker': `Hostel stay in ${city}`,
    'Standard': `Hotel stay in ${city}`,
    'Premium': `Luxury hotel stay in ${city}`,
  };
  activities.push({
    id: uid('act'),
    name: hotelOptions[tierName] || `Accommodation in ${city}`,
    type: 'hotel',
    cost: costSplit.hotel,
    duration_mins: 480,
    notes: `Day ${dayIndex + 1} accommodation | Check-in: 21:00`,
  });

  return activities;
}

/**
 * Generate a complete mock trip from a package selection.
 * 
 * BUG 4 FIX: Creates a unique trip for EACH package selection.
 * BUG 5 FIX: Activities have real costs based on the budget tier.
 * 
 * @param {Object} params
 * @param {string} params.destId - Destination ID (e.g. "kashmir")
 * @param {Object} params.selectedPackage - Package object with cities, duration, highlights
 * @param {Object} params.selectedTier - Budget tier with price_per_day_inr, tier_name
 * @param {string} params.startDate - Start date string (YYYY-MM-DD)
 * @param {Object} params.destination - Destination object with name, country
 * @param {Object} params.selectedFlight - The user's selected flight (optional)
 * @returns {Object} Complete trip object matching the data model
 */
export function generateMockTrip({ destId, selectedPackage, selectedTier, startDate, destination, selectedFlight }) {
  const pkg = selectedPackage;
  const tier = selectedTier;
  const startDateObj = new Date(startDate);

  // Calculate end date from package duration
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(endDateObj.getDate() + pkg.duration_days);

  // Get city list from the package
  const cities = pkg.cities || pkg.cities_covered || [destination?.name || 'City'];
  const daysPerCity = Math.floor(pkg.duration_days / cities.length);
  const remainingDays = pkg.duration_days % cities.length;
  const lastIndex = cities.length - 1;

  // Get highlights for distributing across stops
  const allHighlights = pkg.highlights || [
    `Explore ${destination?.name || 'city'} landmarks`,
    `Heritage walk`,
    `Cultural tour`,
    `Hidden gems`,
    `Photo walk`,
    `Local markets`,
  ];

  let globalDayIndex = 0;

  // ─── Generate stops with activities ─────────────────────────────────────────
  const stops = cities.map((city, stopIndex) => {
    const stopId = uid('stop');

    // Calculate dates for this stop
    const stopFromDate = new Date(startDateObj);
    stopFromDate.setDate(stopFromDate.getDate() + stopIndex * daysPerCity);

    const stopToDate = new Date(startDateObj);
    const extra = stopIndex === lastIndex ? remainingDays : 0;
    stopToDate.setDate(stopToDate.getDate() + (stopIndex + 1) * daysPerCity + extra);

    const cityDays = stopIndex === lastIndex ? daysPerCity + remainingDays : daysPerCity;

    // Distribute highlights across stops
    const perStop = Math.ceil(allHighlights.length / cities.length);
    const stopHighlights = allHighlights.slice(
      stopIndex * perStop,
      (stopIndex + 1) * perStop
    );

    // BUG 3 FIX: Each stop gets its own image URL based on its city name
    const imageUrl = getCityImageUrl(city, destination?.country || '');

    // ─── Generate activities for each day of this stop ──────────────────────
    // BUG 1+2 FIX: Activities are isolated per day, never shared across days
    const allActivities = [];
    for (let dayIdx = 0; dayIdx < cityDays; dayIdx++) {
      const dayActivities = generateDayActivities(
        city,
        stopHighlights,
        globalDayIndex,
        tier.price_per_day_inr || 7000,
        tier.tier_name || 'Standard'
      );
      // Each activity already has "Day X" in its notes (set by generateDayActivities)
      allActivities.push(...dayActivities);
      globalDayIndex++;
    }

    // Inject flight activity on the very first day of the trip if provided
    if (stopIndex === 0 && selectedFlight) {
      allActivities.unshift({
        id: uid('act-flight'),
        name: `Flight to ${destination?.name || city} — ${selectedFlight.airline} ${selectedFlight.flightNo}`,
        type: 'transport',
        cost: selectedFlight.pricePerPerson || selectedFlight.totalPrice,
        duration_mins: 150,
        notes: `Day 1 departure flight | ${selectedFlight.departTime} - ${selectedFlight.arriveTime}`
      });
    }

    // BUG 5 FIX: Calculate real budget from activity costs
    const totalBudget = allActivities.reduce((sum, act) => sum + (act.cost || 0), 0);

    return {
      id: stopId,
      city_name: city,
      country: destination?.country || 'Unknown',
      lat: CITY_COORDS[city]?.lat || 0,
      lng: CITY_COORDS[city]?.lng || 0,
      from_date: stopFromDate.toISOString(),
      to_date: stopToDate.toISOString(),
      order_index: stopIndex,
      imageUrl,              // BUG 3: unique image per stop
      activities: allActivities,
      totalBudgetINR: totalBudget,  // BUG 5: real budget from activities
    };
  });

  // ─── Assemble the trip object ─────────────────────────────────────────────
  const tripTotalBudget = stops.reduce((sum, s) => sum + s.totalBudgetINR, 0);

  const trip = {
    id: uid('trip'),  // BUG 4 FIX: Unique ID per package selection (not shared mock-1/mock-2)
    name: `${destination?.name || destId} ${pkg.duration_days}-Day Trip`,
    start_date: startDateObj.toISOString(),
    end_date: endDateObj.toISOString(),
    total_budget: tripTotalBudget,
    cover_photo: destination?.cover_photo || getCityImageUrl(destination?.name || cities[0], destination?.country),
    is_public: false,
    stops,
  };

  return trip;
}
