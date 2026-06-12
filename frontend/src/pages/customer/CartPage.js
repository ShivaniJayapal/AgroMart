import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { FaArrowLeft, FaShoppingCart, FaTrash, FaHeart, FaMinus, FaPlus } from "react-icons/fa";
import { calculateCartOfferPricing, fetchAllOffers, getActiveFarmerOffers } from "../../utils/offers";
import "./CartPage.css";

function CartPage() {
  const {
    cartItems,
    loading,
    removeFromCart,
    updateQuantity,
    toggleFavorite,
    favorites,
    fetchCart,
  } = useCart();
  const navigate = useNavigate();

  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const offersData = await fetchAllOffers();
        setOffers(getActiveFarmerOffers(offersData));
      } catch (error) {
        console.error("Error loading cart offers:", error);
        setOffers([]);
      }
    };

    loadOffers();
  }, []);

  const validCartItems = useMemo(() => {
    return cartItems.filter(item => item.productId && item.quantity > 0);
  }, [cartItems]);

  const pricedCartItems = useMemo(() => {
    return calculateCartOfferPricing(offers, validCartItems);
  }, [validCartItems, offers]);

  const subtotal = useMemo(
    () => pricedCartItems.reduce((acc, item) => acc + item.pricing.total, 0),
    [pricedCartItems]
  );

  const totalDiscount = useMemo(
    () => pricedCartItems.reduce((acc, item) => acc + item.pricing.discount, 0),
    [pricedCartItems]
  );

  const discountedSubtotal = useMemo(
    () => pricedCartItems.reduce((acc, item) => acc + item.pricing.finalTotal, 0),
    [pricedCartItems]
  );

  const deliveryFee = useMemo(
    () => subtotal > 500 ? 0 : 50,
    [subtotal]
  );

  const tax = useMemo(
    () => discountedSubtotal * 0.05,
    [discountedSubtotal]
  );

  const total = useMemo(
    () => discountedSubtotal + deliveryFee + tax,
    [discountedSubtotal, deliveryFee, tax]
  );

  const handleQuantityChange = async (cartId, newQuantity, maxStock) => {
    if (newQuantity < 1 || newQuantity > maxStock) return;

    setUpdatingItems(prev => new Set(prev).add(cartId));
    try {
      await updateQuantity(cartId, newQuantity);
    } catch (err) {
      console.error("Failed to update quantity:", err);
      alert("Failed to update quantity. Please try again.");
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (cartId, productName) => {
    if (!window.confirm(`Remove ${productName} from cart?`)) return;

    setRemovingItems(prev => new Set(prev).add(cartId));
    try {
      await removeFromCart(cartId);
    } catch (err) {
      console.error("Failed to remove item:", err);
      alert("Failed to remove item. Please try again.");
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartId);
        return newSet;
      });
    }
  };

  // Create a memoized favorites lookup for better performance
  const favoritesLookup = useMemo(() => {
    const lookup = new Set();
    favorites.forEach(fav => lookup.add(fav._id));
    return lookup;
  }, [favorites]);

  const handleToggleFavorite = useCallback(async (product) => {
    try {
      await toggleFavorite(product);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      alert("Failed to update favorites. Please try again.");
    }
  }, [toggleFavorite]);

  const handleCheckout = () => {
    if (validCartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (discountedSubtotal < 100) {
      alert("Minimum order value is ₹100. Please add more items to proceed.");
      return;
    }

    navigate("/checkout");
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-loading">
          <FaShoppingCart className="loading-icon" />
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!validCartItems.length) {
    return (
      <div className="cart-container">
        <div className="cart-header">
          <button onClick={() => navigate("/customer")} className="back-btn">
            <FaArrowLeft /> Back to Shop
          </button>
          <h1 className="cart-title">My Cart</h1>
          <div></div>
        </div>

        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some fresh produce to get started!</p>
          <button className="shop-now-btn" onClick={() => navigate("/customer")}>
            <FaShoppingCart /> Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <button onClick={() => navigate("/customer")} className="back-btn">
          <FaArrowLeft /> Back to Shop
        </button>
        <h1 className="cart-title">My Cart</h1>
        <div></div>
      </div>

      <div className="cart-content">
        <div className="cart-items-section">
          <div className="cart-items-header">
            <h2 className="cart-items-title">Cart Items</h2>
            <span className="cart-items-count">{validCartItems.length}</span>
          </div>

          <div className="cart-items-list">
            {pricedCartItems.map((item) => {
              const product = item.productId;
              const inFavorites = favoritesLookup.has(product._id);
              const stock = Number(product?.quantity || 0);
              const isUpdating = updatingItems.has(item._id);
              const isRemoving = removingItems.has(item._id);

              // Skip rendering if product is not available
              if (!product) {
                return (
                  <div key={item._id} className="cart-item">
                    <div className="cart-item-details">
                      <div>
                        <h3 className="cart-item-name">Product Unavailable</h3>
                        <p className="cart-item-price">This item may have been removed</p>
                      </div>
                      <div className="cart-item-controls">
                        <div className="cart-item-actions">
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveItem(item._id, "Unavailable Product")}
                            disabled={isRemoving}
                            title="Remove from cart"
                          >
                            {isRemoving ? "..." : <FaTrash />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-image">
                    {product?.image ? (
                      <img
                        src={`http://localhost:5000/uploads/${product.image}`}
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                    ) : (
                      <div className="placeholder-img">No Image</div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <div>
                      <h3 className="cart-item-name">
                        {product?.name || "Product Unavailable"}
                      </h3>
                      <p className="cart-item-price">
                        {item.pricing.discount > 0 ? (
                          <>
                            ₹{item.pricing.finalUnitPrice.toFixed(2)} per {product?.unit || 'unit'}
                            {" "}
                            <span className="cart-item-original-price">
                              ₹{item.pricing.unitPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <>₹{item.pricing.unitPrice.toFixed(2)} per {product?.unit || 'unit'}</>
                        )}
                      </p>
                      <p className="cart-item-total">
                        Total: ₹{item.pricing.finalTotal.toFixed(2)} ({item.quantity} × ₹{item.pricing.finalUnitPrice.toFixed(2)})
                      </p>
                      {item.pricing.offer && (
                        <p className="cart-item-stock" style={{ color: "#166534", fontWeight: 600 }}>
                          Offer applied: {item.pricing.offer.title} | You save ₹{item.pricing.discount.toFixed(2)}
                        </p>
                      )}
                      {item.pricing.comboHint && (
                        <p className="cart-item-stock" style={{ color: "#7c3aed", fontWeight: 600 }}>
                          {item.pricing.comboHint}
                        </p>
                      )}
                    </div>

                    <div className="cart-item-controls">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item._id, item.quantity - 1, stock)}
                          disabled={item.quantity <= 1 || isUpdating}
                        >
                          <FaMinus />
                        </button>
                        <span className="quantity-display">
                          {isUpdating ? "..." : item.quantity}
                        </span>
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1, stock)}
                          disabled={item.quantity >= stock || isUpdating}
                        >
                          <FaPlus />
                        </button>
                      </div>

                      <div className="cart-item-actions">
                        <button
                          className={`favorite-btn ${inFavorites ? 'active' : ''}`}
                          onClick={() => handleToggleFavorite(product)}
                          title={inFavorites ? "Remove from favorites" : "Add to favorites"}
                        >
                          <FaHeart />
                        </button>
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveItem(item._id, product?.name)}
                          disabled={isRemoving}
                          title="Remove from cart"
                        >
                          {isRemoving ? "..." : <FaTrash />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cart-summary">
          <h3 className="summary-title">Order Summary</h3>

          <div className="summary-row">
            <span className="summary-label">Subtotal ({validCartItems.length} items)</span>
            <span className="summary-value">₹{isNaN(subtotal) ? "0.00" : subtotal.toFixed(2)}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="summary-row">
              <span className="summary-label">Offer Discount</span>
              <span className="summary-value" style={{ color: "#166534" }}>
                -₹{totalDiscount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="summary-row">
            <span className="summary-label">Delivery Fee</span>
            <span className="summary-value">
              {deliveryFee === 0 ? "FREE" : `₹${isNaN(deliveryFee) ? "0.00" : deliveryFee.toFixed(2)}`}
            </span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Tax (5%)</span>
            <span className="summary-value">₹{isNaN(tax) ? "0.00" : tax.toFixed(2)}</span>
          </div>

          <div className="summary-row summary-total">
            <span className="summary-label">Total</span>
            <span className="summary-value">₹{isNaN(total) ? "0.00" : total.toFixed(2)}</span>
          </div>

          <button className="checkout-btn" onClick={handleCheckout}>
            <FaShoppingCart /> Proceed to Checkout
          </button>

          {discountedSubtotal < 500 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '12px' }}>
              Add ₹{Math.max(0, 500 - subtotal).toFixed(2)} more for free delivery!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartPage;
