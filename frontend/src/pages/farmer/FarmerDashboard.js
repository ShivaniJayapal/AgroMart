import React, { useState, useEffect } from "react";
import AddProduct from "./AddProduct";
import MyProducts from "./MyProducts";
import OrdersReceived from "./OrdersReceived";
import FarmerOffers from "../../components/FarmerOffers";
import FarmerAnalytics from "./FarmerAnalytics";
import "./FarmerDashboard.css"; 

function FarmerDashboard() {
  const [page, setPage] = useState("my");

  useEffect(() => {
    const handleSwitchToAnalytics = (e) => {
      // Only switch to analytics if the event was intentionally dispatched from the navbar button
      // Prevent any accidental triggers
      if (e.detail && e.detail.intentional) {
        setPage("analytics");
      }
    };

    // Listen for custom event from navbar
    window.addEventListener("switchToAnalytics", handleSwitchToAnalytics);

    // Cleanup
    return () => {
      window.removeEventListener("switchToAnalytics", handleSwitchToAnalytics);
    };
  }, []);

  return (
    <div className="dashboard-wrapper">
      {/* PROFESSIONAL CLEAN NAVBAR */}
      <header className="farmer-navbar">
        <div className="header-content">
          <div className="title-section">
            <h2>Farmer Dashboard</h2>
            <p className="subtitle">Manage your harvest listings and inventory</p>
          </div>
          
          <div className="nav-toggle-group">
            <button
              className={page === "add" ? "active-tab" : "inactive-tab"}
              onClick={() => setPage("add")}
            >
              Add Product
            </button>

            <button
              className={page === "my" ? "active-tab" : "inactive-tab"}
              onClick={() => setPage("my")}
            >
              My Inventory
            </button>

            <button
              className={page === "orders" ? "active-tab" : "inactive-tab"}
              onClick={() => setPage("orders")}
            >
              Orders Received
            </button>

            <button
              className={page === "offers" ? "active-tab" : "inactive-tab"}
              onClick={() => setPage("offers")}
            >
              My Offers
            </button>
          </div>
        </div>
      </header>

      {/* DYNAMIC CONTENT AREA */}
      <main className="dashboard-view-area">
        <div className={`fade-in-section ${page === "add" ? "content-shellless" : ""}`}>
          {page === "add" && <AddProduct />}
          {page === "my" && <MyProducts />}
          {page === "orders" && <OrdersReceived />}
          {page === "offers" && <FarmerOffers />}
          {page === "analytics" && <FarmerAnalytics />}
        </div>
      </main>
    </div>
  );
}

export default FarmerDashboard;
