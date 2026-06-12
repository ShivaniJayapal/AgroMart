import { useLocation, useNavigate } from "react-router-dom";
import { FaStar, FaArrowLeft, FaCheckCircle } from "react-icons/fa";

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const shipping = location.state?.shipping;
  const orderItems = location.state?.orderItems;
  const orderId = location.state?.orderId;
  const orderConfirmation = location.state?.orderConfirmation;

  const handleRateProducts = () => {
    if (orderItems && orderId) {
      navigate("/review", { state: { orderItems, orderId } });
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <FaCheckCircle size={18} color="#16a34a" />
          </div>
          <div style={styles.headerText}>
            <p style={styles.title}>Order confirmed!</p>
            <p style={styles.subtitle}>Placed successfully</p>
          </div>
          <span style={styles.paidBadge}>Paid</span>
        </div>

        {/* Combined details card */}
        <div style={styles.card}>

          {/* Delivery */}
          {shipping && (
            <>
              <p style={styles.sectionLabel}>Delivery</p>
              <div style={styles.grid}>
                <span style={styles.label}>Name</span>
                <span style={styles.value}>{shipping.fullName}</span>

                <span style={styles.label}>Phone</span>
                <span style={styles.value}>{shipping.phone}</span>

                <span style={styles.label}>Address</span>
                <span style={styles.value}>
                  {shipping.house}, {shipping.landmark}, {shipping.city}, {shipping.pincode}
                </span>
              </div>
            </>
          )}

          {/* Divider */}
          {shipping && orderConfirmation && <div style={styles.divider} />}

          {/* Payment */}
          {orderConfirmation && (
            <>
              <p style={styles.sectionLabel}>Payment</p>
              <div style={styles.grid}>
                <span style={styles.label}>Status</span>
                <span style={{ ...styles.value, color: "#16a34a", fontWeight: 500 }}>
                  ✓ {orderConfirmation.paymentStatus}
                </span>

                <span style={styles.label}>Order ID</span>
                <span style={{ ...styles.value, wordBreak: "break-all", fontSize: 11 }}>
                  {orderConfirmation.razorpayOrderId}
                </span>

                <span style={styles.label}>Payment ID</span>
                <span style={{ ...styles.value, wordBreak: "break-all", fontSize: 11 }}>
                  {orderConfirmation.razorpayPaymentId}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.rateBtn} onClick={handleRateProducts}>
            <FaStar size={12} /> Rate
          </button>
          <button style={styles.backBtn} onClick={() => navigate("/customer")}>
            <FaArrowLeft size={12} /> Back to Marketplace
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f2f5",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "32px 16px",
  },
  container: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    borderRadius: 12,
    padding: "12px 14px",
    border: "0.5px solid #e5e7eb",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "#111",
  },
  subtitle: {
    margin: 0,
    fontSize: 11,
    color: "#6b7280",
  },
  paidBadge: {
    background: "#dcfce7",
    color: "#15803d",
    fontSize: 10,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "12px 14px",
    border: "0.5px solid #e5e7eb",
  },
  sectionLabel: {
    margin: "0 0 6px",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: "#9ca3af",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "76px 1fr",
    gap: "4px 8px",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    paddingTop: 1,
  },
  value: {
    fontSize: 12,
    color: "#111",
  },
  divider: {
    borderTop: "0.5px solid #e5e7eb",
    margin: "10px 0",
  },
  actions: {
    display: "flex",
    gap: 8,
  },
  rateBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    color: "#16a34a",
    border: "1.5px solid #16a34a",
    borderRadius: 8,
    padding: "9px 14px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: 1,
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 14px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  },
};

export default OrderConfirmation;