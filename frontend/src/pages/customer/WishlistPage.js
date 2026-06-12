import React, { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaShoppingCart, FaArrowLeft, FaHeart } from "react-icons/fa";
import NotificationToast from "../../components/NotificationToast";
import "./WishlistPage.css";

function WishlistPage() {
  const { favorites, toggleFavorite, addToCart, loading } = useCart();
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState(null);
  const [toast, setToast] = useState({ open: false, title: '', message: '', type: 'success' });

  const closeToast = () => setToast(prev => ({ ...prev, open: false }));
  const showToast = ({ title, message, type = 'success' }) => {
    setToast({ open: true, title, message, type });
  };

  // Filter out any null or broken product references before rendering
  const validFavorites = favorites.filter(product => product !== null && product !== undefined);

  const handleMoveToCart = async (product) => {
    if (!product?._id) return;

    setAddingToCart(product._id);
    try {
      await addToCart(product._id, 1);
      // Remove from wishlist after successfully adding to cart
      await toggleFavorite(product);
      showToast({
        title: 'Added to Cart',
        message: `${product.name} has been moved to your cart.`,
        type: 'success'
      });
    } catch (err) {
      console.error("Failed to add to cart:", err);
      showToast({
        title: 'Add to Cart failed',
        message: 'Please try again later.',
        type: 'error'
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const handleRemoveFromWishlist = async (product) => {
    if (!product?._id) return;

    try {
      await toggleFavorite(product);
      showToast({
        title: 'Removed from Wishlist',
        message: `${product.name} was removed from your wishlist.`,
        type: 'success'
      });
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
      showToast({
        title: 'Removal failed',
        message: 'Please try again later.',
        type: 'error'
      });
    }
  };

  if (loading && validFavorites.length === 0) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-loading">
          <FaHeart className="loading-icon" />
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (

    <div className="wishlist-container">
      <NotificationToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
      <div className="wishlist-header">
        <button onClick={() => navigate("/customer")} className="back-btn">
          <FaArrowLeft /> Back to Shop
        </button>
        <h1 className="wishlist-title">
          My Wishlist
          <span className="wishlist-count">{validFavorites.length}</span>
        </h1>
        <div></div> {/* Spacer for flex layout */}
      </div>

      <div className="wishlist-content">
        {validFavorites.length > 0 ? (
          <div className="wishlist-grid">
            {validFavorites.map((product) => (
              <div key={product._id} className="wishlist-card">
                <div className="wishlist-img-box">
                  <img
                    src={`http://localhost:5000/uploads/${product?.image}`}
                    alt={product?.name}
                    onError={(e) => {
                      e.target.src = "/placeholder-image.png";
                    }}
                  />
                </div>
                <div className="wishlist-info">
                  <h3 className="wishlist-product-name">
                    {product?.name || "Product Unavailable"}
                  </h3>
                  <p className="wishlist-price">
                    ₹{product?.price || 0}
                  </p>
                  <p className="wishlist-unit">
                    per {product?.unit || 'unit'}
                  </p>
                  <div className="wishlist-actions">
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleMoveToCart(product)}
                      disabled={addingToCart === product._id}
                    >
                      <FaShoppingCart />
                      {addingToCart === product._id ? "Adding..." : "Add to Cart"}
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFromWishlist(product)}
                      title="Remove from wishlist"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-wishlist">
            <div className="empty-icon">💚</div>
            <h3>Your wishlist is empty</h3>
            <p>Save items you love to buy them later!</p>
            <button className="shop-now-btn" onClick={() => navigate("/customer")}>
              <FaShoppingCart /> Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WishlistPage;