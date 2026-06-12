const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    category: {
      type: String,
      required: true,
      enum: ["Vegetables", "Fruits", "Grains", "Dairy"],
    },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);