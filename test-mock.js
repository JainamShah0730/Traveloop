import { generateMockTrip } from './frontend/src/utils/mockPackageData.js';
const mockTrip = generateMockTrip({
    destId: 'greece',
    selectedPackage: { id: 'gr1', name: 'Greek Islands', duration_days: 7, cities: ['Athens', 'Santorini'], highlights: ['Acropolis', 'Oia Sunset', 'Caldera Views', 'Black Sand Beach'], budgetTiers: [{ tier_name: 'Standard', price_per_day_inr: 7000 }] },
    selectedTier: { tier_name: 'Standard', price_per_day_inr: 7000, total_inr: 49000 },
    startDate: '2026-06-17',
    destination: { name: 'Santorini', country: 'Greece', description: 'Santorini · Athens · Mykonos', type: 'Beach' },
});
console.log(JSON.stringify(mockTrip.stops, null, 2));
