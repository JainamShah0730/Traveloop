const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const tripData = {
    user_id: 'cmozb85kw0000vhw0dtgpnd6q', // user ID from the previous run_command!
    name: 'Bangkok Thailand Intro 7 Days',
    start_date: new Date(),
    end_date: new Date(),
    slug: 'bangkok-test-' + Date.now(),
    stops: {
      create: [
        {
          city_name: 'Bangkok',
          country: 'Thailand',
          lat: 13.75,
          lng: 100.5,
          from_date: new Date(),
          to_date: new Date(),
          order_index: 0,
          activities: {
            create: [
              {
                name: 'Breakfast',
                type: 'food',
                cost: 500,
                duration_mins: 60,
                notes: 'Day 1 breakfast'
              }
            ]
          }
        }
      ]
    }
  };
  try {
    const res = await prisma.trip.create({ data: tripData });
    console.log(res);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
