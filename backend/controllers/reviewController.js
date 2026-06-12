const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
      : 0;
    
    // Get rating distribution
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingCounts[review.rating]++;
    });
    
    res.json({
      reviews,
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      ratingCounts
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { productId, orderId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const order = await Order.findOne({ _id: orderId, userId }).lean();
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Only paid orders can be reviewed" });
    }

    if (["cancelled", "payment_failed"].includes(order.status)) {
      return res.status(400).json({ message: "This order is not eligible for review" });
    }

    const productExistsInOrder = order.items.some(
      (item) => item.productId?.toString() === productId
    );

    if (!productExistsInOrder) {
      return res.status(400).json({ message: "This product is not part of the order" });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
      order: orderId
    });
    
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    // Create review
    const review = new Review({
      user: userId,
      product: productId,
      order: orderId,
      rating: Number(rating),
      comment: comment.trim()
    });

    await review.save();
    
    // Populate user info for response
    await review.populate('user', 'name');
    
    // Update product's average rating
    await updateProductRating(productId);
    
    res.status(201).json({
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ message: "Failed to submit review" });
  }
};

// Get reviews for user's orders
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const reviews = await Review.find({ user: userId })
      .populate('product', 'name image')
      .populate('order', 'createdAt')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.status(500).json({ message: "Failed to fetch your reviews" });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = await Review.findOne({ _id: reviewId, user: userId });
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update fields
    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment.trim();

    await review.save();
    await review.populate('user', 'name');
    
    // Update product's average rating
    await updateProductRating(review.product);
    
    res.json({
      message: "Review updated successfully",
      review
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ message: "Failed to update review" });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, user: userId });
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);
    
    // Update product's average rating
    await updateProductRating(productId);
    
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
};

// Helper function to update product's average rating
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ product: productId });
    const averageRating = reviews.length > 0 
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
      : 0;
    
    await Product.findByIdAndUpdate(productId, {
      averageRating: Number(averageRating.toFixed(1)),
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error("Update product rating error:", error);
  }
}
