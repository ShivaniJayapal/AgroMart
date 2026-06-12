import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { FaHeart, FaShoppingCart, FaUserCircle, FaHome, FaInfoCircle, FaSignInAlt, FaTachometerAlt, FaChartBar } from "react-icons/fa";
import "./App.css"; 

import RoleSelect from "./pages/RoleSelect";
import PhoneInput from "./pages/PhoneInput";
import OtpVerify from "./pages/OtpVerify";
import Signup from "./pages/Signup";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderConfirmation from "./pages/customer/OrderConfirmation";
import { CartProvider, useCart } from "./context/CartContext";
import WishlistPage from "./pages/customer/WishlistPage";
import MyOrders from "./pages/customer/MyOrders";
import ProfilePage from "./pages/customer/ProfilePage";
import ReviewPage from "./pages/customer/ReviewPage";
import MyReviews from "./pages/customer/MyReviews";
import RouteGuard from "./components/RouteGuard";

function AppHeader() {
  const { cartItems, favorites } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isLoggedIn = localStorage.getItem("token");

  const isCustomerRoute = ["/customer", "/cart", "/checkout", "/order-confirmation", "/wishlist", "/profile", "/my-orders", "/review", "/my-reviews"].includes(location.pathname);
  const isFarmerRoute = location.pathname.startsWith("/farmer");

  // Get user role for display
  const getUserRole = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role;
    } catch (e) {
      return null;
    }
  };

  const userRole = getUserRole();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="modern-header">
      <div className="header-left">
        <Link to="/" className="header-brand">
          <img src="/favicon.ico.png" alt="AgroMart Logo" className="logo-img" />
          <h1 className="brand-text">AgroMart</h1>
        </Link>
        
        {/* Role Indicator */}
        {userRole && isLoggedIn && userRole === "farmer" && (
          <div className="role-indicator">
            <span className={`role-badge ${userRole}`}>
              Farmer
            </span>
          </div>
        )}
      </div>

      {/* Center Navigation Links */}
      <nav className="header-nav">
        <Link to="/" className="nav-link">
          <FaHome className="nav-icon" />
          <span>Home</span>
        </Link>
        {isFarmerRoute && (
          <button className="nav-link" onClick={() => {
            // Set analytics tab in farmer dashboard
            const event = new CustomEvent('switchToAnalytics', { detail: { intentional: true } });
            window.dispatchEvent(event);
          }}>
            <FaChartBar className="nav-icon" />
            <span>Analytics</span>
          </button>
        )}
        <Link to="/about" className="nav-link">
          <FaInfoCircle className="nav-icon" />
          <span>About Us</span>
        </Link>
      </nav>

      {isCustomerRoute && (
        <div className="header-actions">
          <Link to="/customer" className="action-item" title="Dashboard" aria-label="Go to dashboard">
            <FaTachometerAlt className="icon" />
          </Link>

          <Link to="/wishlist" className="action-item">
            <FaHeart className={`icon heart-icon ${favorites.length > 0 ? 'active' : ''}`} />
            {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
          </Link>

          <Link to="/cart" className="action-item">
            <FaShoppingCart className="icon cart-icon" />
            {cartItems.length > 0 && <span className="badge">{cartItems.length}</span>}
          </Link>

          <div className="profile-dropdown" ref={dropdownRef}>
            <div className="profile-trigger" onClick={toggleDropdown}>
              <FaUserCircle className="icon user-icon" />
              <span className="user-label">Account</span>
            </div>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {/* Role-based dashboard link */}
                {(() => {
                  try {
                    const token = localStorage.getItem("token");
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    const role = payload.role;
                    const dashboardPath = role === "farmer" ? "/farmer" : "/customer";
                    return (
                      <Link to={dashboardPath} onClick={() => setIsDropdownOpen(false)}>
                        {role === "farmer" ? "Farmer Dashboard" : "My Dashboard"}
                      </Link>
                    );
                  } catch (e) {
                    return <Link to="/customer" onClick={() => setIsDropdownOpen(false)}>My Dashboard</Link>;
                  }
                })()}
                {/* Show customer-specific links only for customers */}
                {(() => {
                  try {
                    const token = localStorage.getItem("token");
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    const role = payload.role;
                    return role !== "farmer" && (
                      <>
                        <Link to="/my-orders" onClick={() => setIsDropdownOpen(false)}>My Orders</Link>
                        <Link to="/my-reviews" onClick={() => setIsDropdownOpen(false)}>My Reviews</Link>
                        <Link to="/cart" onClick={() => setIsDropdownOpen(false)}>My Cart</Link>
                        <Link to="/profile" onClick={() => setIsDropdownOpen(false)}>My Profile</Link>
                      </>
                    );
                  } catch (e) {
                    return null;
                  }
                })()}
                <hr />
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login/Signup for non-customer routes or when not logged in */}
      {!isCustomerRoute && !isLoggedIn && (
        <div className="header-auth">
          <Link to="/phone" className="auth-link login-link">
            <FaSignInAlt className="auth-icon" />
            <span>Login</span>
          </Link>
          <Link to="/signup" className="auth-link signup-link">
            <span>Sign Up</span>
          </Link>
        </div>
      )}

      {/* Account dropdown for logged in users on non-customer routes */}
      {!isCustomerRoute && isLoggedIn && (
        <div className="profile-dropdown" ref={dropdownRef}>
          <div className="profile-trigger" onClick={toggleDropdown}>
            <FaUserCircle className="icon user-icon" />
            <span className="user-label">Account</span>
          </div>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              {/* Role-based dashboard link */}
              {(() => {
                try {
                  const token = localStorage.getItem("token");
                  const payload = JSON.parse(atob(token.split(".")[1]));
                  const role = payload.role;
                  const dashboardPath = role === "farmer" ? "/farmer" : "/customer";
                  return (
                    <Link to={dashboardPath} onClick={() => setIsDropdownOpen(false)}>
                      Go to Dashboard
                    </Link>
                  );
                } catch (e) {
                  return <Link to="/customer" onClick={() => setIsDropdownOpen(false)}>Go to Dashboard</Link>;
                }
              })()}
              <hr />
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          )}
        </div>
      )}
    </header>
    
  );
  }

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="app-shell">
          <AppHeader />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<RoleSelect />} />
              <Route path="/phone" element={<PhoneInput />} />
              <Route path="/otp" element={<OtpVerify />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/customer" element={<RouteGuard allowedRole="customer"><CustomerDashboard /></RouteGuard>} />
              <Route path="/cart" element={<RouteGuard allowedRole="customer"><CartPage /></RouteGuard>} />
              <Route path="/checkout" element={<RouteGuard allowedRole="customer"><CheckoutPage /></RouteGuard>} />
              <Route path="/order-confirmation" element={<RouteGuard allowedRole="customer"><OrderConfirmation /></RouteGuard>} />
              <Route path="/farmer" element={<RouteGuard allowedRole="farmer"><FarmerDashboard /></RouteGuard>} />
              <Route path="/wishlist" element={<RouteGuard allowedRole="customer"><WishlistPage /></RouteGuard>} />
              <Route path="/my-orders" element={<RouteGuard allowedRole="customer"><MyOrders /></RouteGuard>} />
              <Route path="/profile" element={<RouteGuard allowedRole="customer"><ProfilePage /></RouteGuard>} />
              <Route path="/review" element={<RouteGuard allowedRole="customer"><ReviewPage /></RouteGuard>} />
              <Route path="/my-reviews" element={<RouteGuard allowedRole="customer"><MyReviews /></RouteGuard>} />
            </Routes>
          </main>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;

