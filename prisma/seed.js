const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDestination(data) {
  const dest = await prisma.destination.create({
    data: {
      name: data.name,
      country: data.country,
      region: data.region,
      type: data.type,
      cover_photo: data.cover_photo,
      description: data.description
    }
  });

  console.log(`Seeding destination: ${dest.name}...`);

  for (const pkg of data.packages) {
    const created = await prisma.travelPackage.create({
      data: {
        destination_id: dest.id,
        name: pkg.name,
        duration_days: pkg.days,
        tagline: pkg.tagline,
        cities_covered: pkg.cities,
        highlights: pkg.highlights,
        best_season: pkg.season
      }
    });

    for (const tier of pkg.tiers) {
      await prisma.budgetTier.create({
        data: {
          package_id: created.id,
          tier_name: tier.tier_name,
          price_per_day_usd: tier.price_per_day_usd,
          price_per_day_inr: tier.price_per_day_inr,
          total_usd: tier.price_per_day_usd * pkg.days,
          total_inr: tier.price_per_day_inr * pkg.days,
          accommodation: tier.accommodation,
          food: tier.food,
          transport: tier.transport,
          includes: tier.includes
        }
      });
    }
  }
}

const TIER_TEMPLATES = {
  Backpacker: {
    tier_name: 'Backpacker',
    accommodation: 'Budget hostels and guesthouses',
    food: 'Street food and local markets',
    transport: 'Public transport and shared rides',
    includes: ['Accommodation', 'Breakfast', 'Public transport pass', 'Sightseeing map']
  },
  Standard: {
    tier_name: 'Standard',
    accommodation: '3-star hotels',
    food: 'Restaurant meals (breakfast + dinner)',
    transport: 'Private cab or guided coach',
    includes: ['Accommodation', 'Breakfast and dinner', 'Private transfers', 'Local guide', 'Travel insurance']
  },
  Premium: {
    tier_name: 'Premium',
    accommodation: '5-star hotels and luxury resorts',
    food: 'All meals with fine dining',
    transport: 'Private luxury vehicle with chauffeur',
    includes: ['Luxury accommodation', 'All meals', 'Private chauffeur', 'Personal guide', 'Airport lounge access', '24/7 concierge', 'Spa access']
  }
};

