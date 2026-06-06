// Get all activities across all stops and all days
export function getAllActivities(stops = []) {
  return stops.flatMap(stop => {
    // Some structures might have 'days' with 'activities', others might just have 'activities' on the stop
    if (stop.days && Array.isArray(stop.days)) {
      return stop.days.flatMap(day => (day.activities ?? []));
    }
    return stop.activities ?? [];
  });
}

// Total budget = sum of ALL activity costs
export function calcTotalBudget(stops = []) {
  return getAllActivities(stops)
    .reduce((sum, act) => sum + (Number(act.cost) || 0), 0);
}

// Total spent = sum of activities where isPaid === true
export function calcTotalSpent(stops = []) {
  return getAllActivities(stops)
    .filter(act => act.isPaid === true || act.is_paid === true)
    .reduce((sum, act) => sum + (Number(act.cost) || 0), 0);
}

// Remaining = totalBudget - totalSpent
export function calcRemaining(stops = []) {
  return calcTotalBudget(stops) - calcTotalSpent(stops);
}

// Percentage spent (for the donut/circle chart)
export function calcSpentPercent(stops = []) {
  const total = calcTotalBudget(stops);
  if (total === 0) return 0;
  return Math.round((calcTotalSpent(stops) / total) * 100);
}
