const prisma = require('./src/db');

function mapActivityDTO(act) {
  return {
    name: act.name,
    description: act.notes,
    time: act.duration_mins,
    location: act.type
  };
}

function mapStopDTO(stop) {
  return {
    city_name: stop.city_name,
    country: stop.country,
    lat: stop.lat,
    lng: stop.lng,
    from_date: stop.from_date,
    to_date: stop.to_date,
    activities: stop.activities ? stop.activities.map(mapActivityDTO) : []
  };
}

function mapTripDTO(trip) {
  return {
    name: trip.name,
    cover_photo: trip.cover_photo,
    start_date: trip.start_date,
    end_date: trip.end_date,
    total_budget: trip.total_budget,
    stops: trip.stops ? trip.stops.map(mapStopDTO) : []
  };
}

async function test() {
  const trip = await prisma.trip.findFirst({
    select: {
      id: true, name: true, cover_photo: true, start_date: true, end_date: true, total_budget: true, is_public: true, slug: true,
      stops: { 
        orderBy: { order_index: "asc" }, 
        select: { 
          id: true, city_name: true, country: true, lat: true, lng: true, from_date: true, to_date: true, order_index: true,
          activities: { 
            orderBy: { created_at: "asc" },
            select: { id: true, name: true, type: true, cost: true, duration_mins: true, notes: true, is_paid: true }
          } 
        } 
      }
    }
  });
  
  if (trip) {
    console.log(JSON.stringify(mapTripDTO(trip), null, 2));
  } else {
    console.log("No trips in DB.");
  }
  process.exit(0);
}
test();
