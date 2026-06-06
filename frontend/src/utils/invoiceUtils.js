export function generateInvoiceFromTrip(trip, travelers = []) {
  // Flatten all activities from all stops and days
  const allActivities = (trip.stops ?? []).flatMap(stop => {
    const acts = [];
    if (stop.days && stop.days.length > 0) {
      stop.days.forEach(day => {
        (day.activities ?? []).forEach(act => {
          acts.push({
            ...act,
            stopCity: stop.city || stop.city_name,
            dayNumber: day.dayNumber,
            date: day.date,
          });
        });
      });
    } else if (stop.activities) {
      stop.activities.forEach(act => {
        acts.push({
          ...act,
          stopCity: stop.city || stop.city_name,
        });
      });
    }
    return acts;
  });

  // Build line items for the table
  const lineItems = allActivities.map((act, index) => ({
    number: index + 1,
    activityId: act.id || act.activityId,
    category: act.type || act.category || 'Other',
    description: act.name || act.title,
    qty: 1,
    unitCost: Number(act.cost) || 0,
    amount: Number(act.cost) || 0,
    date: act.date,
    stopCity: act.stopCity,
    isPaid: act.isPaid ?? act.is_paid ?? false,
  }));

  // Category spend breakdown
  const categorySpend = lineItems.reduce((acc, item) => {
    const cat = item.category.charAt(0).toUpperCase() + item.category.slice(1);
    acc[cat] = (acc[cat] || 0) + item.amount;
    return acc;
  }, {});

  // Totals
  const totalBudget = lineItems.reduce((s, i) => s + i.amount, 0);
  const totalSpent  = lineItems
    .filter(i => i.isPaid)
    .reduce((s, i) => s + i.amount, 0);
  const remaining   = totalBudget - totalSpent;
  const spentPct    = totalBudget > 0
    ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const startDate = new Date(trip.start_date || trip.startDate);
  const endDate = new Date(trip.end_date || trip.endDate);
  
  // Format dates safely
  let dateRange = "Dates TBD";
  if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return {
    invoiceId: `INV-${(trip.id || trip.tripId || 'XXXXXXXX').slice(0,8).toUpperCase()}`,
    generatedDate: new Date().toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    }),
    tripTitle: trip.name || trip.title,
    tripImage: trip.cover_photo || trip.coverImageUrl,
    dateRange: dateRange,
    cities: trip.stops?.length ?? 0,
    travelers: travelers && travelers.length > 0 ? travelers : ['You'],
    paymentStatus: totalSpent === totalBudget && totalBudget > 0
      ? 'PAID' : 'PENDING',
    lineItems,
    categorySpend,
    totalBudget,
    totalSpent,
    remaining,
    spentPct,
  };
}
