const Cart = require("../models/Cart");

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ msg: "ProductId is required" });
    }

    const product = await require("../models/Product").findById(productId);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const requestedQty = Number(quantity);
    if (!requestedQty || requestedQty < 1) {
      return res.status(400).json({ msg: "Quantity must be at least 1" });
    }

    const availableQty = Number(product.quantity);
    if (requestedQty > availableQty) {
      return res.status(400).json({ msg: `Only ${availableQty} in stock` });
    }

    let cartItem = await Cart.findOne({ userId, productId });

    if (cartItem) {
      const newQty = cartItem.quantity + requestedQty;
      if (newQty > availableQty) {
        return res.status(400).json({ msg: `Cannot add more than ${availableQty} items` });
      }
      cartItem.quantity = newQty;
    } else {
      cartItem = new Cart({ userId, productId, quantity: requestedQty });
    }

    await cartItem.save();
    res.json({ msg: "Added to cart", cartItem });
  } catch (err) {
    console.error("Cart add error:", err);
    res.status(500).json({ msg: "Error" });
  }
};



exports.getMyCart = async (req, res) => {

  try {

    const items = await Cart.find({
      userId: req.user.id,
    }).populate("productId");

    res.json(items);

  } catch (err) {

    res.status(500).json({ msg: "Error" });

  }

};



exports.updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;
    const cartId = req.params.id;

    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({ msg: "Quantity must be at least 1" });
    }

    const cartItem = await Cart.findOne({ _id: cartId, userId }).populate("productId");
    if (!cartItem) {
      return res.status(404).json({ msg: "Cart item not found" });
    }

    const availableQty = Number(cartItem.productId.quantity);
    if (Number(quantity) > availableQty) {
      return res.status(400).json({ msg: `Only ${availableQty} units available` });
    }

    cartItem.quantity = Number(quantity);
    await cartItem.save();

    res.json({ msg: "Cart updated", cartItem });
  } catch (err) {
    console.error("Cart update error:", err);
    res.status(500).json({ msg: "Error" });
  }
};

exports.removeCart = async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.json({ msg: "Removed" });
  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
};