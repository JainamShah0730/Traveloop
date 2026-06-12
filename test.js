const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const aiRecord = await prisma.aiItinerary.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!aiRecord) return console.log('No AI record found');
    
    const itinerary = aiRecord.data;
    const destName = itinerary.destination || aiRecord.destination;
    let destination = await prisma.destination.findFirst({
      where: { name: { equals: destName, mode: 'insensitive' } }
    });

    if (!destination) {
      destination = await prisma.destination.create({
        data: {
          name: destName,
          country: 'Unknown',
          type: 'AI Generated',
          description: 'Curated by AI Copilot'
        }
      });
    }

    const duration = itinerary.total_days || aiRecord.duration || 5;
    const total = itinerary.budget_total || aiRecord.budget || 30000;
    const perDay = Math.round(total / duration);

    const newPackage = await prisma.travelPackage.create({
      data: {
        destination_id: destination.id,
        name: `${destName} AI Curated Adventure`,
        duration_days: Number(duration),
        tagline: 'Curated by AI Copilot',
        cities_covered: [destName],
        highlights: itinerary.highlights || itinerary.tips || ['Guided Tours', 'Local Experiences'],
        best_season: itinerary.best_time_to_visit || 'Year Round',
        source: 'ai_generated',
        budgetTiers: {
          create: [{
            tier_name: 'Standard',
            price_per_day_usd: Math.round(perDay / 80),
            price_per_day_inr: perDay,
            total_usd: Math.round(total / 80),
            total_inr: total,
            accommodation: '3-Star Hotels & Guesthouses',
            food: 'Local Eateries & Restaurants',
            transport: 'Public & Shared Cabs',
            includes: ['AI Support', 'Customizable Itinerary']
          }]
        }
      }
    });
    console.log('Success!', newPackage.id);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
