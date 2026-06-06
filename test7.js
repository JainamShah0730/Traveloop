const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAll() {
  const notes = await prisma.note.findMany({
    where: { has_reminder: true }
  });
  console.log("All notes with has_reminder=true:", notes);
}

testAll().catch(console.error).finally(() => prisma.$disconnect());
