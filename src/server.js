require("dotenv").config();
const http = require("http");
const app = require("./app");
const initSocket = require("./socket/index");
require("./services/alertCron");
const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);

// Attach Socket.io
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Traveloop server running on port ${PORT}`);
});
