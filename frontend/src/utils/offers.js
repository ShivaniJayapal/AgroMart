import api from "../services/api";

export const OFFER_TYPES = {
  NEAR_EXPIRY: "near_expiry",
  HIGH_STOCK: "high_stock",
  BULK_PURCHASE: "bulk_purchase",
  COMBO: "combo",
};

export const PRIORITY_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const INCOMPLETE_COMBO_MESSAGE = "Add ANOTHER ITEM IN COMBO to unlock combo offer";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const toOfferProductIds = (items) =>
  Array.isArray(items)
    ? items.map((item) => (typeof item === "object" ? item._id : item)).filter(Boolean)
    : [];

export const normalizeOffer = (offer) => ({
  ...offer,
  id: offer._id || offer.id,
  farmerId:
    typeof offer.farmerId === "object"
      ? offer.farmerId?._id || offer.farmerId?.id
      : offer.farmerId,
  applicableProducts: offer.applicableProducts || [],
  comboItems: offer.comboItems || [],
});

const serializeOfferPayload = (offerData) => ({
  ...offerData,
  applicableProducts: toOfferProductIds(offerData.applicableProducts),
  comboItems: toOfferProductIds(offerData.comboItems),
});

export const fetchAllOffers = async () => {
  const response = await api.get("/offers/all");
  return (response.data || []).map(normalizeOffer);
};

export const fetchFarmerOffers = async () => {
  const response = await api.get("/offers/my", {
    headers: getAuthHeaders(),
  });
  return (response.data || []).map(normalizeOffer);
};

export const createOffer = async (offerData) => {
  const response = await api.post("/offers/create", serializeOfferPayload(offerData), {
    headers: getAuthHeaders(),
  });
  return normalizeOffer(response.data.offer);
};

export const updateOffer = async (offerId, offerData) => {
  const response = await api.put(`/offers/${offerId}`, serializeOfferPayload(offerData), {
    headers: getAuthHeaders(),
  });
  return normalizeOffer(response.data.offer);
};

