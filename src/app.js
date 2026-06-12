/*
 * Traveloop — Express Application
 *
 * Folder structure:
 * ├── prisma/
 * │   └── schema.prisma
 * ├── src/
 * │   ├── middleware/
 * │   │   └── auth.js
 * │   ├── routes/
 * │   │   ├── auth.js
 * │   │   ├── trips.js
 * │   │   ├── stops.js
 * │   │   ├── activities.js
 * │   │   ├── ai.js
 * │   │   └── sharing.js
 * │   ├── services/
 * │   │   ├── gemini.js
 * │   │   └── externalApis.js
 * │   ├── socket/
 * │   │   └── index.js
 * │   ├── app.js
 * │   └── server.js
 * ├── .env.example
 * └── package.json
 */

const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth");
const tripsRouter = require("./routes/trips");
const stopsRouter = require("./routes/stops");
const activitiesRouter = require("./routes/activities");
const aiRouter = require("./routes/ai");
const sharingRouter = require("./routes/sharing");
const packingRouter = require("./routes/packing");
const notesRouter = require("./routes/notes");
const adminRouter = require("./routes/admin");
const dashboardRouter = require("./routes/dashboard");
const packagesRouter = require("./routes/packages");
const alertsRouter = require("./routes/alerts");
const flightsRouter = require("./routes/flights");
const destinationsRouter = require("./routes/destinations");
const copilotRouter = require("./routes/copilot");
const pollsRouter = require("./routes/polls");
const expensesRouter = require("./routes/expenses");
const journalsRouter = require("./routes/journals");

const app = express();

// ── Middleware ─────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
                        /^http:\/\/localhost(:\d+)?$/.test(origin) || 
                        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
                        origin.endsWith('.vercel.app');
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));

// ── Routes ────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/stops", stopsRouter);          // nested: /api/stops/:stopId/activities handled here too
app.use("/api/activities", activitiesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/packing", packingRouter);
app.use("/api/notes", notesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api", packagesRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/flights", flightsRouter);
app.use("/api/destinations", destinationsRouter);
app.use("/api/trips", sharingRouter);        // invite / collaborators / visibility / share-link
app.use("/api/copilot", copilotRouter);
app.use("/api/polls", pollsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/journals", journalsRouter);

app.use("/trips/public", (req, res, next) => {
  // Public routes are already defined in tripsRouter as /public/:slug
  // Forward to tripsRouter with adjusted path
  next();
});

// ── Health check ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "Traveloop API" });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
