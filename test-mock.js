const mock = require('./frontend/src/utils/mockPackageData.js');

const pkg = {
  id: 'k1', name: 'Kashmir Highlights', duration_days: 5, cities: ['Srinagar', 'Gulmarg'], highlights: ['Dal Lake Shikara', 'Meadows of Gulmarg', 'Pahalgam Valley']
};
const tier = {
  tier_name: 'Standard', price_per_day_inr: 7000
};
const dest = { name: 'Kashmir', country: 'India' };

try {
  const trip = mock.generateMockTrip({
    destId: 'kashmir',
    selectedPackage: pkg,
    selectedTier: tier,
    startDate: '2024-05-15',
    destination: dest
  });
  console.log('Success:', trip.stops.length, 'stops');
} catch (e) {
  console.error('Crash!', e);
}
