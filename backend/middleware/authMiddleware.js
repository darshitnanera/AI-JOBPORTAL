import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // The token is signed with `{ id: user._id, ... }`, but jobMatch and
    // message controllers read `req.user._id`. That was silently undefined,
    // so every `findById` in them returned null and AI job matching and
    // messaging failed for every request. Expose both spellings so either
    // convention resolves to the same user.
    const userId = decoded.id || decoded._id || decoded.userId;
    req.user = { ...decoded, id: userId, _id: userId };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission",
      });
    }
    next();
  };
};

// Alias for backward compatibility
export const verifyToken = authMiddleware;
export const authenticateToken = authMiddleware;

