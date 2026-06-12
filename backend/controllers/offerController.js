const mongoose = require("mongoose");
const Offer = require("../models/Offer");
const Product = require("../models/Product");

const offerPopulate = [
  { path: "farmerId", select: "name" },
  { path: "applicableProducts", select: "name category price image unit" },
  { path: "comboItems", select: "name category price image unit" },
];

const normalizeProductIds = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => mongoose.Types.ObjectId.isValid(id)).map(String))];
};

const assertFarmerOwnsProducts = async (productIds, farmerId) => {
  if (!productIds.length) return;

  const count = await Product.countDocuments({
    _id: { $in: productIds },
    farmerId,
  });

  if (count !== productIds.length) {
    throw new Error("Offers can only include your own products");
  }
};

const buildOfferPayload = async (body, farmerId) => {
  const applicableProducts = normalizeProductIds(body.applicableProducts);
  const comboItems = normalizeProductIds(body.comboItems);
  const validUntil = new Date(body.validUntil);

  if (!body.title?.trim()) {
    throw new Error("Offer title is required");
  }

  if (!body.description?.trim()) {
    throw new Error("Offer description is required");
  }

  if (!body.type) {
    throw new Error("Offer type is required");
  }

  if (!body.discount || Number(body.discount) <= 0) {
    throw new Error("Discount must be greater than 0");
  }

  if (Number.isNaN(validUntil.getTime())) {
    throw new Error("Valid until date is invalid");
  }

  await assertFarmerOwnsProducts(applicableProducts, farmerId);
  await assertFarmerOwnsProducts(comboItems, farmerId);

  return {
    type: body.type,
    title: body.title?.trim(),
    description: body.description?.trim(),
    discount: Number(body.discount),
    discountType: body.discountType || "percentage",
    validUntil,
    applicableProducts,
    minQuantity: body.minQuantity ? Number(body.minQuantity) : 1,
    unit: body.unit || "kg",
    comboItems,
    originalPrice: body.originalPrice ? Number(body.originalPrice) : 0,
    comboPrice: body.comboPrice ? Number(body.comboPrice) : 0,
    priority: body.priority || "medium",
    status: body.status || "active",
  };
};

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find({
      status: "active",
      validUntil: { $gte: new Date() },
    })
      .populate(offerPopulate)
      .sort({ priority: 1, createdAt: -1 });

    res.json(offers);
  } catch (error) {
    console.error("Get all offers error:", error);
    res.status(500).json({ message: "Failed to fetch offers" });
  }
};

exports.getMyOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ farmerId: req.user.id })
      .populate(offerPopulate)
      .sort({ createdAt: -1 });

    res.json(offers);
  } catch (error) {
    console.error("Get my offers error:", error);
    res.status(500).json({ message: "Failed to fetch your offers" });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const payload = await buildOfferPayload(req.body, req.user.id);
    const offer = await Offer.create({
      ...payload,
      farmerId: req.user.id,
    });

    const populatedOffer = await Offer.findById(offer._id).populate(offerPopulate);
    res.status(201).json({ message: "Offer created successfully", offer: populatedOffer });
  } catch (error) {
    console.error("Create offer error:", error);
    const message =
      error.name === "ValidationError" ? error.message : error.message || "Failed to create offer";
    res.status(400).json({ message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({ _id: req.params.offerId, farmerId: req.user.id });
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    const payload = await buildOfferPayload(req.body, req.user.id);
    Object.assign(offer, payload);
    await offer.save();

    const populatedOffer = await Offer.findById(offer._id).populate(offerPopulate);
    res.json({ message: "Offer updated successfully", offer: populatedOffer });
  } catch (error) {
    console.error("Update offer error:", error);
    const message =
      error.name === "ValidationError" ? error.message : error.message || "Failed to update offer";
    res.status(400).json({ message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findOneAndDelete({ _id: req.params.offerId, farmerId: req.user.id });
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Delete offer error:", error);
    res.status(500).json({ message: "Failed to delete offer" });
  }
};

exports.toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findOne({ _id: req.params.offerId, farmerId: req.user.id });
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    offer.status = offer.status === "active" ? "inactive" : "active";
    await offer.save();

    const populatedOffer = await Offer.findById(offer._id).populate(offerPopulate);
    res.json({ message: "Offer status updated successfully", offer: populatedOffer });
  } catch (error) {
    console.error("Toggle offer error:", error);
    res.status(500).json({ message: "Failed to update offer status" });
  }
};
