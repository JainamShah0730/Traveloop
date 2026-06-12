function generateDayActivities(city, highlights, dayIndex, pricePerDay, tierName, absoluteDayNumber = dayIndex + 1) {
  return `Day ${absoluteDayNumber} breakfast | Start: 08:00`;
}

const stops = [
  { city_name: 'Tokyo' },
  { city_name: 'Kyoto' }
];

let absoluteDayCounter = 1;
const daysPerCity = [3, 4];

stops.forEach((stop, index) => {
  const cityDays = daysPerCity[index];
  for (let dayIdx = 0; dayIdx < cityDays; dayIdx++) {
    const act = generateDayActivities(
      stop.city_name,
      [],
      dayIdx,
      5000,
      'Standard',
      absoluteDayCounter
    );
    console.log(stop.city_name, dayIdx, absoluteDayCounter, act);
    absoluteDayCounter++;
  }
});
