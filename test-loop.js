const prisma = require('./src/db');

async function testLoop() {
  const trip = await prisma.trip.findFirst({
    where: { name: { contains: 'Kyoto Heritage' } },
    orderBy: { created_at: 'desc' },
    include: { stops: { orderBy: { order_index: 'asc' } } }
  });

  let absoluteDayCounter = 1;
  for (const stop of trip.stops) {
    const fromDate = new Date(stop.from_date);
    const toDate = new Date(stop.to_date);
    const cityDays = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)));
    
    console.log(`Stop: ${stop.city_name}, cityDays: ${cityDays}, initial absoluteDayCounter: ${absoluteDayCounter}`);
    
    for (let dayIdx = 0; dayIdx < cityDays; dayIdx++) {
      console.log(`  dayIdx: ${dayIdx}, passing absoluteDayCounter: ${absoluteDayCounter}`);
      absoluteDayCounter++;
    }
  }
}

testLoop().finally(() => prisma.$disconnect());