const SEED_DATA = [
  // --- INDIA ---
  {
    name: 'Kashmir', country: 'India', region: 'North India', type: 'Hill Station',
    description: 'Heaven on earth — snow peaks, Dal Lake, and lush meadows',
    cover_photo: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1',
    packages: [
      {
        name: 'Kashmir Quick Escape', days: 5, tagline: 'Dal Lake and snowy slopes in 5 days', season: 'April–October',
        cities: ['Srinagar', 'Gulmarg', 'Pahalgam'],
        highlights: ['Dal Lake shikara ride', 'Gulmarg Gondola cable car', 'Betaab Valley trek', 'Mughal Gardens visit'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1500, price_per_day_usd: 18 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 4000, price_per_day_usd: 48 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 10000, price_per_day_usd: 120 }
        ]
      },
      {
        name: 'Kashmir Grand Tour', days: 10, tagline: 'Complete Kashmir valley experience', season: 'April–October',
        cities: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Yusmarg'],
        highlights: ['Houseboat stay on Dal Lake', 'Ski slopes at Gulmarg', 'River rafting in Pahalgam', 'Sonamarg glacier walk', 'Thajiwas Glacier hike'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1500, price_per_day_usd: 18 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 4000, price_per_day_usd: 48 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 10000, price_per_day_usd: 120 }
        ]
      },
      {
        name: 'Kashmir & Ladakh Explorer', days: 15, tagline: 'Kashmir valley meets Ladakh desert', season: 'May–September',
        cities: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Leh', 'Kargil'],
        highlights: ['Complete Kashmir Valley', 'Leh Ladakh extension', 'Pangong Lake sunset', 'Khardung La highest motorable pass', 'Magnetic Hill'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1500, price_per_day_usd: 18 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 4000, price_per_day_usd: 48 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 10000, price_per_day_usd: 120 }
        ]
      }
    ]
  },
  {
    name: 'Goa', country: 'India', region: 'West India', type: 'Beach',
    description: 'Sun, sand and Portuguese charm on India\'s western coast',
    cover_photo: 'https://images.unsplash.com/photo-1512341689857-198e7e2f3ca8',
    packages: [
      {
        name: 'Goa Weekend Getaway', days: 3, tagline: 'Beaches and nightlife in 3 days', season: 'November–March',
        cities: ['Panaji', 'North Goa'],
        highlights: ['Baga Beach party scene', 'Anjuna Flea Market', 'Old Goa UNESCO churches', 'Dudhsagar Waterfall day trip'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1200, price_per_day_usd: 15 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 3500, price_per_day_usd: 42 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 9000, price_per_day_usd: 108 }
        ]
      },
      {
        name: 'Complete Goa Experience', days: 7, tagline: 'North to South Goa in one week', season: 'November–March',
        cities: ['Panaji', 'North Goa', 'South Goa', 'Ponda'],
        highlights: ['Beach hopping North to South', 'Spice plantation village tour', 'Dolphin watching cruise', 'Night market at Arpora', 'Shanta Durga temple'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1200, price_per_day_usd: 15 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 3500, price_per_day_usd: 42 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 9000, price_per_day_usd: 108 }
        ]
      }
    ]
  },
  {
    name: 'Rajasthan', country: 'India', region: 'North India', type: 'Heritage',
    description: 'Land of maharajas, forts, deserts and royal palaces',
    cover_photo: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da',
    packages: [
      {
        name: 'Golden Triangle Classic', days: 5, tagline: 'Jaipur and Agra\'s iconic monuments', season: 'October–March',
        cities: ['Jaipur', 'Agra', 'Fatehpur Sikri'],
        highlights: ['Taj Mahal at sunrise', 'Amber Fort elephant ride', 'Hawa Mahal facade', 'Fatehpur Sikri ruins', 'Local bazaar shopping'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1000, price_per_day_usd: 12 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 3000, price_per_day_usd: 36 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 8000, price_per_day_usd: 96 }
        ]
      },
      {
        name: 'Rajasthan Royal Circuit', days: 10, tagline: 'Forts, lakes and desert safari', season: 'October–March',
        cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer'],
        highlights: ['Mehrangarh Fort Jodhpur', 'Lake Pichola sunset boat ride', 'Desert safari Sam Sand Dunes', 'City Palace Udaipur', 'Camel ride at sunset'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1000, price_per_day_usd: 12 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 3000, price_per_day_usd: 36 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 8000, price_per_day_usd: 96 }
        ]
      },
      {
        name: 'Complete Rajasthan Grand Tour', days: 15, tagline: 'Every royal city of Rajasthan', season: 'October–March',
        cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer', 'Pushkar', 'Bikaner'],
        highlights: ['Pushkar camel fair', 'Junagarh Fort Bikaner', 'Brahma Temple Pushkar', 'Complete desert circuit', 'Heritage hotel stays'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1000, price_per_day_usd: 12 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 3000, price_per_day_usd: 36 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 8000, price_per_day_usd: 96 }
        ]
      }
    ]
  },
  {
    name: 'Himachal Pradesh', country: 'India', region: 'North India', type: 'Hill Station',
    description: 'Pine forests, snow peaks and adventure sports in the Himalayas',
    cover_photo: 'https://images.unsplash.com/photo-1597074866923-dc0589150358',
    packages: [
      {
        name: 'Shimla Weekend', days: 4, tagline: 'Colonial charm and snowy Kufri', season: 'December–February',
        cities: ['Shimla', 'Kufri', 'Chail'],
        highlights: ['Mall Road stroll', 'Kufri snowfall', 'Christ Church', 'Jakhu Temple monkeys', 'Chail cricket ground'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1200, price_per_day_usd: 15 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 3500, price_per_day_usd: 42 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 9000, price_per_day_usd: 108 }
        ]
      },
      {
        name: 'Shimla Manali Adventure', days: 10, tagline: 'Hills, snow and adventure sports', season: 'May–October',
        cities: ['Shimla', 'Manali', 'Rohtang Pass', 'Solang Valley', 'Kasol'],
        highlights: ['Rohtang snowfields', 'Solang Valley paragliding', 'Hadimba Temple forest', 'Beas River rafting', 'Kasol riverside camping'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1200, price_per_day_usd: 15 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 3500, price_per_day_usd: 42 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 9000, price_per_day_usd: 108 }
        ]
      }
    ]
  },
  {
    name: 'Kerala', country: 'India', region: 'South India', type: 'Tropical',
    description: 'God\'s own country — backwaters, tea hills and Ayurveda',
    cover_photo: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b',
    packages: [
      {
        name: 'Kerala Highlights', days: 5, tagline: 'Backwaters, tea and beaches', season: 'September–March',
        cities: ['Kochi', 'Munnar', 'Alleppey'],
        highlights: ['Alleppey houseboat backwaters', 'Munnar tea plantation walk', 'Chinese fishing nets Kochi', 'Kathakali classical dance', 'Spice market tour'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1400, price_per_day_usd: 17 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 4000, price_per_day_usd: 48 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 11000, price_per_day_usd: 132 }
        ]
      },
      {
        name: 'Complete Kerala Circuit', days: 10, tagline: 'Full Kerala from north to south', season: 'September–March',
        cities: ['Kochi', 'Munnar', 'Alleppey', 'Kovalam', 'Thekkady', 'Wayanad'],
        highlights: ['Periyar Wildlife boat safari', 'Kovalam beach lighthouse', 'Ayurveda spa retreat', 'Wayanad tribal village', 'Tea factory tour Munnar'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 1400, price_per_day_usd: 17 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 4000, price_per_day_usd: 48 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 11000, price_per_day_usd: 132 }
        ]
      }
    ]
  },
  // --- JAPAN ---
  {
    name: 'Japan', country: 'Japan', region: 'East Asia', type: 'Cultural',
    description: 'Ancient temples, neon cities, cherry blossoms and world-class cuisine',
    cover_photo: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    packages: [
      {
        name: 'Japan Highlights', days: 7, tagline: 'Tokyo, Kyoto and Osaka in one week', season: 'March–May',
        cities: ['Tokyo', 'Kyoto', 'Osaka'],
        highlights: ['Fushimi Inari thousand torii gates', 'Shinjuku neon district', 'Arashiyama bamboo grove', 'Dotonbori food street Osaka', 'teamLab digital art Tokyo'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 6640, price_per_day_usd: 80 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 14940, price_per_day_usd: 180 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 37350, price_per_day_usd: 450 }
        ]
      },
      {
        name: 'Japan Deep Dive', days: 14, tagline: 'From Tokyo to Hiroshima and beyond', season: 'March–May',
        cities: ['Tokyo', 'Nikko', 'Kyoto', 'Nara', 'Osaka', 'Hiroshima', 'Miyajima'],
        highlights: ['Nikko ornate shrines', 'Nara free-roaming deer', 'Hiroshima Peace Memorial', 'Miyajima floating torii gate', 'Bullet train shinkansen experience', 'Mount Fuji view from Hakone'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 6640, price_per_day_usd: 80 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 14940, price_per_day_usd: 180 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 37350, price_per_day_usd: 450 }
        ]
      },
      {
        name: 'Japan Winter Snow Experience', days: 10, tagline: 'Ski, onsen and snow festivals', season: 'December–February',
        cities: ['Tokyo', 'Sapporo', 'Hokkaido', 'Nikko'],
        highlights: ['Sapporo Snow Festival', 'Hokkaido ski resorts', 'Traditional onsen ryokan stay', 'Snow monkey park Nagano', 'Ice sculptures Otaru'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 6640, price_per_day_usd: 80 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 14940, price_per_day_usd: 180 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 37350, price_per_day_usd: 450 }
        ]
      }
    ]
  },
  // --- ITALY ---
  {
    name: 'Italy', country: 'Italy', region: 'Southern Europe', type: 'Heritage',
    description: 'Roman ruins, Renaissance art, pizza and romantic canals',
    cover_photo: 'https://images.unsplash.com/photo-1516483638261-f4969839290f',
    packages: [
      {
        name: 'Italy Classic', days: 7, tagline: 'Rome, Florence and Venice essentials', season: 'April–June',
        cities: ['Rome', 'Florence', 'Venice'],
        highlights: ['Colosseum and Roman Forum', 'Vatican Museums and Sistine Chapel', 'Uffizi Gallery Florence', 'Venice gondola ride', 'Rialto Bridge and St Mark\'s Square'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 5810, price_per_day_usd: 70 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 13280, price_per_day_usd: 160 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 33200, price_per_day_usd: 400 }
        ]
      },
      {
        name: 'Italy Grand Tour', days: 12, tagline: 'From Rome to the Amalfi Coast', season: 'May–October',
        cities: ['Rome', 'Naples', 'Pompeii', 'Amalfi', 'Positano', 'Florence', 'Venice'],
        highlights: ['Pompeii ancient ruins', 'Amalfi Coast drive', 'Positano cliffside town', 'Cinque Terre coastal villages', 'Tuscany wine and olive tour'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 5810, price_per_day_usd: 70 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 13280, price_per_day_usd: 160 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 33200, price_per_day_usd: 400 }
        ]
      },
      {
        name: 'Northern Italy Explorer', days: 8, tagline: 'Milan, Lake Como and the Dolomites', season: 'June–September',
        cities: ['Milan', 'Lake Como', 'Verona', 'Venice', 'Dolomites'],
        highlights: ['Lake Como by ferry', 'Verona Romeo and Juliet balcony', 'Dolomites hiking trails', 'Milan Duomo cathedral', 'Prosecco hills UNESCO site'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 5810, price_per_day_usd: 70 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 13280, price_per_day_usd: 160 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 33200, price_per_day_usd: 400 }
        ]
      }
    ]
  },
  // --- BALI, INDONESIA ---
  {
    name: 'Bali', country: 'Indonesia', region: 'Southeast Asia', type: 'Tropical',
    description: 'Island of gods — rice terraces, surf beaches and spiritual temples',
    cover_photo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
    packages: [
      {
        name: 'Bali Escape', days: 5, tagline: 'Ubud culture and Seminyak beach', season: 'April–October',
        cities: ['Ubud', 'Seminyak', 'Kuta'],
        highlights: ['Tanah Lot sea temple sunset', 'Tegallalang rice terrace trek', 'Ubud Monkey Forest', 'Kuta beach surfing lesson', 'Balinese cooking class'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 2905, price_per_day_usd: 35 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 7470, price_per_day_usd: 90 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 20750, price_per_day_usd: 250 }
        ]
      },
      {
        name: 'Bali Complete', days: 10, tagline: 'All of Bali from temples to volcanoes', season: 'April–October',
        cities: ['Ubud', 'Seminyak', 'Uluwatu', 'Amed', 'Mount Batur', 'Nusa Penida'],
        highlights: ['Mount Batur volcano sunrise trek', 'Nusa Penida cliffs and snorkelling', 'Uluwatu cliff temple Kecak dance', 'Amed snorkelling and diving', 'Handara Gate Instagram spot'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 2905, price_per_day_usd: 35 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 7470, price_per_day_usd: 90 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 20750, price_per_day_usd: 250 }
        ]
      }
    ]
  },
  // --- USA ---
  {
    name: 'New York', country: 'USA', region: 'North America', type: 'Urban',
    description: 'The city that never sleeps — Broadway, Central Park and iconic skyline',
    cover_photo: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
    packages: [
      {
        name: 'New York City Break', days: 4, tagline: 'Manhattan\'s must-sees in 4 days', season: 'April–June',
        cities: ['Manhattan', 'Brooklyn'],
        highlights: ['Times Square and Broadway show', 'Central Park bike ride', 'Brooklyn Bridge walk', 'Metropolitan Museum of Art', 'High Line aerial park'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 9960, price_per_day_usd: 120 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 23240, price_per_day_usd: 280 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 58100, price_per_day_usd: 700 }
        ]
      },
      {
        name: 'New York & East Coast', days: 10, tagline: 'NYC to Washington DC by Amtrak', season: 'April–June',
        cities: ['Manhattan', 'Brooklyn', 'Philadelphia', 'Washington DC', 'Boston'],
        highlights: ['Statue of Liberty ferry', 'Philadelphia Liberty Bell', 'Washington DC monuments free', 'Boston Freedom Trail', 'Harvard University campus tour'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 9960, price_per_day_usd: 120 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 23240, price_per_day_usd: 280 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 58100, price_per_day_usd: 700 }
        ]
      }
    ]
  },
  // --- FRANCE ---
  {
    name: 'Paris', country: 'France', region: 'Western Europe', type: 'Cultural',
    description: 'City of light, love, fashion and world\'s most visited museum',
    cover_photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    packages: [
      {
        name: 'Paris City Break', days: 4, tagline: 'Eiffel Tower to Louvre in 4 days', season: 'April–June',
        cities: ['Paris'],
        highlights: ['Eiffel Tower summit at night', 'Louvre Museum Mona Lisa', 'Notre-Dame Cathedral exterior', 'Montmartre artist village', 'Seine River dinner cruise'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 6225, price_per_day_usd: 75 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 14110, price_per_day_usd: 170 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 34860, price_per_day_usd: 420 }
        ]
      },
      {
        name: 'France Highlights', days: 10, tagline: 'Paris, Loire chateaux and French Riviera', season: 'May–September',
        cities: ['Paris', 'Loire Valley', 'Lyon', 'Nice', 'Monaco'],
        highlights: ['Loire Valley castle tour', 'Lyon UNESCO gastronomy capital', 'Nice beach Promenade des Anglais', 'Monaco Formula 1 circuit', 'Lavender fields Provence'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 6225, price_per_day_usd: 75 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 14110, price_per_day_usd: 170 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 34860, price_per_day_usd: 420 }
        ]
      }
    ]
  },
  // --- THAILAND ---
  {
    name: 'Thailand', country: 'Thailand', region: 'Southeast Asia', type: 'Tropical',
    description: 'Temples, islands, street food and the warmest hospitality',
    cover_photo: 'https://images.unsplash.com/photo-1528181304799-2d157861ab5d',
    packages: [
      {
        name: 'Thailand Highlights', days: 7, tagline: 'Bangkok, Chiang Mai and a beach island', season: 'November–April',
        cities: ['Bangkok', 'Chiang Mai', 'Koh Samui'],
        highlights: ['Grand Palace and Wat Phra Kaew', 'Chiang Mai Night Bazaar', 'Elephant sanctuary ethical visit', 'Koh Samui beach resort', 'Thai cooking class'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 2490, price_per_day_usd: 30 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 6640, price_per_day_usd: 80 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 18260, price_per_day_usd: 220 }
        ]
      },
      {
        name: 'Thailand Island Hopper', days: 12, tagline: 'Best Thai islands and jungle temples', season: 'November–April',
        cities: ['Bangkok', 'Chiang Mai', 'Krabi', 'Koh Phi Phi', 'Phuket', 'Koh Lanta'],
        highlights: ['Phi Phi Islands longtail boat', 'Maya Bay turquoise waters', 'Railay Beach rock climbing', 'James Bond Island Phang Nga', 'Full Moon Party Koh Phangan'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 2490, price_per_day_usd: 30 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 6640, price_per_day_usd: 80 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 18260, price_per_day_usd: 220 }
        ]
      }
    ]
  },
  // --- DUBAI, UAE ---
  {
    name: 'Dubai', country: 'UAE', region: 'Middle East', type: 'Urban',
    description: 'Desert luxury — world\'s tallest tower, man-made islands and golden dunes',
    cover_photo: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
    packages: [
      {
        name: 'Dubai City Experience', days: 4, tagline: 'Burj Khalifa to desert safari', season: 'October–April',
        cities: ['Dubai'],
        highlights: ['Burj Khalifa at the top observatory', 'Dubai Mall and fountain show', 'Palm Jumeirah monorail', 'Desert safari with dune bashing', 'Dubai Creek and gold souk'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 7470, price_per_day_usd: 90 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 18260, price_per_day_usd: 220 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 49800, price_per_day_usd: 600 }
        ]
      },
      {
        name: 'UAE Explorer', days: 7, tagline: 'Dubai and Abu Dhabi in one week', season: 'October–April',
        cities: ['Dubai', 'Abu Dhabi', 'Sharjah'],
        highlights: ['Sheikh Zayed Grand Mosque', 'Abu Dhabi Formula 1 circuit', 'Louvre Abu Dhabi', 'Sharjah cultural heritage district', 'Dubai Frame panoramic views'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 7470, price_per_day_usd: 90 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 18260, price_per_day_usd: 220 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 49800, price_per_day_usd: 600 }
        ]
      }
    ]
  },
  // --- TURKEY ---
  {
    name: 'Turkey', country: 'Turkey', region: 'Europe/Asia', type: 'Heritage',
    description: 'Where East meets West — hot air balloons, bazaars and ancient ruins',
    cover_photo: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200',
    packages: [
      {
        name: 'Turkey Highlights', days: 7, tagline: 'Istanbul and Cappadocia essentials', season: 'April–June',
        cities: ['Istanbul', 'Cappadocia', 'Goreme'],
        highlights: ['Hagia Sophia and Blue Mosque', 'Grand Bazaar Istanbul', 'Cappadocia hot air balloon sunrise', 'Goreme Open Air Museum', 'Underground city Derinkuyu'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 3735, price_per_day_usd: 45 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 9130, price_per_day_usd: 110 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 24900, price_per_day_usd: 300 }
        ]
      },
      {
        name: 'Turkey Grand Tour', days: 12, tagline: 'Istanbul to Aegean coast and Pamukkale', season: 'April–October',
        cities: ['Istanbul', 'Cappadocia', 'Pamukkale', 'Ephesus', 'Bodrum'],
        highlights: ['Pamukkale white travertine pools', 'Ephesus ancient Roman city', 'Bodrum Castle and marina', 'Aegean coast boat trip', 'Topkapi Palace treasures'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 3735, price_per_day_usd: 45 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 9130, price_per_day_usd: 110 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 24900, price_per_day_usd: 300 }
        ]
      }
    ]
  },
  // --- GREECE ---
  {
    name: 'Greece', country: 'Greece', region: 'Southern Europe', type: 'Heritage',
    description: 'Whitewashed villages, ancient ruins and crystal Aegean waters',
    cover_photo: 'https://images.unsplash.com/photo-1533105079780-92b9be482077',
    packages: [
      {
        name: 'Greece Islands Classic', days: 7, tagline: 'Athens, Santorini and Mykonos', season: 'May–October',
        cities: ['Athens', 'Santorini', 'Mykonos'],
        highlights: ['Acropolis and Parthenon Athens', 'Santorini Oia sunset caldera view', 'Mykonos windmills and Little Venice', 'Athens Plaka neighbourhood tavernas', 'Aegean catamaran sailing trip'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 4980, price_per_day_usd: 60 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 12450, price_per_day_usd: 150 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 31540, price_per_day_usd: 380 }
        ]
      },
      {
        name: 'Greece Odyssey', days: 12, tagline: 'Mainland ruins to island paradise', season: 'May–September',
        cities: ['Athens', 'Delphi', 'Meteora', 'Thessaloniki', 'Santorini', 'Crete'],
        highlights: ['Meteora monastery rock pillars', 'Delphi ancient Oracle site', 'Crete Samaria Gorge hike', 'Minoan Palace of Knossos', 'Thessaloniki Byzantine walls'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 4980, price_per_day_usd: 60 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 12450, price_per_day_usd: 150 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 31540, price_per_day_usd: 380 }
        ]
      }
    ]
  },
  // --- UK ---
  {
    name: 'London', country: 'UK', region: 'Western Europe', type: 'Urban',
    description: 'Royal palaces, world museums, the Thames and the home of the Premier League',
    cover_photo: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
    packages: [
      {
        name: 'London City Break', days: 4, tagline: 'Big Ben to Buckingham Palace', season: 'May–September',
        cities: ['London'],
        highlights: ['Tower of London Crown Jewels', 'Buckingham Palace changing of guards', 'British Museum free entry', 'Borough Market street food', 'Thames sunset dinner cruise'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 7055, price_per_day_usd: 85 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 16600, price_per_day_usd: 200 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 41500, price_per_day_usd: 500 }
        ]
      },
      {
        name: 'UK Grand Tour', days: 12, tagline: 'London to Edinburgh via the Cotswolds', season: 'May–August',
        cities: ['London', 'Oxford', 'Cotswolds', 'Bath', 'York', 'Edinburgh'],
        highlights: ['Oxford University punting', 'Cotswolds honey-stone villages', 'Roman Baths in Bath', 'York Viking history and Shambles', 'Edinburgh Castle and Royal Mile', 'Scottish Highlands day trip'],
        tiers: [
          { ...TIER_TEMPLATES.Backpacker, price_per_day_inr: 7055, price_per_day_usd: 85 },
          { ...TIER_TEMPLATES.Standard, price_per_day_inr: 16600, price_per_day_usd: 200 },
          { ...TIER_TEMPLATES.Premium, price_per_day_inr: 41500, price_per_day_usd: 500 }
        ]
      }
    ]
  }
];

async function main() {
  console.log('Clearing existing data...');
  // Delete in reverse order of relations
  await prisma.budgetTier.deleteMany({});
  await prisma.travelPackage.deleteMany({});
  await prisma.destination.deleteMany({});

  console.log('Seeding data...');
  for (const data of SEED_DATA) {
    await createDestination(data);
  }

  console.log(`Seeded ${SEED_DATA.length} destinations successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
