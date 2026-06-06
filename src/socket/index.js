const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("../db");

/**
 * Initialise Socket.io on the existing HTTP server.
 * @param {import("http").Server} httpServer
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // ── 1. Auth on connection ──────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, email, role }
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.user.email}`);

    // ── 2. Join trip room ──────────────────────────────────
    socket.on("join_trip", async ({ tripId }) => {
      try {
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          include: { collaborators: true },
        });

        if (!trip) return socket.emit("error", "Trip not found");

        const isOwner = trip.user_id === socket.user.id;
        const isCollab = trip.collaborators.some((c) => c.user_id === socket.user.id);

        if (!isOwner && !isCollab) {
          return socket.emit("error", "forbidden");
        }

        const room = `trip:${tripId}`;
        socket.join(room);
        socket.emit("room_joined", { tripId });

        // Fetch user details for presence broadcast
        const user = await prisma.user.findUnique({
          where: { id: socket.user.id },
          select: { id: true, name: true, avatar_url: true },
        });

        // 4. Presence: broadcast user_joined to others
        socket.to(room).emit("user_joined", {
          userId: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
        });

        // Store tripId on socket for disconnect handling
        socket.tripRoom = room;
        socket.userData = user;
      } catch (err) {
        console.error("join_trip error:", err);
        socket.emit("error", "Failed to join trip room");
      }
    });

    // ── 3. Broadcast events ────────────────────────────────

    socket.on("stop_added", async ({ tripId, stop }) => {
      try {
        const created = await prisma.stop.create({ data: stop });
        socket.to(`trip:${tripId}`).emit("stop_added", created);
      } catch (err) {
        console.error("stop_added error:", err);
        socket.emit("error", "Failed to add stop");
      }
    });

    socket.on("stop_deleted", async ({ tripId, stopId }) => {
      try {
        await prisma.stop.delete({ where: { id: stopId } });
        socket.to(`trip:${tripId}`).emit("stop_deleted", { stopId });
      } catch (err) {
        console.error("stop_deleted error:", err);
        socket.emit("error", "Failed to delete stop");
      }
    });

    socket.on("activity_added", async ({ tripId, stopId, activity }) => {
      try {
        const created = await prisma.activity.create({
          data: { ...activity, stop_id: stopId },
        });
        socket.to(`trip:${tripId}`).emit("activity_added", created);
      } catch (err) {
        console.error("activity_added error:", err);
        socket.emit("error", "Failed to add activity");
      }
    });

    socket.on("activity_deleted", async ({ tripId, activityId }) => {
      try {
        await prisma.activity.delete({ where: { id: activityId } });
        socket.to(`trip:${tripId}`).emit("activity_deleted", { activityId });
      } catch (err) {
        console.error("activity_deleted error:", err);
        socket.emit("error", "Failed to delete activity");
      }
    });

    socket.on("stop_reordered", async ({ tripId, orderedIds }) => {
      try {
        const updates = orderedIds.map((id, index) =>
          prisma.stop.update({ where: { id }, data: { order_index: index } })
        );
        await prisma.$transaction(updates);
        socket.to(`trip:${tripId}`).emit("stop_reordered", { orderedIds });
      } catch (err) {
        console.error("stop_reordered error:", err);
        socket.emit("error", "Failed to reorder stops");
      }
    });

    // ── 5. Disconnect ──────────────────────────────────────
    socket.on("disconnect", () => {
      if (socket.tripRoom && socket.userData) {
        socket.to(socket.tripRoom).emit("user_left", {
          userId: socket.userData.id,
        });
      }
      console.log(`Socket disconnected: ${socket.user.email}`);
    });
  });

  return io;
}

module.exports = initSocket;

/*
 * ── Client-side connection snippet ─────────────────────────
 *
 * import { io } from "socket.io-client";
 *
 * const socket = io("http://localhost:4000", {
 *   auth: { token: "<JWT_TOKEN>" },
 * });
 *
 * socket.emit("join_trip", { tripId: "<TRIP_ID>" });
 *
 * socket.on("room_joined", ({ tripId }) => {
 *   console.log("Joined trip room:", tripId);
 * });
 *
 * socket.on("user_joined",  (data) => console.log("User joined:", data));
 * socket.on("user_left",    (data) => console.log("User left:", data));
 * socket.on("stop_added",   (stop) => console.log("Stop added:", stop));
 * socket.on("stop_deleted",  (d)   => console.log("Stop deleted:", d));
 * socket.on("activity_added",   (a) => console.log("Activity added:", a));
 * socket.on("activity_deleted",  (d) => console.log("Activity deleted:", d));
 * socket.on("stop_reordered",    (d) => console.log("Stops reordered:", d));
 * socket.on("error",             (e) => console.error("Socket error:", e));
 */
