const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trips = await prisma.trip.findMany({
    orderBy: { created_at: 'desc' },
    take: 3,
    include: { stops: true }
  });
  console.log(JSON.stringify(trips, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
