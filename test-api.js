const http = require('http');

async function testApi() {
  try {
    const payload = {
      title: 'Bangkok Thailand Intro',
      destination: 'Bangkok',
      coverImageUrl: 'some_url',
      startDate: '2026-06-19',
      endDate: '2026-06-26T00:00:00.000Z',
      status: 'upcoming',
      stops: [
        {
          city_name: 'Bangkok',
          country: 'Thailand',
          from_date: '2026-06-19',
          to_date: '2026-06-26T00:00:00.000Z',
          order_index: 0,
          activities: [
            {
              name: 'Breakfast',
              type: 'food',
              cost: 100,
              duration_mins: 60,
              notes: 'Day 1 breakfast'
            }
          ]
        }
      ],
      totalBudgetINR: 50000
    };

    const res = await fetch('http://localhost:3000/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Mock authorization token from db user? 
        // Wait, I can't easily mock auth without a valid token.
      },
      body: JSON.stringify(payload)
    });
    console.log(res.status);
    console.log(await res.text());
  } catch(e) {
    console.error(e);
  }
}
testApi();
