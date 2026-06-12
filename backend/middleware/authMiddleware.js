const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  try {
    // Token format: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    next(); // allow request
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


exports.isFarmer = (req, res, next) => {
  if (req.user.role !== "farmer") {
    return res.status(403).json({
      message: "Access denied: Farmers only"
    });
  }
  next();
};

exports.isCustomer = (req, res, next) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({
      message: "Access denied: Customers only"
    });
  }
  next();
};
