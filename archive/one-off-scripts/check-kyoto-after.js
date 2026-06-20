const prisma = require('./src/db');
async function run() {
  const t = await prisma.trip.findFirst({
    where: { name: { contains: 'Kyoto Heritage' } },
    orderBy: { created_at: 'desc' },
    include: { stops: { orderBy: { order_index: 'asc' }, include: { activities: { orderBy: { created_at: 'asc' } } } } }
  });
  console.log('Trip:', t.name, t.start_date.toISOString());
  t.stops.forEach(s => {
    console.log('Stop:', s.city_name);
    s.activities.forEach(a => console.log(a.notes));
  });
}
run().finally(() => prisma.$disconnect());
