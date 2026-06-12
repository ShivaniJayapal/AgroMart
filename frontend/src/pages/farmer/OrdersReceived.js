import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./OrdersReceived.css";

function OrdersReceived() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Login required");

      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get("/orders/received", { headers });
      setOrders(response.data);
    } catch (err) {
      console.error("Failed to fetch received orders", err);
      setError(err?.response?.data?.message || "Could not fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const changeStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await api.put(
        `/orders/update-status/${orderId}`,
        { status, note: `Marked ${status}` },
        { headers }
      );

      await fetchOrders();

      setSelectedOrder((current) => {
        if (!current || current._id !== orderId) return current;

        return {
          ...current,
          status,
          deliveryUpdates: [
            ...(current.deliveryUpdates || []),
            { status, note: `Marked ${status}`, updatedAt: new Date().toISOString() },
          ],
        };
      });
    } catch (err) {
      console.error("Update status failed", err);
      alert(err?.response?.data?.message || "Could not update status");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const orderDate = new Date(order.createdAt).toISOString().slice(0, 10);
      const matchesDate = !dateFilter || orderDate === dateFilter;
      return matchesStatus && matchesDate;
    });
  }, [orders, statusFilter, dateFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilter("");
  };

  const formatDate = (value) => new Date(value).toLocaleString();

  const nextStatusAction = (status) => {
    if (status === "placed") return { label: "Mark Shipped", value: "shipped" };
    if (status === "shipped") return { label: "Mark In Transit", value: "in_transit" };
    if (status === "in_transit") return { label: "Mark Delivered", value: "delivered" };
    return null;
  };

  return (
    <div className="farmers-orders-container">
      <div className="orders-topbar">
        <div>
          <h2>Orders Received</h2>
          <p className="orders-subtitle">A cleaner summary view with quick access to full order details.</p>
        </div>

        <div className="orders-filters">
          <label className="filter-field">
            <span>Filter by date</span>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </label>

          <label className="filter-field">
            <span>Filter by status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="placed">Placed</option>
              <option value="shipped">Shipped</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </label>

          <button type="button" className="clear-filter-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {loading && <p>Loading orders...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !filteredOrders.length && <p>No orders match the selected filters.</p>}

      {!loading && !!filteredOrders.length && (
        <div className="orders-table-shell">
          <div className="orders-table-head">
            <span>Order ID</span>
            <span>Username</span>
            <span>Date</span>
            <span>Action</span>
          </div>

          <div className="orders-table-body">
            {filteredOrders.map((order) => (
              <div key={order._id} className="orders-row">
                <div className="orders-cell">
                  <span className="mobile-label">Order ID</span>
                  <span className="order-id-text">#{order._id.slice(-8)}</span>
                </div>

                <div className="orders-cell">
                  <span className="mobile-label">Username</span>
                  <span>{order.user?.username || order.userId?.username || order.shipping?.fullName || "Unknown user"}</span>
                </div>

                <div className="orders-cell">
                  <span className="mobile-label">Date</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>

                <div className="orders-cell orders-action-cell">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(order)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="order-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h3>Order Details</h3>
                <p>Order #{selectedOrder._id}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedOrder(null)}>
                X
              </button>
            </div>

            <div className="order-details-grid">
              <div className="details-card">
                <h4>Customer</h4>
                <p><strong>Name:</strong> {selectedOrder.shipping?.fullName || "N/A"}</p>
                <p><strong>Phone:</strong> {selectedOrder.shipping?.phone || "N/A"}</p>
                <p>
                  <strong>Address:</strong> {selectedOrder.shipping?.house}, {selectedOrder.shipping?.landmark},{" "}
                  {selectedOrder.shipping?.city}, {selectedOrder.shipping?.pincode}
                </p>
              </div>

              <div className="details-card">
                <h4>Order Summary</h4>
                <p>
                  <strong>Status:</strong>
                  <span className="status-pill" data-status={selectedOrder.status}>
                    {selectedOrder.status}
                  </span>
                </p>
                <p><strong>Amount:</strong> Rs {Number(selectedOrder.amount || 0).toFixed(2)}</p>
                <p><strong>Ordered On:</strong> {formatDate(selectedOrder.createdAt)}</p>
              </div>
            </div>

            <div className="details-card">
              <h4>Items</h4>
              <ul className="details-list">
                {selectedOrder.items?.map((item) => (
                  <li key={item.productId || item.name}>
                    <strong>{item.name}</strong> - {item.quantity} x Rs {Number(item.price || 0).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="details-card">
              <h4>Delivery Updates</h4>
              {!!selectedOrder.deliveryUpdates?.length ? (
                <ul className="details-list">
                  {selectedOrder.deliveryUpdates.map((update, idx) => (
                    <li key={`${update.status}-${idx}`}>
                      <strong>{update.status}</strong> - {update.note}
                      {update.location ? ` (${update.location})` : ""} on {formatDate(update.updatedAt)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No delivery updates yet.</p>
              )}
            </div>

            <div className="farmactions">
              {nextStatusAction(selectedOrder.status) && (
                <button
                  className="btn"
                  onClick={() => changeStatus(selectedOrder._id, nextStatusAction(selectedOrder.status).value)}
                >
                  {nextStatusAction(selectedOrder.status).label}
                </button>
              )}

              <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersReceived;
