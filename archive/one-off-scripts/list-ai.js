const p = require('./src/db');
p.aiItinerary.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  .then(rows => {
    console.log("AiItineraries:", rows.length);
    rows.forEach(r => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      console.log(`ID: ${r.id}, Expected: ${r.duration}, Actual Days: ${data.days?.length}`);
    });
  })
  .finally(() => p.$disconnect());
