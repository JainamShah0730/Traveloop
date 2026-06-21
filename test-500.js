const app = require('./src/app');
const request = require('supertest');
const prisma = require('./src/db');
const jwt = require('jsonwebtoken');

jest = { mock: () => {} }; // Dummy mock since we're not running jest

async function testAPI() {
  const trip = await prisma.trip.findFirst();
  if (!trip) {
    console.log("No trip found");
    process.exit(0);
  }

  // Generate a valid token
  const token = jwt.sign({ id: trip.user_id, email: "test@test.com" }, process.env.JWT_SECRET || 'secret123');

  const res = await request(app)
    .get(`/api/trips/${trip.id}`)
    .set('Authorization', `Bearer ${token}`);
    
  console.log("Status:", res.status);
  console.log("Body:", res.body);
  if (res.error) console.log("Error text:", res.error.text);
  
  process.exit(0);
}

testAPI();
