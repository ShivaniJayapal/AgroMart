const express = require("express");
const router = express.Router();

const { verifyToken, isFarmer, isCustomer } = require("../middleware/authMiddleware");

// Farmer-only route
router.get("/farmer", verifyToken, isFarmer, (req, res) => {
  res.json({
    message: "Farmer access granted",
    user: req.user
  });
});

// Customer-only route
router.get("/customer", verifyToken, isCustomer, (req, res) => {
  res.json({
    message: "Customer access granted",
    user: req.user
  });
});

module.exports = router;
