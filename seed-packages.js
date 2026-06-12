const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const predefinedPackages = [
  { dest: 'Goa', country: 'India', region: 'India', durations: [3, 5, 7], budget: 40000, style: 'Beach, party, relaxation' },
  { dest: 'Kashmir', country: 'India', region: 'India', durations: [5, 7], budget: 50000, style: 'Adventure, nature' },
  { dest: 'Rajasthan', country: 'India', region: 'India', durations: [7, 10], budget: 45000, style: 'Cultural, heritage' },
  { dest: 'Manali', country: 'India', region: 'India', durations: [5, 7], budget: 30000, style: 'Adventure, trekking' },
  { dest: 'Bali', country: 'Indonesia', region: 'SoutheastAsia', durations: [5, 7], budget: 80000, style: 'Beach, spiritual, wellness' },
  { dest: 'Bangkok', country: 'Thailand', region: 'SoutheastAsia', durations: [7, 10], budget: 60000, style: 'Party, culture, beach' },
  { dest: 'Vietnam', country: 'Vietnam', region: 'SoutheastAsia', durations: [10, 14], budget: 100000, style: 'Cultural, food, adventure' },
  { dest: 'Maldives', country: 'Maldives', region: 'SoutheastAsia', durations: [3, 5], budget: 150000, style: 'Luxury, honeymoon' },
  { dest: 'Dubai', country: 'UAE', region: 'MiddleEast', durations: [3, 5], budget: 120000, style: 'Luxury, shopping, family' },
  { dest: 'Paris', country: 'France', region: 'Europe', durations: [7, 10], budget: 250000, style: 'Romantic, cultural' },
  { dest: 'Switzerland', country: 'Switzerland', region: 'Europe', durations: [7], budget: 350000, style: 'Nature, luxury, honeymoon' },
  { dest: 'Kenya', country: 'Kenya', region: 'Africa', durations: [7, 10], budget: 400000, style: 'Wildlife, adventure' },
];

async function seed() {
  console.log("Seeding packages...");
  for (const pkg of predefinedPackages) {
    let dest = await prisma.destination.findFirst({ where: { name: pkg.dest } });
    if (!dest) {
      dest = await prisma.destination.create({
        data: {
          name: pkg.dest,
          country: pkg.country,
          region: pkg.region,
          type: 'Curated',
          description: pkg.style,
        }
      });
    }

    for (const duration of pkg.durations) {
      await prisma.travelPackage.create({
        data: {
          destination_id: dest.id,
          name: `${pkg.dest} ${duration} Days Tour`,
          duration_days: duration,
          tagline: pkg.style,
          cities_covered: [pkg.dest],
          highlights: pkg.style.split(',').map(s => s.trim()),
          best_season: 'Any',
          source: 'manual',
          isFeatured: true,
          region: pkg.region,
          budgetTiers: {
            create: [
              {
                tier_name: 'Standard',
                price_per_day_usd: Math.round((pkg.budget / 80) / duration),
                price_per_day_inr: Math.round(pkg.budget / duration),
                total_usd: Math.round(pkg.budget / 80),
                total_inr: pkg.budget,
                accommodation: 'Standard Hotels',
                food: 'Standard Meals',
                transport: 'Standard Transport',
                includes: ['Accommodation', 'Transport']
              }
            ]
          }
        }
      });
    }
  }
  console.log("Seeding complete!");
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
