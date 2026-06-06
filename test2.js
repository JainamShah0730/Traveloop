const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log("No user found");
  
  const trip = await prisma.trip.findFirst({ where: { user_id: user.id }});
  if (!trip) return console.log("No trip found");

  const note = await prisma.note.create({
    data: {
      trip_id: trip.id,
      title: "Test Reminder Note",
      content: "This should have a reminder",
      has_reminder: true,
      reminder_time: new Date()
    }
  });
  console.log("Created note:", note);

  const fetched = await prisma.note.findUnique({ where: { id: note.id } });
  console.log("Fetched note has_reminder:", fetched.has_reminder);
}

test().catch(console.error).finally(() => prisma.$disconnect());
