const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = require("../db");

// ── Helper: sign JWT ──────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ── Helper: strip password_hash from user object ──────────────
function sanitiseUser(user) {
  const { password_hash, created_at, updated_at, provider, ...safe } = user;
  return safe;
}

// ── POST /auth/register ───────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already exists." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password_hash },
    });

    const token = signToken(user);

    return res.status(201).json({ token, user: sanitiseUser(user) });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /auth/login ─────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = signToken(user);

    return res.status(200).json({ token, user: sanitiseUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── GET /auth/me ──────────────────────────────────────────────
router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ user: sanitiseUser(user) });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /auth/google ────────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: "access_token is required." });
    }

    // Verify token with Google
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!response.ok) {
      return res.status(401).json({ error: "Invalid Google token." });
    }

    const googleUser = await response.json();

    if (!googleUser.email) {
      return res.status(401).json({ error: "Could not retrieve email from Google." });
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: googleUser.email },
      update: {
        name: googleUser.name || googleUser.email,
        avatar_url: googleUser.picture || null,
        provider: "google",
      },
      create: {
        name: googleUser.name || googleUser.email,
        email: googleUser.email,
        avatar_url: googleUser.picture || null,
        provider: "google",
        role: "user",
      },
    });

    const token = signToken(user);

    return res.status(200).json({ token, user: sanitiseUser(user) });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── PUT /auth/avatar ─────────────────────────────────────────
router.put("/avatar", auth, async (req, res) => {
  try {
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res.status(400).json({ error: "avatar_url is required." });
    }

    // Limit size: base64 images can be large — cap at ~2MB
    if (avatar_url.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large. Max 2MB." });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar_url }
    });

    return res.status(200).json({ user: sanitiseUser(user) });
  } catch (err) {
    console.error("Avatar update error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── PUT /auth/profile ────────────────────────────────────────
router.put("/profile", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const data = {};
    if (name) data.name = name;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data
    });

    return res.status(200).json({ user: sanitiseUser(user) });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
