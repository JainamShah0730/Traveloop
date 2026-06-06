const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/destinations/goa/packages', // try to hit a public GET endpoint to check if server is running
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', e => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
