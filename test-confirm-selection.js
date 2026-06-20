const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // 1. Find a real itinerary
  const itinerary = await prisma.aiItinerary.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!itinerary) {
    console.log('No itineraries found. Cannot test.');
    return;
  }

  console.log('Found itinerary:', itinerary.id);
  console.log('User:', itinerary.userId);
  console.log('Has days?', !!itinerary.data?.days);
  console.log('Day count:', itinerary.data?.days?.length || 0);
  
  if (itinerary.data?.days?.[0]?.hotel) {
    console.log('Current hotel (day 1):', itinerary.data.days[0].hotel.name);
  }

  // 2. Test the utility function
  const { updateItineraryWithSelections } = require('./src/utils/itineraryUtils');
  
  const mockFlight = {
    id: 'test-flight',
    airline: 'Vistara',
    flightNo: 'UK-123',
    price: 9000,
    pricePerPerson: 4500,
    depart: '06:20',
    arrive: '07:55',
    duration: '1h 35m'
  };

  const mockHotel = {
    id: 'test-hotel',
    name: 'Hotel Snow Crest',
    pricePerNight: 1500,
    totalCost: 7500,
    rating: 4,
    amenities: ['wifi', 'breakfast']
  };

  const updatedData = updateItineraryWithSelections(itinerary.data, mockFlight, mockHotel);
  
  console.log('\n--- After update ---');
  if (updatedData.days?.[0]?.hotel) {
    console.log('Updated hotel (day 1):', updatedData.days[0].hotel.name);
  }
  console.log('Flights cost:', updatedData.cost_breakdown_per_person?.flights);
  console.log('Accommodation cost:', updatedData.cost_breakdown_per_person?.accommodation);
  console.log('Budget used:', updatedData.budget_used_per_person);

  // 3. Now test the actual API endpoint via HTTP
  // First, we need a valid auth token — let's get the user
  const user = await prisma.user.findUnique({ where: { id: itinerary.userId } });
  console.log('\nUser for auth:', user?.email);
  
  // Generate a JWT token for this user
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'traveloop-secret');
  
  console.log('\n--- Testing API endpoint ---');
  
  try {
    const res = await fetch(`http://localhost:3000/api/copilot/${itinerary.id}/confirm-selection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        selectedFlight: mockFlight,
        selectedHotel: mockHotel
      })
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response success:', data.success);
    
    if (data.error) {
      console.log('ERROR:', data.error);
    }
    
    if (data.updatedData?.days?.[0]?.hotel) {
      console.log('API returned hotel (day 1):', data.updatedData.days[0].hotel.name);
    }
    
    // Verify it's persisted in DB
    const reloaded = await prisma.aiItinerary.findUnique({ where: { id: itinerary.id } });
    console.log('\n--- DB Verification ---');
    console.log('selectedFlight saved:', !!reloaded.selectedFlight);
    console.log('selectedHotel saved:', !!reloaded.selectedHotel);
    console.log('Hotel in DB (day 1):', reloaded.data?.days?.[0]?.hotel?.name);
    console.log('\nALL TESTS PASSED:', 
      reloaded.data?.days?.[0]?.hotel?.name === 'Hotel Snow Crest' && 
      !!reloaded.selectedFlight && 
      !!reloaded.selectedHotel
    );
  } catch (err) {
    console.error('API call failed:', err.message);
  }
}

test().finally(() => prisma.$disconnect());
