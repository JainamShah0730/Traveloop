const prisma = require('./src/db');

async function cleanTruncated() {
  const allItineraries = await prisma.aiItinerary.findMany();
  let deletedCount = 0;
  
  for (const it of allItineraries) {
    let parsedData = it.data;
    if (typeof parsedData === 'string') {
      try {
        parsedData = JSON.parse(parsedData);
      } catch (e) {
        // Skip
      }
    }
    
    if (parsedData && parsedData.days) {
      const expectedDays = it.duration || parsedData.total_days;
      const actualDays = parsedData.days.length;
      
      if (expectedDays > 0 && actualDays < expectedDays) {
        console.log(`Deleting truncated itinerary ${it.id} (${it.destination}) - Expected: ${expectedDays}, Actual: ${actualDays}`);
        await prisma.aiItinerary.delete({ where: { id: it.id } });
        deletedCount++;
      }
    }
  }
  
  console.log(`Deleted ${deletedCount} truncated itineraries.`);
}

cleanTruncated().catch(console.error).finally(() => prisma.$disconnect());
