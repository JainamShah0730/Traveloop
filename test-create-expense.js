const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trip = await prisma.trip.findFirst({ include: { user: true } });
  if (!trip) {
    console.log("No trips found.");
    return;
  }
  
  let travelers = await prisma.tripTraveler.findMany({ where: { tripId: trip.id } });
  if (travelers.length === 0) {
      console.log("No travelers, creating one...");
      const newTraveler = await prisma.tripTraveler.create({
          data: {
            tripId: trip.id,
            isOwner: true,
            name: trip.user.name,
            email: trip.user.email
          }
        });
        travelers = [newTraveler];
  }

  const tripId = trip.id;
  const title = "Dinner At Taj";
  const amount = 5000;
  const category = "food";
  const paidByTravelerId = travelers[0].id;
  const splitType = "equal";
  
  const shares = travelers.map(t => ({
    travelerId: t.id,
    share: Math.round((amount / travelers.length) * 100) / 100
  }));

  try {
    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          tripId,
          title,
          amount,
          category,
          splitType,
          paidById: paidByTravelerId,
          participants: {
            create: shares.map(s => ({
              travelerId: s.travelerId,
              share: s.share,
              settled: s.travelerId === paidByTravelerId
            }))
          }
        },
        include: {
          participants: { include: { traveler: true } },
          paidBy: true
        }
      });
      return exp;
    });
    console.log("Created successfully:", expense);
  } catch (err) {
    console.error("Prisma error:", err);
  }
}

main().finally(() => prisma.$disconnect());
