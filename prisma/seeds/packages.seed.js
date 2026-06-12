const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const rawPackages = [
  {
    title: "5 Days in Goa — Beach & Relax",
    destination: "Goa",
    country: "India",
    region: "India",
    duration: 5,
    pricePerPerson: 18000,
    currency: "INR",
    travelStyle: "relaxation",
    source: "manual",
    isFeatured: true,
    highlights: ["Beach stays", "Fresh seafood", "Water sports"],
    coverPhoto: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800",
    description: "Sun, sand and the best seafood of your life. A perfectly paced 5-day Goa trip for couples and friends."
  },
  {
    title: "7 Days in Kashmir — Valley of Heaven",
    destination: "Kashmir",
    country: "India",
    region: "India",
    duration: 7,
    pricePerPerson: 32000,
    currency: "INR",
    travelStyle: "adventure",
    source: "manual",
    isFeatured: true,
    highlights: ["Dal Lake houseboat", "Gulmarg meadows", "Pahalgam trek"],
    coverPhoto: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800",
    description: "From the serene Dal Lake to the snow-capped peaks of Gulmarg. Kashmir at its most beautiful."
  },
  {
    title: "10 Days in Rajasthan — Royal Heritage",
    destination: "Rajasthan",
    country: "India",
    region: "India",
    duration: 10,
    pricePerPerson: 28000,
    currency: "INR",
    travelStyle: "cultural",
    source: "manual",
    isFeatured: true,
    highlights: ["Jaipur palaces", "Jaisalmer desert camp", "Udaipur lakes"],
    coverPhoto: "https://images.unsplash.com/photo-1477587458883-47145ed94a68?w=800",
    description: "Forts, palaces, camels and desert sunsets. The complete Rajasthan circuit done right."
  },
  {
    title: "5 Days in Manali — Mountains & Snow",
    destination: "Manali",
    country: "India",
    region: "India",
    duration: 5,
    pricePerPerson: 16000,
    currency: "INR",
    travelStyle: "adventure",
    source: "manual",
    isFeatured: false,
    highlights: ["Rohtang Pass", "River rafting", "Solang Valley"],
    coverPhoto: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
    description: "Snow, adrenaline and mountain cafes. The perfect quick escape to the Himalayas."
  },
  {
    title: "7 Days in Bali — Island Paradise",
    destination: "Bali",
    country: "Indonesia",
    region: "SoutheastAsia",
    duration: 7,
    pricePerPerson: 55000,
    currency: "INR",
    travelStyle: "relaxation",
    source: "manual",
    isFeatured: true,
    highlights: ["Ubud rice terraces", "Seminyak beach", "Temple sunsets"],
    coverPhoto: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf4?w=800",
    description: "Spiritual mornings, beach afternoons and rooftop evenings. Bali does it all."
  },
  {
    title: "7 Days in Thailand — Bangkok & Phuket",
    destination: "Thailand",
    country: "Thailand",
    region: "SoutheastAsia",
    duration: 7,
    pricePerPerson: 45000,
    currency: "INR",
    travelStyle: "cultural",
    source: "manual",
    isFeatured: true,
    highlights: ["Bangkok temples", "Street food tours", "Phi Phi islands"],
    coverPhoto: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800",
    description: "The perfect Thailand split — 3 days of city culture in Bangkok, 4 days of islands in Phuket."
  },
  {
    title: "10 Days in Vietnam — North to South",
    destination: "Vietnam",
    country: "Vietnam",
    region: "SoutheastAsia",
    duration: 10,
    pricePerPerson: 60000,
    currency: "INR",
    travelStyle: "cultural",
    source: "manual",
    isFeatured: false,
    highlights: ["Ha Long Bay cruise", "Hoi An lanterns", "Mekong Delta"],
    coverPhoto: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800",
    description: "Hanoi to Ho Chi Minh — the full length of Vietnam's extraordinary coastline and culture."
  },
  {
    title: "5 Days in Maldives — Luxury Overwater",
    destination: "Maldives",
    country: "Maldives",
    region: "SoutheastAsia",
    duration: 5,
    pricePerPerson: 140000,
    currency: "INR",
    travelStyle: "honeymoon",
    source: "manual",
    isFeatured: true,
    highlights: ["Overwater villa", "Private snorkeling", "Sunset dining"],
    coverPhoto: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800",
    description: "The ultimate luxury escape. Crystal water, private villas and absolute silence."
  },
  {
    title: "5 Days in Dubai — City of Gold",
    destination: "Dubai",
    country: "UAE",
    region: "MiddleEast",
    duration: 5,
    pricePerPerson: 75000,
    currency: "INR",
    travelStyle: "luxury",
    source: "manual",
    isFeatured: true,
    highlights: ["Burj Khalifa", "Desert safari", "Gold Souk"],
    coverPhoto: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
    description: "Skyscrapers, deserts and world-class dining. Dubai is unlike anywhere else on earth."
  },
  {
    title: "10 Days in Europe — Paris & Amsterdam",
    destination: "Europe",
    country: "France / Netherlands",
    region: "Europe",
    duration: 10,
    pricePerPerson: 180000,
    currency: "INR",
    travelStyle: "cultural",
    source: "manual",
    isFeatured: false,
    highlights: ["Eiffel Tower", "Amsterdam canals", "Louvre Museum"],
    coverPhoto: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800",
    description: "Two of Europe's greatest cities in one trip. Romance in Paris, freedom in Amsterdam."
  },
  {
    title: "7 Days in Switzerland — Alpine Luxury",
    destination: "Switzerland",
    country: "Switzerland",
    region: "Europe",
    duration: 7,
    pricePerPerson: 220000,
    currency: "INR",
    travelStyle: "honeymoon",
    source: "manual",
    isFeatured: false,
    highlights: ["Interlaken views", "Glacier Express", "Zurich old town"],
    coverPhoto: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800",
    description: "Snow-capped Alps, mirror lakes and the world's most scenic train ride."
  },
  {
    title: "10 Days in Kenya — Wildlife Safari",
    destination: "Kenya",
    country: "Kenya",
    region: "Africa",
    duration: 10,
    pricePerPerson: 280000,
    currency: "INR",
    travelStyle: "adventure",
    source: "manual",
    isFeatured: false,
    highlights: ["Masai Mara game drives", "Amboseli elephants", "Nairobi culture"],
    coverPhoto: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800",
    description: "The Big Five in their natural habitat. Kenya's wildlife will change you forever."
  }
];

