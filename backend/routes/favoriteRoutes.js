const router = require("express").Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  addToFavorites,
  removeFromFavorites,
  getMyFavorites,
} = require("../controllers/favoriteController");

router.post("/add", verifyToken, addToFavorites);
router.delete("/remove", verifyToken, removeFromFavorites);
router.get("/my", verifyToken, getMyFavorites);

module.exports = router;