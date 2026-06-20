/**
 * updateItineraryWithSelections
 *
 * Takes the full itinerary JSON (from DeepSeek) and patches it with the
 * user's confirmed flight and hotel selections:
 *  1. Replaces hotel.name / cost / rating on every day card
 *  2. Updates cost_breakdown_per_person.flights with selected flight price
 *  3. Updates cost_breakdown_per_person.accommodation with selected hotel price × nights
 *  4. Recalculates budget_used_per_person and budget_remaining_per_person
 */
function updateItineraryWithSelections(itineraryData, selectedFlight, selectedHotel) {
  if (!itineraryData) return itineraryData;

  // Deep-clone so we don't mutate the original
  const data = JSON.parse(JSON.stringify(itineraryData));

  // 1. Update every day card's hotel with the selected hotel
  if (selectedHotel && data.days) {
    data.days = data.days.map(day => ({
      ...day,
      hotel: {
        ...(day.hotel || {}),
        name: selectedHotel.name,
        cost_per_person_per_night: selectedHotel.pricePerNight,
        cost_per_night: selectedHotel.pricePerNight,
        rating: selectedHotel.rating,
      }
    }));
  }

  // 2. Update cost breakdown with real selected prices
  if (selectedFlight || selectedHotel) {
    const nights = data.days?.length || 1;
    const hotelTotalPerPerson = selectedHotel
      ? selectedHotel.pricePerNight * nights
      : (data.cost_breakdown_per_person?.accommodation || 0);

    const flightPerPerson = selectedFlight
      ? (selectedFlight.pricePerPerson || selectedFlight.price || 0)
      : (data.cost_breakdown_per_person?.flights || 0);

    data.cost_breakdown_per_person = {
      ...(data.cost_breakdown_per_person || {}),
      flights: flightPerPerson,
      accommodation: hotelTotalPerPerson,
    };

    // Recalculate total used
    const breakdown = data.cost_breakdown_per_person;
    data.budget_used_per_person = Object.values(breakdown)
      .reduce((a, b) => a + (Number(b) || 0), 0);
    data.budget_remaining_per_person =
      (data.budget_per_person || 0) - data.budget_used_per_person;
  }

  return data;
}

module.exports = { updateItineraryWithSelections };
