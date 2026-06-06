const jwt = require("jsonwebtoken");

/**
 * JWT verification middleware.
 * Reads Bearer token from Authorization header, verifies with JWT_SECRET,
 * and attaches decoded user payload to req.user.
 */
const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

module.exports = auth;
