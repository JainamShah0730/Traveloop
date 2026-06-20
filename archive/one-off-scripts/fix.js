const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function fix() {
  const tables = ['Journal', 'AiItinerary', 'Poll', 'Expense', 'Settlement'];
  for (const t of tables) {
    try {
      await db.$executeRawUnsafe(`ALTER TABLE "${t}" DROP CONSTRAINT "${t}_tripId_fkey";`);
      await db.$executeRawUnsafe(`ALTER TABLE "${t}" ADD CONSTRAINT "${t}_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
      console.log('Fixed cascade for', t);
    } catch(e) {
      console.log('Skipped or failed for', t, '-', e.message);
    }
  }
}

fix().then(() => db.$disconnect());
