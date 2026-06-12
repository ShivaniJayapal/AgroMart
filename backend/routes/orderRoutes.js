const router = require('express').Router();
const { verifyToken, isFarmer } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment, getMyOrders, getReceivedOrders, updateOrderStatus } = require('../controllers/orderController');

router.post('/create', verifyToken, createOrder);
router.post('/verify', verifyToken, verifyPayment);
router.get('/my', verifyToken, getMyOrders);
router.get('/received', verifyToken, isFarmer, getReceivedOrders);
router.put('/update-status/:id', verifyToken, isFarmer, updateOrderStatus);

module.exports = router;