async function seed() {
  console.log('Seeding packages...');
  for (const pkg of rawPackages) {
    // 1. Ensure Destination exists
    let destination = await db.destination.findFirst({
      where: { name: pkg.destination }
    });

    if (!destination) {
      destination = await db.destination.create({
        data: {
          name: pkg.destination,
          country: pkg.country,
          region: pkg.region,
          type: "seeded",
          cover_photo: pkg.coverPhoto,
          description: pkg.description,
          is_active: true
        }
      });
    } else {
      // Force update the cover photo and description if it already existed
      destination = await db.destination.update({
        where: { id: destination.id },
        data: {
          cover_photo: pkg.coverPhoto,
          description: pkg.description,
          region: pkg.region
        }
      });
    }

    // 2. See if package already exists by name
    const existingPackage = await db.travelPackage.findFirst({
      where: { name: pkg.title }
    });

    const copilotSeed = {
      destination: pkg.destination,
      origin: '',
      duration: pkg.duration,
      budget: pkg.pricePerPerson,
      travelers: 2,
      travel_style: pkg.travelStyle
    };

    let packageId;

    if (existingPackage) {
      const updated = await db.travelPackage.update({
        where: { id: existingPackage.id },
        data: {
          duration_days: pkg.duration,
          tagline: pkg.travelStyle, // use travelStyle here so filtering works
          cities_covered: [pkg.destination],
          highlights: pkg.highlights,
          best_season: "Any",
          source: pkg.source,
          isFeatured: pkg.isFeatured,
          region: pkg.region,
          copilotSeed: copilotSeed
        }
      });
      packageId = updated.id;
    } else {
      const created = await db.travelPackage.create({
        data: {
          destination_id: destination.id,
          name: pkg.title,
          duration_days: pkg.duration,
          tagline: pkg.travelStyle, // use travelStyle here so filtering works
          cities_covered: [pkg.destination],
          highlights: pkg.highlights,
          best_season: "Any",
          source: pkg.source,
          isFeatured: pkg.isFeatured,
          region: pkg.region,
          copilotSeed: copilotSeed
        }
      });
      packageId = created.id;
    }

    // 3. Create or Update BudgetTier for price
    const existingTier = await db.budgetTier.findFirst({
      where: { package_id: packageId, tier_name: 'Standard' }
    });

    const pricePerDay = Math.round(pkg.pricePerPerson / pkg.duration);

    if (existingTier) {
      await db.budgetTier.update({
        where: { id: existingTier.id },
        data: {
          price_per_day_inr: pricePerDay,
          total_inr: pkg.pricePerPerson,
          price_per_day_usd: Math.round(pricePerDay / 83),
          total_usd: Math.round(pkg.pricePerPerson / 83)
        }
      });
    } else {
      await db.budgetTier.create({
        data: {
          package_id: packageId,
          tier_name: 'Standard',
          price_per_day_inr: pricePerDay,
          total_inr: pkg.pricePerPerson,
          price_per_day_usd: Math.round(pricePerDay / 83),
          total_usd: Math.round(pkg.pricePerPerson / 83),
          accommodation: "3/4 Star Hotels",
          food: "Local Restaurants",
          transport: "Public Transit & Taxis",
          includes: ["Accommodation", "Transport", "Breakfast"]
        }
      });
    }

    console.log(`  ✓ ${pkg.title}`);
  }
  console.log('Done. 12 packages seeded.');
  await db.$disconnect();
}

seed().catch(console.error);
