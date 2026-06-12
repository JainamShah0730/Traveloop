const p = require('./src/db');
p.destination.findFirst().then(d => {
  if (!d) return console.log('No destinations found');
  console.log('Testing dest:', d.id);
  const f = require('node-fetch')||fetch;
  return f(`http://localhost:3000/api/destinations/${d.id}/packages`).then(r=>r.json()).then(res => {
    console.log('Response:', res.destination?.name, res.packages?.length);
  });
}).catch(console.error).finally(()=>p.$disconnect());
