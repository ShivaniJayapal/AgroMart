import { useState, useEffect } from "react";
import api from "../services/api";
import { FaStar, FaTimes, FaUser, FaCheckCircle } from "react-icons/fa";
import { getApplicableOffers, getProductRelatedOffers, calculateBestDiscount, formatValidUntil, OFFER_TYPES } from '../utils/offers';

function StarRow({ rating, size = 12 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar key={i} size={size} color={i <= rating ? "#f59e0b" : "#e5e7eb"} />
      ))}
    </span>
  );
}

function ProductDetailsModal({ product, onClose, offers = [] }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(false);

  // Calculate offers
  const quantity = 1; // Default quantity for modal
  const relatedOffers = getProductRelatedOffers(offers, product);
  const applicableOffers = getApplicableOffers(offers, product, quantity);
  const bestDiscount = calculateBestDiscount(
    relatedOffers.filter((offer) => offer.type !== OFFER_TYPES.COMBO),
    product,
    quantity,
    product.price
  );
  const basePrice = Number(product.price) || 0;
  const finalPrice = quantity > 0 ? bestDiscount.finalPrice / quantity : basePrice;
  const rawDiscountPercentage =
    basePrice > 0 ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;
  const discountPercentage = Number.isFinite(rawDiscountPercentage) ? rawDiscountPercentage : 0;
  const hasOffer = relatedOffers.length > 0;
  const showDiscountBadge = applicableOffers.length > 0 && discountPercentage > 0;

  useEffect(() => {
    if (!product) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reviews/product/${product._id}`);
        const { reviews, averageRating, totalReviews, ratingCounts } = res.data;
        setReviews(reviews);
        setAverageRating(averageRating);
        setTotalReviews(totalReviews);
        setRatingCounts(ratingCounts);
      } catch (e) {
        console.error("Error fetching reviews:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [product]);

  if (!product) return null;

  const inStock = parseInt(product.quantity) > 0;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.modalHeader}>
          <p style={s.modalKicker}>Product details</p>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={s.modalBody}>

          {/* Product hero */}
          <div style={s.hero}>
            {/* Image */}
            <div style={s.imageWrap}>
              {product.image ? (
                <img
                  src={`http://localhost:5000/uploads/${product.image}`}
                  alt={product.name}
                  style={s.image}
                />
              ) : (
                <div style={s.noImage}>
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span style={s.noImageText}>No image</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={s.heroInfo}>
              <div style={s.heroTop}>
                <span style={s.categoryBadge}>{product.category}</span>
                {inStock ? (
                  <span style={s.inStock}>✓ In stock</span>
                ) : (
                  <span style={s.outStock}>✗ Out of stock</span>
                )}
              </div>

              <h2 style={s.productName}>{product.name}</h2>

              <div style={s.priceRow}>
                {showDiscountBadge ? (
                  <div style={s.discountedPricing}>
                    <span style={s.currentPrice}>₹{finalPrice.toFixed(2)}</span>
                    <span style={s.originalPrice}>₹{product.price}</span>
                    <span style={s.discountBadge}>{discountPercentage}% OFF</span>
                  </div>
                ) : (
                  <span style={s.price}>₹{product.price}</span>
                )}
                <span style={s.unit}>/ {product.unit}</span>
              </div>

              {averageRating > 0 && (
                <div style={s.ratingRow}>
                  <StarRow rating={Math.round(averageRating)} size={13} />
                  <span style={s.ratingNum}>{Number(averageRating).toFixed(1)}</span>
                  <span style={s.ratingTotal}>({totalReviews} {totalReviews === 1 ? "review" : "reviews"})</span>
                </div>
              )}

              {product.quantity && inStock && (
                <p style={s.stockQty}>{product.quantity} {product.unit} available</p>
              )}

              {product.description && (
                <div style={s.descBlock}>
                  <p style={s.sectionLabel}>Description</p>
                  <p style={s.descText}>{product.description}</p>
                </div>
              )}

              {/* Offers Section */}
              {hasOffer && (
                <div style={s.offersBlock}>
                  <p style={s.sectionLabel}>Available Offers</p>
                  <div style={s.offersList}>
                    {relatedOffers.map((offer) => (
                      <div key={offer.id} style={s.offerItem}>
                        <div style={s.offerHeader}>
                          <span style={s.offerType}>{offer.title}</span>
                          {offer.discountType === 'percentage' ? (
                            <span style={s.offerDiscount}>{offer.discount}% OFF</span>
                          ) : (
                            <span style={s.offerDiscount}>₹{offer.discount} OFF</span>
                          )}
                        </div>
                        <p style={s.offerDescription}>{offer.description}</p>
                        {offer.minQuantity && offer.minQuantity > 1 && (
                          <p style={s.offerCondition}>Minimum quantity: {offer.minQuantity} {product.unit}</p>
                        )}
                        <p style={s.offerValidity}>Valid until: {formatValidUntil(offer.validUntil)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={s.divider} />

          {/* Ratings summary */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Customer ratings</p>
            <div style={s.ratingSummary}>
              {/* Big number */}
              <div style={s.ratingBig}>
                <span style={s.ratingBigNum}>{averageRating ? Number(averageRating).toFixed(1) : "—"}</span>
                <StarRow rating={Math.round(averageRating)} size={14} />
                <span style={s.ratingBigSub}>{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</span>
              </div>

              {/* Breakdown bars */}
              <div style={s.ratingBars}>
                {[5, 4, 3, 2, 1].map((r) => {
                  const pct = totalReviews > 0 ? (ratingCounts[r] / totalReviews) * 100 : 0;
                  return (
                    <div key={r} style={s.barRow}>
                      <span style={s.barLabel}>{r}</span>
                      <FaStar size={9} color="#f59e0b" />
                      <div style={s.barTrack}>
                        <div style={{ ...s.barFill, width: `${pct}%` }} />
                      </div>
                      <span style={s.barCount}>{ratingCounts[r]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={s.divider} />

          {/* Reviews list */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Reviews</p>

            {loading && (
              <div style={s.stateBox}>
                <div style={s.spinner} />
                <span style={s.stateText}>Loading reviews…</span>
              </div>
            )}

            {!loading && reviews.length === 0 && (
              <div style={s.stateBox}>
                <span style={{ fontSize: 24 }}>💬</span>
                <p style={s.stateText}>No reviews yet. Be the first!</p>
              </div>
            )}

            {!loading && reviews.length > 0 && (
              <div style={s.reviewsList}>
                {reviews.map((review) => (
                  <div key={review._id} style={s.reviewCard}>
                    <div style={s.reviewHeader}>
                      <div style={s.reviewLeft}>
                        <div style={s.avatar}>
                          <FaUser size={12} color="#6b7280" />
                        </div>
                        <div>
                          <p style={s.reviewerName}>{review.user.name}</p>
                          <StarRow rating={review.rating} size={11} />
                        </div>
                      </div>
                      <div style={s.reviewMeta}>
                        <span style={s.reviewDate}>{formatDate(review.createdAt)}</span>
                        {review.verified && (
                          <span style={s.verifiedBadge}>
                            <FaCheckCircle size={9} color="#15803d" /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={s.reviewComment}>{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  /* Overlay */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 700,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "0.5px solid #e5e7eb",
  },

  /* Header */
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 18px",
    borderBottom: "0.5px solid #f3f4f6",
    flexShrink: 0,
  },
  modalKicker: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: "#9ca3af",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "0.5px solid #e5e7eb",
    background: "#f9fafb",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  /* Body */
  modalBody: {
    overflowY: "auto",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },

  /* Hero */
  hero: {
    display: "flex",
    gap: 18,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  imageWrap: {
    width: 180,
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    border: "0.5px solid #e5e7eb",
    flexShrink: 0,
    background: "#f9fafb",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  noImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  noImageText: {
    fontSize: 11,
    color: "#9ca3af",
  },

  /* Hero info */
  heroInfo: {
    flex: 1,
    minWidth: 200,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  heroTop: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  categoryBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    padding: "2px 8px",
    borderRadius: 20,
  },
  inStock: {
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
  },
  outStock: {
    background: "#fef2f2",
    color: "#991b1b",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
  },
  productName: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#111",
    lineHeight: 1.2,
  },
  priceRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: 700,
    color: "#16a34a",
  },
  unit: {
    fontSize: 13,
    color: "#9ca3af",
  },
  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  ratingNum: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111",
  },
  ratingTotal: {
    fontSize: 12,
    color: "#9ca3af",
  },
  stockQty: {
    margin: 0,
    fontSize: 12,
    color: "#6b7280",
  },
  descBlock: {
    marginTop: 4,
  },
  descText: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#374151",
    lineHeight: 1.6,
  },

  /* Offers */
  offersBlock: {
    marginTop: 12,
  },
  offersList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  offerItem: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    padding: 12,
  },
  offerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  offerType: {
    fontSize: 14,
    fontWeight: 700,
    color: "#166534",
  },
  offerDiscount: {
    background: "#16a34a",
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 12,
    textTransform: "uppercase",
  },
  offerDescription: {
    margin: "0 0 6px",
    fontSize: 13,
    color: "#166534",
    lineHeight: 1.5,
  },
  offerCondition: {
    margin: "0 0 4px",
    fontSize: 12,
    color: "#15803d",
    fontWeight: 600,
  },
  offerValidity: {
    margin: 0,
    fontSize: 11,
    color: "#9ca3af",
  },

  /* Discounted pricing */
  discountedPricing: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: 700,
    color: "#16a34a",
  },
  originalPrice: {
    fontSize: 16,
    color: "#9ca3af",
    textDecoration: "line-through",
  },
  discountBadge: {
    background: "#dc2626",
    color: "white",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 10,
    textTransform: "uppercase",
  },

  /* Divider */
  divider: {
    borderTop: "0.5px solid #f3f4f6",
    margin: "0 0 16px",
  },

  /* Section */
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    margin: "0 0 10px",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: "#9ca3af",
  },

  /* Rating summary */
  ratingSummary: {
    display: "flex",
    gap: 24,
    alignItems: "center",
    flexWrap: "wrap",
  },
  ratingBig: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    minWidth: 80,
  },
  ratingBigNum: {
    fontSize: 36,
    fontWeight: 700,
    color: "#111",
    lineHeight: 1,
  },
  ratingBigSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  ratingBars: {
    flex: 1,
    minWidth: 160,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  barLabel: {
    fontSize: 11,
    color: "#6b7280",
    minWidth: 8,
  },
  barTrack: {
    flex: 1,
    height: 6,
    background: "#f3f4f6",
    borderRadius: 99,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "#f59e0b",
    borderRadius: 99,
    transition: "width 0.4s ease",
  },
  barCount: {
    fontSize: 11,
    color: "#9ca3af",
    minWidth: 16,
    textAlign: "right",
  },

  /* States */
  stateBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "24px 16px",
    background: "#f9fafb",
    borderRadius: 10,
    border: "0.5px solid #e5e7eb",
  },
  stateText: {
    margin: 0,
    fontSize: 13,
    color: "#9ca3af",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "2px solid #e5e7eb",
    borderTop: "2px solid #16a34a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  /* Reviews */
  reviewsList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  reviewCard: {
    background: "#f9fafb",
    borderRadius: 10,
    border: "0.5px solid #e5e7eb",
    padding: "12px 14px",
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  reviewLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reviewerName: {
    margin: "0 0 3px",
    fontSize: 12,
    fontWeight: 600,
    color: "#111",
  },
  reviewMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  reviewDate: {
    fontSize: 11,
    color: "#9ca3af",
    whiteSpace: "nowrap",
  },
  verifiedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 20,
  },
  reviewComment: {
    margin: 0,
    fontSize: 13,
    color: "#374151",
    lineHeight: 1.6,
  },
};

export default ProductDetailsModal;