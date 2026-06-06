const http = require('http');

const payload = {
  title: "Greek Islands",
  destination: "Santorini",
  coverImageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=800&q=80",
  startDate: "2026-06-17",
  endDate: "2026-06-24T00:00:00.000Z",
  status: "upcoming",
  totalBudgetINR: 0,
  name: "Greek Islands",
  cover_photo: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=800&q=80",
  start_date: "2026-06-17",
  end_date: "2026-06-24T00:00:00.000Z",
  total_budget: 0,
  stops: [
    {
      city_name: "Athens",
      country: "Greece",
      lat: 0,
      lng: 0,
      from_date: "2026-06-17T00:00:00.000Z",
      to_date: "2026-06-20T00:00:00.000Z",
      order_index: 0,
      activities: [
        {
          name: "Acropolis",
          type: "sightseeing",
          cost: 1000,
          duration_mins: 150,
          notes: "Day 1 morning exploration | Start: 09:30"
        }
      ]
    }
  ]
};

// We need a token from localStorage. We can just run this script in the browser or use Prisma directly to bypass auth.
// Let's use Prisma directly to see if the payload works.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const tripData = {
      user_id: 'cmozb85kw0000vhw0dtgpnd6q', // valid user ID from previous query
      name: payload.name,
      cover_photo: payload.cover_photo,
      start_date: new Date(payload.start_date),
      end_date: new Date(payload.end_date),
      total_budget: payload.total_budget,
      slug: payload.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      is_public: false,
    };

    const stops = payload.stops;
    if (stops && Array.isArray(stops)) {
      tripData.stops = {
        create: stops.map((s) => ({
          city_name: s.city_name || s.city || "City", 
          country: s.country || "Country", 
          lat: s.lat || 0, 
          lng: s.lng || 0,
          from_date: new Date(s.from_date || s.fromDate || payload.start_date), 
          to_date: new Date(s.to_date || s.toDate || payload.end_date), 
          order_index: s.order_index || 0,
          activities: s.activities && Array.isArray(s.activities) ? {
            create: s.activities.map((a) => ({
              name: a.name, type: a.type || 'other', cost: a.cost || 0, duration_mins: a.duration_mins || 60, notes: a.notes || ''
            }))
          } : undefined
        }))
      };
    }

    console.log("TripData to create:", JSON.stringify(tripData, null, 2));

    const trip = await prisma.trip.create({
      data: tripData,
      include: { stops: { include: { activities: true } } }
    });
    console.log("Created successfully with stops:", trip.stops.length);
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
