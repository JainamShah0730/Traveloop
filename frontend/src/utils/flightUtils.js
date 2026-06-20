/**
 * Calculate the time a user must leave home to catch their flight.
 * Default assumption: 3.5 hours before departure.
 *   - 1 hour to reach airport (can be overridden)
 *   - 2.5 hours for check-in, security, and boarding
 *
 * @param {string} departTime - "HH:MM" in 24hr format e.g. "06:20"
 * @param {number} bufferHours - total buffer before departure (default 3.5)
 * @returns {object} { leaveByTime: "HH:MM", leaveByDisplay: "2:50 AM", isEarlyMorning: boolean }
 */
export function calculateLeaveByTime(departTime, bufferHours = 3.5) {
  const [hours, minutes] = departTime.split(':').map(Number);

  // Total minutes from midnight
  const departMinutes = hours * 60 + minutes;
  const bufferMinutes = bufferHours * 60;
  let leaveMinutes = departMinutes - bufferMinutes;

  // Handle going into previous day (e.g. 06:20 - 3.5hrs = 02:50)
  if (leaveMinutes < 0) leaveMinutes += 24 * 60;

  const leaveHours = Math.floor(leaveMinutes / 60) % 24;
  const leaveMins = Math.floor(leaveMinutes % 60);

  // Format as 12-hour display
  const period = leaveHours >= 12 ? 'PM' : 'AM';
  const displayHours = leaveHours % 12 || 12;
  const displayMins = String(leaveMins).padStart(2, '0');

  return {
    leaveByTime: `${String(leaveHours).padStart(2, '0')}:${displayMins}`,   // 24hr for logic
    leaveByDisplay: `${displayHours}:${displayMins} ${period}`,              // human readable
    isEarlyMorning: leaveHours >= 0 && leaveHours < 6,   // true = show red warning
    departDisplay: formatTime12hr(departTime)
  };
}

function formatTime12hr(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Recalculate remaining budget after flight selection.
 * 
 * GOLDEN RULE: All values are PER PERSON. Group totals are informational only.
 *
 * @param {object} perPersonBreakdown - per-person budget breakdown { flights, accommodation, food, activities, localTransport }
 * @param {number} perPersonBudget - per-person budget ceiling
 * @param {object} selectedFlight - the flight object user picked (must have pricePerPerson)
 * @param {number} travelers - number of travelers
 * @returns {object} structured budget result
 */
export function recalculateBudget(perPersonBreakdown, perPersonBudget, selectedFlight, travelers = 1) {
  const travelersCount = Math.max(1, parseInt(travelers, 10) || 1);

  // All values are PER PERSON
  const breakdown = {
    flights:        selectedFlight?.pricePerPerson || perPersonBreakdown?.flights || 0,
    accommodation:  perPersonBreakdown?.accommodation || 0,
    food:           perPersonBreakdown?.food || 0,
    activities:     perPersonBreakdown?.activities || 0,
    localTransport: perPersonBreakdown?.localTransport || 0,
  };

  let rebalanced = false;
  let rebalanceNote = null;

  const originalFlightBudget = perPersonBreakdown?.flights || 0;
  
  if (selectedFlight && selectedFlight.pricePerPerson > originalFlightBudget) {
    // Flight costs more than allocated. Auto-rebalance by cutting accommodation first.
    let overage = selectedFlight.pricePerPerson - originalFlightBudget;
    
    // 1. Cut from accommodation (up to 50% of it)
    const maxAccCut = Math.round(breakdown.accommodation * 0.5);
    const accCut = Math.min(overage, maxAccCut);
    breakdown.accommodation -= accCut;
    overage -= accCut;
    
    if (accCut > 0) {
      rebalanced = true;
      rebalanceNote = "Accommodation budget adjusted to fit your selected flight.";
    }

    // 2. Cut from activities (up to 50% of it)
    if (overage > 0) {
      const maxActCut = Math.round(breakdown.activities * 0.5);
      const actCut = Math.min(overage, maxActCut);
      breakdown.activities -= actCut;
      overage -= actCut;
      if (!rebalanced) {
        rebalanced = true;
        rebalanceNote = "Activities budget adjusted to fit your selected flight.";
      }
    }
  }

  const totalPerPerson = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const remainingPerPerson = (perPersonBudget || 0) - totalPerPerson;

  return {
    perPersonBudget,
    breakdown,                                        // all per-person values
    totalPerPerson,
    remainingPerPerson,
    isOverBudget: remainingPerPerson < 0,
    overByPerPerson: remainingPerPerson < 0 ? Math.abs(remainingPerPerson) : 0,
    rebalanced,
    rebalanceNote,

    // Group totals — informational only, NOT used for budget check
    groupTotals: {
      flights:       selectedFlight?.totalPrice || 0,
      totalForGroup: totalPerPerson * travelersCount,
    },
    travelers: travelersCount,
  };
}
