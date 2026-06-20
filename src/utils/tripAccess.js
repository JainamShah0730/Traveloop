const prisma = require("../db");

async function canAccessTrip(tripId, userId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { collaborators: true },
  });
  if (!trip) return { trip: null, allowed: false, isOwner: false };
  
  const isOwner = trip.user_id === userId;
  const isCollab = trip.collaborators.some((c) => c.user_id === userId);
  
  return { trip, allowed: isOwner || isCollab, isOwner };
}

module.exports = { canAccessTrip };
