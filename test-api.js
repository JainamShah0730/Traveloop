const app = require('./src/app');
const request = require('supertest');
const prisma = require('./src/db');

async function testAPI() {
  const trip = await prisma.trip.findFirst({ where: { is_public: true } });
  if (!trip) {
    console.log("No public trip found to test");
    process.exit(0);
  }

  const res = await request(app).get(`/api/trips/public/${trip.slug}`);
  console.log("API Response:", JSON.stringify(res.body, null, 2));
  process.exit(0);
}

testAPI();
