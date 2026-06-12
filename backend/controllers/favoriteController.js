const Favorite = require("../models/Favorite");

exports.addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ msg: "ProductId is required" });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ userId, productId });
    if (existing) {
      return res.status(400).json({ msg: "Already in favorites" });
    }

    const favorite = new Favorite({ userId, productId });
    await favorite.save();

    res.json({ msg: "Added to favorites", favorite });
  } catch (err) {
    console.error("Favorite add error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Already in favorites" });
    }
    res.status(500).json({ msg: "Error" });
  }
};

exports.removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    await Favorite.findOneAndDelete({ userId, productId });

    res.json({ msg: "Removed from favorites" });
  } catch (err) {
    console.error("Favorite remove error:", err);
    res.status(500).json({ msg: "Error" });
  }
};

exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).populate("productId");
    res.json(favorites.map(f => f.productId).filter(p => p)); // Return only valid products
  } catch (err) {
    console.error("Favorite fetch error:", err);
    res.status(500).json({ msg: "Error" });
  }
};