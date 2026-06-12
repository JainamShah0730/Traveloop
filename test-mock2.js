const fs = require('fs');

function uid(prefix = 'mock') {
  return `${prefix}-${Date.now()}`;
}

function generateDayActivities(city, highlights, dayIndex, pricePerDay, tierName) {
  return [{ id: uid(), name: 'Activity', cost: 100 }];
}

function generateMockTrip({ destId, selectedPackage, selectedTier, startDate, destination }) {
  const pkg = selectedPackage;
  const tier = selectedTier;
  const startDateObj = new Date(startDate);
  
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(endDateObj.getDate() + pkg.duration_days);

  const cities = pkg.cities || pkg.cities_covered || [destination?.name || 'City'];
  const daysPerCity = Math.floor(pkg.duration_days / cities.length);
  const remainingDays = pkg.duration_days % cities.length;
  const lastIndex = cities.length - 1;

  const allHighlights = pkg.highlights || ['A', 'B'];

  const stops = cities.map((city, stopIndex) => {
    const stopId = uid('stop');

    const stopFromDate = new Date(startDateObj);
    stopFromDate.setDate(stopFromDate.getDate() + stopIndex * daysPerCity);

    const stopToDate = new Date(startDateObj);
    const extra = stopIndex === lastIndex ? remainingDays : 0;
    stopToDate.setDate(stopToDate.getDate() + (stopIndex + 1) * daysPerCity + extra);

    const cityDays = stopIndex === lastIndex ? daysPerCity + remainingDays : daysPerCity;
    const perStop = Math.ceil(allHighlights.length / cities.length);
    const stopHighlights = allHighlights.slice(stopIndex * perStop, (stopIndex + 1) * perStop);

    const imageUrl = "img";
    const allActivities = [];
    for (let dayIdx = 0; dayIdx < cityDays; dayIdx++) {
      const dayActivities = generateDayActivities(city, stopHighlights, dayIdx, tier.price_per_day_inr || 7000, tier.tier_name || 'Standard');
      allActivities.push(...dayActivities);
    }

    return {
      id: stopId,
      city_name: city,
      activities: allActivities,
      totalBudgetINR: 100,
    };
  });

  return { stops };
}

const pkg = { id: 'k1', name: 'Kashmir Highlights', duration_days: 5, cities: ['Srinagar', 'Gulmarg'], highlights: [] };
const tier = { tier_name: 'Standard', price_per_day_inr: 7000 };
const dest = { name: 'Kashmir', country: 'India' };

try {
  const trip = generateMockTrip({ destId: 'kashmir', selectedPackage: pkg, selectedTier: tier, startDate: '2024-05-15', destination: dest });
  console.log('Success:', trip.stops.length, 'stops');
} catch (e) {
  console.error('Crash!', e);
}
