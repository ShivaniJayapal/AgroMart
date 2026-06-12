const express = require("express");
const router = express.Router();
const {
  getAllOffers,
  getMyOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
} = require("../controllers/offerController");
const { verifyToken, isFarmer } = require("../middleware/authMiddleware");

router.get("/all", getAllOffers);
router.get("/", getAllOffers);
router.get("/my", verifyToken, isFarmer, getMyOffers);
router.get("/farmer/:farmerId", verifyToken, isFarmer, getMyOffers);
router.post("/create", verifyToken, isFarmer, createOffer);
router.post("/", verifyToken, isFarmer, createOffer);
router.put("/:offerId", verifyToken, isFarmer, updateOffer);
router.delete("/:offerId", verifyToken, isFarmer, deleteOffer);
router.patch("/:offerId/toggle", verifyToken, isFarmer, toggleOfferStatus);

module.exports = router;
