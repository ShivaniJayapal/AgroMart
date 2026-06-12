import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaRegStar, FaStar } from "react-icons/fa";
import api from "../../services/api";

function getProductFromItem(item) {
  const product = item.productId && typeof item.productId === "object"
    ? item.productId
    : null;
  return {
    id: product?._id || item.productId || item._id,
    name: product?.name || item.name || "Product",
    image: product?.image || item.image || "",
    unit: product?.unit || item.unit || "unit",
    price: product?.price || item.price || "",
    quantity: item.quantity || 1,
    existingReview: item.review || null,
  };
}

const ratingLabels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

const ReviewItemCard = memo(function ReviewItemCard({ item, review, onRatingChange, onCommentChange }) {
  return (
    <div style={styles.card}>
      {/* Product row */}
      <div style={styles.productRow}>
        <div style={styles.productInitial}>
          {item.name.charAt(0).toUpperCase()}
        </div>
        <div style={styles.productInfo}>
          <p style={styles.productName}>{item.name}</p>
          <p style={styles.productMeta}>
            {item.quantity} {item.unit}
            {item.price ? ` · ₹${item.price} per ${item.unit}` : ""}
          </p>
        </div>
        {review.rating > 0 && (
          <span style={styles.ratingBadge}>{ratingLabels[review.rating]}</span>
        )}
      </div>

      <div style={styles.divider} />

      {/* Stars */}
      <div style={styles.starsRow}>
        <span style={styles.fieldLabel}>Rating</span>
        <div style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= review.rating;
            return (
              <button
                key={star}
                type="button"
                style={{ ...styles.starBtn, color: active ? "#f59e0b" : "#d1d5db" }}
                onClick={() => onRatingChange(item.id, star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
              >
                {active ? <FaStar size={20} /> : <FaRegStar size={20} />}
              </button>
            );
          })}
        </div>
        {review.rating === 0 && (
          <span style={styles.ratingHint}>Tap to rate</span>
        )}
      </div>

      {/* Comment */}
      <div style={styles.commentBlock}>
        <div style={styles.commentHeader}>
          <span style={styles.fieldLabel}>Comment</span>
          <span style={styles.charCount}>{review.comment.length}/500</span>
        </div>
        <textarea
          id={`comment-${item.id}`}
          value={review.comment}
          onChange={(e) => onCommentChange(item.id, e.target.value)}
          placeholder="How was the quality, freshness, or packaging?"
          rows={3}
          maxLength={500}
          style={styles.textarea}
        />
      </div>
    </div>
  );
});

