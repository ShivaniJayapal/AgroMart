const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  getUserReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/product/:productId/order/:orderId', verifyToken, createReview);
router.get('/my-reviews', verifyToken, getUserReviews);
router.put('/:reviewId', verifyToken, updateReview);
router.delete('/:reviewId', verifyToken, deleteReview);

module.exports = router;
