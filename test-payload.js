const http = require('http');

async function doFetch() {
  const payload = {
    title: 'Bangkok Thailand Intro 7 Days',
    destination: 'Bangkok',
    coverImageUrl: 'mock-url',
    startDate: '2026-06-19',
    endDate: '2026-06-26T00:00:00.000Z',
    status: 'upcoming',
    stops: [
      {
        id: 'mock-stop-1',
        city_name: 'Bangkok',
        country: 'Thailand',
        lat: 13.75,
        lng: 100.5,
        from_date: '2026-06-19T00:00:00.000Z',
        to_date: '2026-06-26T00:00:00.000Z',
        order_index: 0,
        imageUrl: 'mock-url',
        activities: [
          {
            id: 'mock-act-1',
            name: 'Breakfast at local cafe in Bangkok',
            type: 'food',
            cost: 420,
            duration_mins: 60,
            notes: 'Day 1 breakfast | Start: 08:00'
          }
        ],
        totalBudgetINR: 420
      }
    ],
    totalBudgetINR: 49000
  };

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/trips',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtb3piODVrdzAwMDB2aHcwZHRncG5kNnEiLCJpYXQiOjE3ODA2ODA3MTB9.xfX0m6MtsTHSYDfTIzfUZkKvlMWjRFQ0TbnR13vZ_8Q'
    }
  };

  const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', d => process.stdout.write(d));
  });

  req.on('error', e => {
    console.error(`problem with request: ${e.message}`);
  });

  req.write(JSON.stringify(payload));
  req.end();
}
doFetch();
