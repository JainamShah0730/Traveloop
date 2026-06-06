const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReminders() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log("No user");

  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { user_id: user.id },
        { collaborators: { some: { user_id: user.id } } }
      ]
    },
    select: { id: true, name: true }
  });
  console.log("Trips found:", trips.length);

  const tripIds = trips.map(t => t.id);

  const reminders = await prisma.note.findMany({
    where: {
      trip_id: { in: tripIds },
      has_reminder: true,
      is_read: false
    },
    orderBy: { reminder_time: 'asc' }
  });

  console.log("Unread Reminders:", reminders);
}

testReminders().catch(console.error).finally(() => prisma.$disconnect());
