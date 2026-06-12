const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");

// ADD PRODUCT
exports.addProduct = async (req, res) => {
  try {
    
    const { name, price, quantity, unit, description, category } = req.body;

    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);

    if (!name || !price || !quantity || !unit || !category) {
      return res.status(400).json({
        message: "Missing required fields: Name, Price, Quantity, Unit, and Category are required",
      });
    }

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0 || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        message: "Price and quantity must be valid numbers greater than 0",
      });
    }

    const image = req.file ? req.file.filename : null;

    // Create the product in MongoDB
    const product = await Product.create({
      name,
      price: parsedPrice,
      quantity: parsedQuantity,
      unit, // Now correctly saved to DB
      description,
      category,
      image,
      farmerId: req.user.id, // ID extracted from Auth Middleware token
    });

    res.status(201).json({
      message: "Product added successfully to AgroMart",
      product,
    });
  } catch (error) {
    console.error("Add Product Error:", error);
    // If it's a Mongoose validation error, send the specific message
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Add product failed on server" });
  }
};

// GET MY PRODUCTS (For Farmer Inventory)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ farmerId: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// GET ALL PRODUCTS (For Customer Marketplace)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching marketplace products" });
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity, unit, description, category } = req.body;

    let product = await Product.findOne({ _id: id, farmerId: req.user.id });

    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    // Update fields only if they are provided in the request
    if (name !== undefined) product.name = name;
    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: "Price must be a valid number greater than 0" });
      }
      product.price = parsedPrice;
    }
    if (quantity !== undefined) {
      const parsedQuantity = Number(quantity);
      if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ message: "Quantity must be a valid number greater than 0" });
      }
      product.quantity = parsedQuantity;
    }
    if (unit !== undefined) product.unit = unit; // Added unit update
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;

    // Handle new image upload and delete old file
    if (req.file) {
      if (product.image) {
        const oldImagePath = path.join(__dirname, "../uploads", product.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      product.image = req.file.filename;
    }

    await product.save();
    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Update failed" });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, farmerId: req.user.id });

    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    if (product.image) {
      const imagePath = path.join(__dirname, "../uploads", product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Delete failed" });
  }
};