export const deleteOffer = async (offerId) => {
  const response = await api.delete(`/offers/${offerId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const toggleOfferStatus = async (offerId) => {
  const response = await api.patch(
    `/offers/${offerId}/toggle`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );
  return normalizeOffer(response.data.offer);
};

export const getActiveFarmerOffers = (offers) => {
  const now = new Date();

  return offers.filter((offer) => {
    if (!offer?.farmerId) return false;
    if (offer.status !== "active") return false;
    if (!offer.validUntil) return false;
    if (offer.type === OFFER_TYPES.COMBO) return false; // Exclude combo offers

    const validUntil = new Date(offer.validUntil);
    if (Number.isNaN(validUntil.getTime())) return false;

    return validUntil >= now;
  });
};

const getOfferProductId = (item) => (typeof item === "object" ? item?._id : item);

const getOfferProductName = (item) =>
  typeof item === "object" ? String(item?.name || "").toLowerCase() : String(item || "").toLowerCase();

const getComboOfferIds = (offer) => toOfferProductIds(offer.comboItems);

const buildCartQuantityLookup = (cartItems = []) =>
  cartItems.reduce((lookup, item) => {
    const productId = getOfferProductId(item?.productId);
    const quantity = Number(item?.quantity || 0);

    if (productId && quantity > 0) {
      lookup[String(productId)] = (lookup[String(productId)] || 0) + quantity;
    }

    return lookup;
  }, {});

const getComboSetDiscount = (offer, unitPriceLookup) => {
  const comboIds = getComboOfferIds(offer);
  const originalTotal = comboIds.reduce(
    (sum, productId) => sum + (Number(unitPriceLookup[String(productId)]) || 0),
    0
  );

  if (originalTotal <= 0) return 0;

  if (Number(offer.comboPrice) > 0) {
    return Math.max(0, originalTotal - Number(offer.comboPrice));
  }

  if (offer.discountType === "fixed") {
    return Math.max(0, Number(offer.discount || 0));
  }

  return Math.max(0, (originalTotal * Number(offer.discount || 0)) / 100);
};

export const getApplicableOffers = (offers, product, quantity = 1, context = {}) => {
  const productId = typeof product === "object" ? product?._id : null;
  const productNameLower =
    typeof product === "object" ? String(product?.name || "").toLowerCase() : String(product || "").toLowerCase();
  const cartQuantities = context.cartQuantities || {};

  return getActiveFarmerOffers(offers).filter((offer) => {
    if (offer.type === OFFER_TYPES.COMBO) {
      const comboIds = getComboOfferIds(offer);
      if (!comboIds.length || !productId || !comboIds.includes(String(productId))) {
        return false;
      }

      const hasCompleteCombo = comboIds.every((comboId) => Number(cartQuantities[String(comboId)] || 0) > 0);
      return hasCompleteCombo;
    }

    if (offer.applicableProducts && offer.applicableProducts.length > 0) {
      const isApplicable = offer.applicableProducts.some((item) => {
        const offerProductId = getOfferProductId(item);
        const offerProductName = getOfferProductName(item);

        if (productId && offerProductId && String(offerProductId) === String(productId)) {
          return true;
        }

        return (
          productNameLower.includes(offerProductName) ||
          offerProductName.includes(productNameLower)
        );
      });

      if (!isApplicable) return false;
    }

    if (offer.type === OFFER_TYPES.BULK_PURCHASE && offer.minQuantity) {
      return quantity >= Number(offer.minQuantity);
    }

    return true;
  });
};

export const getProductRelatedOffers = (offers, product) => {
  const productId = typeof product === "object" ? String(product?._id || "") : "";
  const productNameLower =
    typeof product === "object" ? String(product?.name || "").toLowerCase() : String(product || "").toLowerCase();

  return getActiveFarmerOffers(offers).filter((offer) => {
    if (offer.type === OFFER_TYPES.COMBO) {
      return getComboOfferIds(offer).includes(productId);
    }

    if (offer.applicableProducts && offer.applicableProducts.length > 0) {
      return offer.applicableProducts.some((item) => {
        const offerProductId = getOfferProductId(item);
        const offerProductName = getOfferProductName(item);

        if (productId && offerProductId && String(offerProductId) === productId) {
          return true;
        }

        return (
          productNameLower.includes(offerProductName) ||
          offerProductName.includes(productNameLower)
        );
      });
    }

    return false;
  });
};

export const calculateBestDiscount = (offers, product, quantity = 1, basePrice, context = {}) => {
  const applicableOffers = getApplicableOffers(offers, product, quantity, context);
  const numericBasePrice = Number(basePrice || 0);

  if (applicableOffers.length === 0) {
    return { discount: 0, finalPrice: numericBasePrice };
  }

  let bestDiscount = 0;
  let bestOffer = null;

  applicableOffers.forEach((offer) => {
    let discountAmount = 0;

    if (offer.discountType === "fixed") {
      discountAmount = Number(offer.discount || 0);
    } else {
      discountAmount = (numericBasePrice * quantity * Number(offer.discount || 0)) / 100;
    }

    if (discountAmount > bestDiscount) {
      bestDiscount = discountAmount;
      bestOffer = offer;
    }
  });

  return {
    discount: bestDiscount,
    finalPrice: Math.max(0, numericBasePrice * quantity - bestDiscount),
    offer: bestOffer,
  };
};

export const parseProductPrice = (value) => {
  return Number(String(value ?? 0).replace(/[^0-9.]/g, "")) || 0;
};

export const calculateCartItemOfferPricing = (offers, product, quantity = 1) => {
  const unitPrice = parseProductPrice(product?.price);
  const pricing = calculateBestDiscount(
    offers.filter((offer) => offer.type !== OFFER_TYPES.COMBO),
    product,
    quantity,
    unitPrice
  );

  return {
    unitPrice,
    quantity,
    offer: pricing.offer || null,
    discount: pricing.discount || 0,
    total: unitPrice * quantity,
    finalTotal: pricing.finalPrice || unitPrice * quantity,
    finalUnitPrice: quantity > 0 ? (pricing.finalPrice || unitPrice * quantity) / quantity : unitPrice,
  };
};

export const calculateCartOfferPricing = (offers, cartItems = []) => {
  const validCartItems = cartItems.filter((item) => item?.productId && Number(item?.quantity) > 0);
  const cartQuantities = buildCartQuantityLookup(validCartItems);
  const nonComboOffers = getActiveFarmerOffers(offers).filter((offer) => offer.type !== OFFER_TYPES.COMBO);
  const comboOffers = getActiveFarmerOffers(offers).filter((offer) => offer.type === OFFER_TYPES.COMBO);

  const unitPriceLookup = {};
  validCartItems.forEach((item) => {
    const productId = String(getOfferProductId(item.productId));
    unitPriceLookup[productId] = parseProductPrice(item.productId?.price);
  });

  const regularPricingLookup = {};
  validCartItems.forEach((item) => {
    regularPricingLookup[item._id] = calculateCartItemOfferPricing(nonComboOffers, item.productId, Number(item.quantity) || 0);
  });

  const comboAppliedQtyByProduct = {};
  const comboDiscountByProduct = {};
  const comboOfferByProduct = {};
  const comboHintByProduct = {};
  const reservedQtyByProduct = {};

  comboOffers
    .map((offer) => ({
      offer,
      discountPerSet: getComboSetDiscount(offer, unitPriceLookup),
    }))
    .sort((a, b) => b.discountPerSet - a.discountPerSet)
    .forEach(({ offer, discountPerSet }) => {
      const comboIds = getComboOfferIds(offer);
      if (!comboIds.length || discountPerSet <= 0) return;

      const presentIds = comboIds.filter((comboId) => Number(cartQuantities[String(comboId)] || 0) > 0);
      const isCompleteCombo = comboIds.every((comboId) => Number(cartQuantities[String(comboId)] || 0) > 0);

      if (!isCompleteCombo) {
        presentIds.forEach((productId) => {
          comboHintByProduct[String(productId)] = INCOMPLETE_COMBO_MESSAGE;
        });
        return;
      }

      const availableComboCount = Math.min(
        ...comboIds.map((comboId) =>
          Math.max(0, Number(cartQuantities[String(comboId)] || 0) - Number(reservedQtyByProduct[String(comboId)] || 0))
        )
      );

      if (availableComboCount <= 0) return;

      const comboOriginalTotal = comboIds.reduce(
        (sum, comboId) => sum + (Number(unitPriceLookup[String(comboId)]) || 0),
        0
      );

      if (comboOriginalTotal <= 0) return;

      comboIds.forEach((productId) => {
        const key = String(productId);
        const unitPrice = Number(unitPriceLookup[key]) || 0;
        const proportionalDiscount = (discountPerSet * unitPrice) / comboOriginalTotal;

        reservedQtyByProduct[key] = Number(reservedQtyByProduct[key] || 0) + availableComboCount;
        comboAppliedQtyByProduct[key] = Number(comboAppliedQtyByProduct[key] || 0) + availableComboCount;
        comboDiscountByProduct[key] =
          Number(comboDiscountByProduct[key] || 0) + proportionalDiscount * availableComboCount;
        comboOfferByProduct[key] = offer;
      });
    });

  return validCartItems.map((item) => {
    const productId = String(getOfferProductId(item.productId));
    const quantity = Number(item.quantity) || 0;
    const regularPricing = regularPricingLookup[item._id];
    const unitPrice = regularPricing.unitPrice;
    const comboAppliedQty = Math.min(quantity, Number(comboAppliedQtyByProduct[productId] || 0));
    const regularEligibleQty = Math.max(0, quantity - comboAppliedQty);
    const regularDiscountPerUnit = quantity > 0 ? Number(regularPricing.discount || 0) / quantity : 0;
    const regularDiscountForRemaining = regularDiscountPerUnit * regularEligibleQty;
    const comboDiscount = Number(comboDiscountByProduct[productId] || 0);
    const totalDiscount = Math.min(unitPrice * quantity, comboDiscount + regularDiscountForRemaining);
    const total = unitPrice * quantity;
    const finalTotal = Math.max(0, total - totalDiscount);

    return {
      ...item,
      pricing: {
        unitPrice,
        quantity,
        offer:
          comboAppliedQty > 0
            ? comboOfferByProduct[productId] || null
            : regularPricing.offer || null,
        discount: totalDiscount,
        total,
        finalTotal,
        finalUnitPrice: quantity > 0 ? finalTotal / quantity : unitPrice,
        comboHint: comboHintByProduct[productId] || null,
      },
    };
  });
};

export const formatValidUntil = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Expires Today";
  if (diffDays === 1) return "Expires Tomorrow";
  if (diffDays <= 3) return `Expires in ${diffDays} days`;
  return `Valid until ${date.toLocaleDateString()}`;
};

export const getOfferTypeColor = (type) => {
  switch (type) {
    case OFFER_TYPES.NEAR_EXPIRY:
      return "#ef4444";
    case OFFER_TYPES.HIGH_STOCK:
      return "#f59e0b";
    case OFFER_TYPES.BULK_PURCHASE:
      return "#3b82f6";
    case OFFER_TYPES.COMBO:
      return "#8b5cf6";
    default:
      return "#6b7280";
  }
};

export const getOfferTypeLabel = (type) => {
  switch (type) {
    case OFFER_TYPES.NEAR_EXPIRY:
      return "Flash Sale";
    case OFFER_TYPES.HIGH_STOCK:
      return "Stock Clearance";
    case OFFER_TYPES.BULK_PURCHASE:
      return "Bulk Deal";
    case OFFER_TYPES.COMBO:
      return "Combo Offer";
    default:
      return "Special Offer";
  }
};
