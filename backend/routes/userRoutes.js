const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateAddress } = require('../controllers/userController');

// CHANGE THIS LINE: Use verifyToken instead of protect
const { verifyToken } = require('../middleware/authMiddleware');

// UPDATE THE ROUTES:
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/address', verifyToken, updateAddress);

module.exports = router;