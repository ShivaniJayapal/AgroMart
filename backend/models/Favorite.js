const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
}, { timestamps: true });

// Ensure a user can't favorite the same product twice
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);