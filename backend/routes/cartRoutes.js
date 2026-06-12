const router = require("express").Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  addToCart,
  getMyCart,
  updateCart,
  removeCart,
} = require("../controllers/cartController");

router.post("/add", verifyToken, addToCart);
router.get("/my", verifyToken, getMyCart);
router.put("/update/:id", verifyToken, updateCart);
router.delete("/remove/:id", verifyToken, removeCart);

module.exports = router;