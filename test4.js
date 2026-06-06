const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken'); // Assuming you use jsonwebtoken

async function testApi() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log("No user");
  
  const trip = await prisma.trip.findFirst({ where: { user_id: user.id }});
  if (!trip) return console.log("No trip");

  // Create a note directly in DB
  const note = await prisma.note.create({
    data: { trip_id: trip.id, title: "API Test Note", content: "Test content", has_reminder: false }
  });
  console.log("Created note id:", note.id);

  // Generate a mock token or bypass if possible
  // Wait, I can just use a raw HTTP request if I can generate a valid token.
  // Let's see the JWT secret
}

testApi();
