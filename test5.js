const http = require('http');

const data = JSON.stringify({
  title: "Test",
  type: "ideas",
  content: "Checking API",
  has_reminder: true,
  reminder_time: "2026-06-06T16:41:00Z"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/notes/cmq22ji1f0001vhj85gh9b997', // from previous test2.js
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
    // We don't have a token, so we can't test authenticated routes easily.
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
