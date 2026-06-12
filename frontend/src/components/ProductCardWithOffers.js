import React from 'react';
import { FaStar, FaHeart, FaRegHeart } from 'react-icons/fa';
import { getApplicableOffers, getProductRelatedOffers, calculateBestDiscount, formatValidUntil, OFFER_TYPES } from '../utils/offers';
import './ProductCardWithOffers.css';

const ProductCardWithOffers = ({ product, onAddToCart, onToggleFavorite, isFavorite, quantities = {}, onUpdateQty, onClick, offers = [] }) => {
  const quantity = Math.max(1, quantities[product._id] || 1);
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

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product, quantity);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    onToggleFavorite(product);
  };

  const handleUpdateQty = (e, delta) => {
    e.stopPropagation();
    onUpdateQty(product._id, delta);
  };

  const handleProductClick = () => {
    onClick(product);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`star ${i <= rating ? 'filled' : 'empty'}`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="product-card" onClick={handleProductClick}>
      {/* Product Image Section */}
      <div className="product-image-container">
        <img 
          src={`http://localhost:5000/uploads/${product.image}`} 
          alt={product.name} 
          className="product-image" 
        />
        
        {/* Offer Badge */}
        {showDiscountBadge && (
          <div className="offer-badge">
            <span className="discount-percent">{discountPercentage}%</span>
            <span className="discount-text">OFF</span>
          </div>
        )}
        
        {/* Favorite Button */}
        <button 
          className={`product-favorite-btn ${isFavorite ? 'active' : ''}`} 
          onClick={handleToggleFavorite}
          aria-label="Add to favorites"
        >
          {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>

      {/* Product Info Section */}
      <div className="product-info">
        {/* Header with Name and Unit */}
        <div className="product-header">
          <h3 className="product-name">{product.name}</h3>
          <span className="product-unit">{product.unit || '1 kg'}</span>
        </div>
        
        {/* Price Section */}
        <div className="price-section">
          {showDiscountBadge ? (
            <div className="discounted-pricing">
              <span className="current-price">₹{finalPrice.toFixed(2)}</span>
              <span className="original-price">₹{product.price}</span>
            </div>
          ) : (
            <span className="current-price">₹{product.price}</span>
          )}
        </div>
        
        {/* Rating */}
        <div className="rating-section">
          <div className="stars">
            {renderStars(Math.round(product.averageRating || 0))}
          </div>
          <span className="rating-text">
            {product.averageRating ? product.averageRating.toFixed(1) : '0.0'}
            {product.reviewCount > 0 && ` (${product.reviewCount})`}
          </span>
        </div>
        
        {/* Offer Details */}
        {hasOffer && (
          <div className="offer-section">
            <div className="offer-tags">
              {(applicableOffers.length > 0 ? applicableOffers : relatedOffers).slice(0, 2).map((offer, index) => (
                <span key={index} className="offer-tag">
                  {offer.type === 'near_expiry' ? 'Flash Sale' : 
                   offer.type === 'bulk_purchase' ? 'Bulk Deal' : 'Offer'}
                </span>
              ))}
            </div>
            {bestDiscount.offer && (
              <div className="offer-timer">
                <span className="timer-icon">⏰</span>
                <span className="timer-text">{formatValidUntil(bestDiscount.offer.validUntil)}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Stock Warning */}
        {applicableOffers.some(offer => offer.type === 'near_expiry') && (
          <div className="stock-alert">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">Limited time offer</span>
          </div>
        )}
        
        {/* Action Section */}
        <div className="action-section">
          <div className="quantity-control">
            <button 
              className="qty-btn minus" 
              onClick={(e) => handleUpdateQty(e, -1)}
              disabled={(quantities[product._id] || 1) <= 1}
            >
              −
            </button>
            <span className="qty-value">{quantities[product._id] || 1}</span>
            <button 
              className="qty-btn plus" 
              onClick={(e) => handleUpdateQty(e, 1)}
            >
              +
            </button>
          </div>
          
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            <span className="btn-icon"></span>
            <span className="btn-text">Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardWithOffers;
