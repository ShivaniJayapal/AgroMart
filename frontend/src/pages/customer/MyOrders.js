import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { FaEdit, FaStar, FaBoxOpen, FaMapMarkerAlt, FaReceipt } from "react-icons/fa";

const STATUS_STEPS = ["placed", "shipped", "in_transit", "delivered", "completed"];

const STATUS_COLOR = {
  placed:     { bg: "#eff6ff", color: "#1d4ed8" },
  shipped:    { bg: "#fefce8", color: "#854d0e" },
  in_transit: { bg: "#fff7ed", color: "#9a3412" },
  delivered:  { bg: "#f0fdf4", color: "#15803d" },
  completed:  { bg: "#f0fdf4", color: "#15803d" },
};

const fmt = (v) => `₹${Number(v || 0).toFixed(2)}`;

function StatusTracker({ status }) {
  const current = STATUS_STEPS.indexOf(status);
  return (
    <div style={s.tracker}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step} style={s.trackerItem}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                ...s.trackerDot,
                background: done ? "#16a34a" : "#e5e7eb",
                border: active ? "2px solid #16a34a" : "2px solid transparent",
                boxShadow: active ? "0 0 0 3px #dcfce7" : "none",
              }} />
              {i < STATUS_STEPS.length - 1 && (
                <div style={{ ...s.trackerLine, background: done && i < current ? "#16a34a" : "#e5e7eb" }} />
              )}
            </div>
            <span style={{ ...s.trackerLabel, color: done ? "#16a34a" : "#9ca3af", fontWeight: active ? 700 : 400 }}>
              {step.replace("_", " ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, onReview, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_COLOR[order.status] || STATUS_COLOR.placed;
  const hasReviewable = order.items.some((i) => i.canReview && !i.review);
  const hasReviewed = order.items.some((i) => i.review);
  const reviewedCount = order.items.filter((i) => i.review).length;

  return (
    <div style={s.card}>
      {/* Header */}
      <div style={s.cardHeader}>
        <div style={s.cardHeaderLeft}>
          <div style={s.orderIcon}><FaBoxOpen size={13} color="#16a34a" /></div>
          <div>
            <p style={s.orderId}>#{order._id.slice(-8).toUpperCase()}</p>
            <p style={s.orderDate}>
              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <div style={s.cardHeaderRight}>
          <span style={{ ...s.statusBadge, background: statusStyle.bg, color: statusStyle.color }}>
            {order.status.replace("_", " ")}
          </span>
          <p style={s.totalAmount}>{fmt(order.amount)}</p>
        </div>
      </div>

      {/* Tracker */}
      <StatusTracker status={order.status} />

      {/* Items */}
      <div style={s.itemsList}>
        {order.items.map((item) => {
          const id = (item.productId && item.productId._id) || item.productId || item._id;
          const name = item.productId?.name || item.name;
          return (
            <div key={id} style={s.itemRow}>
              <div style={s.itemInitial}>{name.charAt(0).toUpperCase()}</div>
              <div style={s.itemInfo}>
                <p style={s.itemName}>{name}</p>
                <p style={s.itemMeta}>{item.quantity} × {fmt(item.price)}</p>
              </div>
              <div style={s.itemRight}>
                <p style={s.itemTotal}>{fmt(item.price * item.quantity)}</p>
                {item.review ? (
                  <span style={s.reviewedTag}><FaStar size={9} /> {item.review.rating}/5</span>
                ) : item.canReview ? (
                  <span style={s.pendingTag}><FaStar size={9} /> Rate</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toggle */}
      <button style={s.toggleBtn} onClick={() => setExpanded((p) => !p)}>
        {expanded ? "Hide details ▲" : "Show details ▼"}
      </button>

      {/* Expanded */}
      {expanded && (
        <div style={s.expandedBlock}>
          <div style={s.detailSection}>
            <p style={s.detailLabel}><FaMapMarkerAlt size={10} /> Shipping</p>
            <div style={s.detailGrid}>
              <span style={s.dlabel}>Name</span>
              <span style={s.dvalue}>{order.shipping?.fullName}</span>
              <span style={s.dlabel}>Phone</span>
              <span style={s.dvalue}>{order.shipping?.phone}</span>
              <span style={s.dlabel}>Address</span>
              <span style={s.dvalue}>
                {order.shipping?.house}, {order.shipping?.landmark}, {order.shipping?.city} – {order.shipping?.pincode}
              </span>
            </div>
          </div>
          <div style={s.detailDivider} />
          <div style={s.detailSection}>
            <p style={s.detailLabel}><FaReceipt size={10} /> Payment</p>
            <div style={s.detailGrid}>
              <span style={s.dlabel}>Currency</span>
              <span style={s.dvalue}>{order.currency || "INR"}</span>
              <span style={s.dlabel}>Order ID</span>
              <span style={{ ...s.dvalue, fontSize: 10, wordBreak: "break-all" }}>{order.razorpayOrderId}</span>
              <span style={s.dlabel}>Payment ID</span>
              <span style={{ ...s.dvalue, fontSize: 10, wordBreak: "break-all" }}>{order.razorpayPaymentId || "Pending"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {(hasReviewable || hasReviewed) && (
        <div style={s.actions}>
          {hasReviewable && (
            <button style={s.rateBtn} onClick={() => onReview(order)}>
              <FaStar size={11} /> Rate products
            </button>
          )}
          {hasReviewed && (
            <button style={s.manageBtn} onClick={() => navigate("/my-reviews")}>
              <FaEdit size={11} /> Manage reviews ({reviewedCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/phone"); return; }
        const res = await api.get("/orders/my", { headers: { Authorization: `Bearer ${token}` } });
        setOrders(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Could not load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleReviewOrder = (order) => {
    const reviewable = order.items.filter((i) => i.canReview && !i.review);
    if (!reviewable.length) { navigate("/my-reviews"); return; }
    navigate("/review", { state: { orderId: order._id, orderItems: reviewable } });
  };

  return (
    <div style={s.page}>

      {/* Full-width header bar */}
      <div style={s.headerBar}>
        <div style={s.headerInner}>
          <div>
            <p style={s.pageKicker}>Account</p>
            <h1 style={s.pageTitle}>My Orders</h1>
            <p style={s.pageSubtitle}>Track deliveries, manage reviews, and view your purchase history.</p>
          </div>
          {!loading && orders.length > 0 && (
            <span style={s.orderCountBadge}>{orders.length} order{orders.length > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={s.content}>
        {loading && (
          <div style={s.stateBox}>
            <div style={s.spinner} />
            <p style={s.stateText}>Loading your orders…</p>
          </div>
        )}
        {!loading && error && <div style={s.errorBox}>{error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div style={s.stateBox}>
            <FaBoxOpen size={32} color="#d1d5db" />
            <p style={s.stateText}>No orders yet. Start shopping!</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div style={s.grid}>
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} onReview={handleReviewOrder} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    paddingBottom: 48,
  },

  /* Header bar */
  headerBar: {
    background: "#fff",
    borderBottom: "0.5px solid #e5e7eb",
    padding: "16px 24px",
    marginBottom: 20,
  },
  headerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pageKicker: {
    margin: "0 0 2px",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: "#9ca3af",
  },
  pageTitle: {
    margin: "0 0 3px",
    fontSize: 20,
    fontWeight: 700,
    color: "#111",
  },
  pageSubtitle: {
    margin: 0,
    fontSize: 13,
    color: "#6b7280",
  },
  orderCountBadge: {
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: 20,
    border: "0.5px solid #bbf7d0",
    whiteSpace: "nowrap",
    marginTop: 4,
  },

  /* Content area */
  content: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px",
  },

  /* 2-col grid */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))",
    gap: 14,
  },

  /* States */
  stateBox: {
    background: "#fff",
    border: "0.5px solid #e5e7eb",
    borderRadius: 12,
    padding: "48px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  stateText: { margin: 0, fontSize: 13, color: "#9ca3af" },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid #e5e7eb",
    borderTop: "2px solid #16a34a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "0.5px solid #fca5a5",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
  },

  /* Card */
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "0.5px solid #e5e7eb",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: "0.5px solid #f3f4f6",
  },
  cardHeaderLeft: { display: "flex", alignItems: "center", gap: 10 },
  orderIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: "#f0fdf4",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  orderId: { margin: "0 0 1px", fontSize: 13, fontWeight: 700, color: "#111", letterSpacing: "0.3px" },
  orderDate: { margin: 0, fontSize: 11, color: "#9ca3af" },
  cardHeaderRight: { textAlign: "right" },
  statusBadge: {
    display: "inline-block",
    fontSize: 10, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.4px",
    padding: "2px 8px", borderRadius: 20, marginBottom: 3,
  },
  totalAmount: { margin: 0, fontSize: 14, fontWeight: 700, color: "#111" },

  /* Tracker */
  tracker: {
    display: "flex",
    alignItems: "flex-start",
    padding: "10px 14px",
    borderBottom: "0.5px solid #f3f4f6",
  },
  trackerItem: { display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1 },
  trackerDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  trackerLine: { flex: 1, height: 2, minWidth: 12, marginTop: 4, borderRadius: 99 },
  trackerLabel: { marginTop: 5, fontSize: 9, textTransform: "capitalize", lineHeight: 1.3, whiteSpace: "nowrap" },

  /* Items */
  itemsList: {
    padding: "8px 14px",
    display: "flex", flexDirection: "column", gap: 6,
    borderBottom: "0.5px solid #f3f4f6",
  },
  itemRow: { display: "flex", alignItems: "center", gap: 10 },
  itemInitial: {
    width: 28, height: 28, borderRadius: 7,
    background: "#f3f4f6", color: "#6b7280",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 11, flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemName: { margin: "0 0 1px", fontSize: 12, fontWeight: 600, color: "#111" },
  itemMeta: { margin: 0, fontSize: 11, color: "#9ca3af" },
  itemRight: { textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 },
  itemTotal: { margin: 0, fontSize: 12, fontWeight: 600, color: "#111" },
  reviewedTag: {
    display: "inline-flex", alignItems: "center", gap: 3,
    background: "#f0fdf4", color: "#15803d",
    fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 20,
  },
  pendingTag: {
    display: "inline-flex", alignItems: "center", gap: 3,
    background: "#fefce8", color: "#854d0e",
    fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 20,
  },

  /* Toggle */
  toggleBtn: {
    display: "block", width: "100%",
    background: "transparent", border: "none",
    borderBottom: "0.5px solid #f3f4f6",
    padding: "8px 14px", textAlign: "left",
    fontSize: 11, color: "#6b7280", cursor: "pointer", fontWeight: 500,
  },

  /* Expanded */
  expandedBlock: {
    padding: "10px 14px",
    borderBottom: "0.5px solid #f3f4f6",
    background: "#fafafa",
  },
  detailSection: { marginBottom: 4 },
  detailLabel: {
    display: "flex", alignItems: "center", gap: 5,
    margin: "0 0 6px", fontSize: 10, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af",
  },
  detailGrid: { display: "grid", gridTemplateColumns: "68px 1fr", gap: "4px 8px" },
  dlabel: { fontSize: 11, color: "#9ca3af" },
  dvalue: { fontSize: 12, color: "#111" },
  detailDivider: { borderTop: "0.5px solid #e5e7eb", margin: "8px 0" },

  /* Actions */
  actions: { display: "flex", gap: 8, padding: "10px 14px" },
  rateBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: "#16a34a", color: "#fff", border: "none",
    borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", flex: 1,
  },
  manageBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: "transparent", color: "#374151", border: "0.5px solid #d1d5db",
    borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", flex: 1,
  },
};

export default MyOrders;