const express = require("express");
const router = express.Router();

// 1. IMPORT THE ENTIRE CONTROLLER OBJECT
// This fixes the "productController is not defined" error
const productController = require("../controllers/productController");

// 2. IMPORT MIDDLEWARES
const { verifyToken, isFarmer } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// --- ROUTES ---

// ADD PRODUCT
router.post(
  "/add",
  verifyToken,
  isFarmer,
  upload.single("image"),
  productController.addProduct
);

// GET MY PRODUCTS (For Farmer Dashboard)
router.get(
  "/my",
  verifyToken,
  isFarmer,
  productController.getMyProducts
);

// GET ALL PRODUCTS (For Customer Marketplace)
router.get(
  "/all",
  productController.getAllProducts
);

// UPDATE PRODUCT
router.put(
  "/update/:id",
  verifyToken,
  isFarmer,
  upload.single("image"),
  productController.updateProduct
);

// DELETE PRODUCT (Using the /delete/:id path)
router.delete(
  "/delete/:id",
  verifyToken,
  isFarmer,
  productController.deleteProduct
);

module.exports = router;