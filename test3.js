const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const note = await prisma.note.findFirst();
  if (!note) return console.log("No note found");
  
  console.log("Original note:", note);

  // simulate what the PUT endpoint does
  const dataToUpdate = { content: note.content + " edited" };
  const reminder_time = "2026-06-10T19:45";
  dataToUpdate.reminder_time = new Date(reminder_time);
  dataToUpdate.has_reminder = true;

  const updated = await prisma.note.update({
    where: { id: note.id },
    data: dataToUpdate
  });
  console.log("Updated note:", updated);
}

test().catch(console.error).finally(() => prisma.$disconnect());