function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const redirectTimeoutRef = useRef(null);

  const initialDataRef = useRef({
    orderId: location.state?.orderId || "",
    orderItems: (location.state?.orderItems || [])
      .map(getProductFromItem)
      .filter((item) => item.id),
  });

  const { orderId, orderItems } = initialDataRef.current;

  const [reviews, setReviews] = useState(() => {
    const next = {};
    initialDataRef.current.orderItems.forEach((item) => {
      next[item.id] = {
        rating: item.existingReview?.rating || 0,
        comment: item.existingReview?.comment || "",
      };
    });
    return next;
  });

  useEffect(() => {
    if (!orderId || orderItems.length === 0) navigate("/my-orders", { replace: true });
  }, [navigate, orderId, orderItems.length]);

  useEffect(() => () => {
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
  }, []);

  const handleRatingChange = useCallback((productId, rating) => {
    setReviews((prev) => ({ ...prev, [productId]: { ...prev[productId], rating } }));
  }, []);

  const handleCommentChange = useCallback((productId, comment) => {
    setReviews((prev) => ({ ...prev, [productId]: { ...prev[productId], comment } }));
  }, []);

  const handleSubmit = async () => {
    const incomplete = orderItems.filter((item) => {
      const r = reviews[item.id];
      return !r?.rating || !r?.comment?.trim();
    });
    if (incomplete.length > 0) {
      setError("Please add a rating and comment for each product.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await Promise.all(
        orderItems.map((item) =>
          api.post(
            `/reviews/product/${item.id}/order/${orderId}`,
            { rating: reviews[item.id].rating, comment: reviews[item.id].comment.trim() },
            { headers }
          )
        )
      );
      setSuccess("Reviews submitted! Redirecting…");
      redirectTimeoutRef.current = setTimeout(() => navigate("/my-orders"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = orderItems.filter((item) => {
    const r = reviews[item.id];
    return r?.rating > 0 && r?.comment?.trim().length > 0;
  }).length;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>

        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/my-orders")}>
            <FaArrowLeft size={12} /> Back to orders
          </button>
          <div style={styles.headerMain}>
            <p style={styles.kicker}>Customer feedback</p>
            <h1 style={styles.heading}>Rate your products</h1>
            <p style={styles.subheading}>
              Your feedback helps other customers and supports our farmers.
            </p>
          </div>
          {/* Progress indicator */}
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${(completedCount / orderItems.length) * 100}%` }} />
          </div>
          <p style={styles.progressLabel}>
            {completedCount} of {orderItems.length} reviewed
          </p>
        </div>

        {/* Cards */}
        <div style={styles.grid}>
          {orderItems.map((item) => (
            <ReviewItemCard
              key={item.id}
              item={item}
              review={reviews[item.id] || { rating: 0, comment: "" }}
              onRatingChange={handleRatingChange}
              onCommentChange={handleCommentChange}
            />
          ))}
        </div>

        {/* Banner */}
        {(error || success) && (
          <div style={{ ...styles.banner, ...(error ? styles.bannerError : styles.bannerSuccess) }}>
            {error || success}
          </div>
        )}

        {/* Footer actions */}
        <div style={styles.footer}>
          <button
            style={styles.skipBtn}
            onClick={() => navigate("/my-orders")}
            disabled={submitting}
          >
            Skip for now
          </button>
          <button
            style={{
              ...styles.submitBtn,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit reviews"}
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "24px 16px 40px",
  },
  shell: {
    maxWidth: 480,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  /* Header */
  header: {
    background: "#fff",
    borderRadius: 12,
    padding: "14px 16px",
    border: "0.5px solid #e5e7eb",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "none",
    padding: 0,
    fontSize: 12,
    color: "#6b7280",
    cursor: "pointer",
    marginBottom: 10,
  },
  headerMain: {
    marginBottom: 12,
  },
  kicker: {
    margin: "0 0 2px",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: "#9ca3af",
  },
  heading: {
    margin: "0 0 4px",
    fontSize: 16,
    fontWeight: 600,
    color: "#111",
  },
  subheading: {
    margin: 0,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  progressBar: {
    height: 4,
    background: "#e5e7eb",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    background: "#16a34a",
    borderRadius: 99,
    transition: "width 0.3s ease",
  },
  progressLabel: {
    margin: 0,
    fontSize: 11,
    color: "#9ca3af",
  },

  /* Cards */
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "12px 14px",
    border: "0.5px solid #e5e7eb",
  },

  /* Product row */
  productRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  productInitial: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "#dcfce7",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    margin: "0 0 2px",
    fontSize: 13,
    fontWeight: 600,
    color: "#111",
  },
  productMeta: {
    margin: 0,
    fontSize: 11,
    color: "#6b7280",
  },
  ratingBadge: {
    background: "#fef9c3",
    color: "#854d0e",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
  },

  divider: {
    borderTop: "0.5px solid #f3f4f6",
    marginBottom: 10,
  },

  /* Stars */
  starsRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#9ca3af",
    minWidth: 52,
  },
  stars: {
    display: "flex",
    gap: 4,
  },
  starBtn: {
    background: "transparent",
    border: "none",
    padding: 2,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "transform 0.1s",
  },
  ratingHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginLeft: 4,
  },

  /* Comment */
  commentBlock: {},
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  charCount: {
    fontSize: 11,
    color: "#9ca3af",
  },
  textarea: {
    width: "100%",
    resize: "vertical",
    fontSize: 12,
    color: "#111",
    background: "#f9fafb",
    border: "0.5px solid #e5e7eb",
    borderRadius: 8,
    padding: "8px 10px",
    lineHeight: 1.6,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  /* Banner */
  banner: {
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 500,
  },
  bannerError: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "0.5px solid #fca5a5",
  },
  bannerSuccess: {
    background: "#dcfce7",
    color: "#15803d",
    border: "0.5px solid #86efac",
  },

  /* Footer */
  footer: {
    display: "flex",
    gap: 8,
  },
  skipBtn: {
    background: "transparent",
    color: "#6b7280",
    border: "0.5px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  submitBtn: {
    flex: 1,
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default ReviewPage;