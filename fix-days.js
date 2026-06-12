const prisma = require('./src/db');

async function fixDB() {
  const trips = await prisma.trip.findMany({
    where: { name: { contains: 'Kyoto Heritage' } },
    include: { stops: { orderBy: { order_index: 'asc' }, include: { activities: true } } }
  });

  for (const trip of trips) {
    let absoluteDayCounter = 1;
    
    for (const stop of trip.stops) {
      const fromDate = new Date(stop.from_date);
      const toDate = new Date(stop.to_date);
      const cityDays = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)));
      
      const actsByDay = {};
      stop.activities.forEach(act => {
        const match = act.notes.match(/Day\s+(\d+)/);
        if (match) {
          const d = parseInt(match[1]);
          if (!actsByDay[d]) actsByDay[d] = [];
          actsByDay[d].push(act);
        }
      });
      
      const sortedOriginalDays = Object.keys(actsByDay).map(Number).sort((a,b)=>a-b);
      
      for (const origDay of sortedOriginalDays) {
        for (const act of actsByDay[origDay]) {
          const newNotes = act.notes.replace(/Day\s+\d+/, `Day ${absoluteDayCounter}`);
          if (newNotes !== act.notes) {
            await prisma.activity.update({
              where: { id: act.id },
              data: { notes: newNotes }
            });
          }
        }
        absoluteDayCounter++;
      }
    }
  }
}

fixDB().then(() => console.log('Fixed')).finally(() => prisma.$disconnect());
