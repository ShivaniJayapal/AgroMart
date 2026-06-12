import React, { useState, useEffect } from 'react';
import {
  fetchAllOffers,
  getActiveFarmerOffers,
  getOfferTypeColor,
  getOfferTypeLabel,
  formatValidUntil
} from '../utils/offers';
import './OffersDisplay.css';

const OffersDisplay = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const offersData = await fetchAllOffers();
        setOffers(getActiveFarmerOffers(offersData));
      } catch (error) {
        console.error('Error loading offers:', error);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  const farmerOffers = getActiveFarmerOffers(offers);

  if (farmerOffers.length === 0 && !loading) {
    return null;
  }

  const filteredOffers = selectedCategory === 'all'
    ? farmerOffers
    : farmerOffers.filter((offer) => offer.type === selectedCategory);

  const offerCategories = [
    { id: 'all', label: 'All Offers', icon: '' },
    { id: 'near_expiry', label: 'Flash Sales', icon: '' },
    { id: 'bulk_purchase', label: 'Bulk Deals', icon: '' },
    { id: 'high_stock', label: 'Clearance', icon: '' }
  ];

  if (loading) {
    return (
      <div className="offers-sidebar">
        <div className="offers-header">
          <h3 className="offers-title">Farmer Offers</h3>
        </div>
        <div className="offers-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="offers-sidebar">
      <div className="offers-header">
        <h3 className="offers-title">Farmer Offers</h3>
        <p className="offers-subtitle">Special deals from local farmers</p>
      </div>

      <div className="offers-categories">
        {offerCategories.map((category) => (
          <button
            key={category.id}
            className={`category-chip ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="chip-icon">{category.icon}</span>
            <span className="chip-label">{category.label}</span>
          </button>
        ))}
      </div>

      <div className="offers-list">
        {filteredOffers.map((offer) => {
          const productNames = (offer.applicableProducts || [])
            .map((product) => (typeof product === 'object' ? product.name : product))
            .filter(Boolean)
            .join(', ');

          return (
            <div key={offer.id} className="offer-item">
              <div className="offer-top-row">
                <div className="offer-type" style={{ backgroundColor: getOfferTypeColor(offer.type) }}>
                  {getOfferTypeLabel(offer.type)}
                </div>
                <div className="offer-discount-badge">
                  {offer.discountType === 'fixed' ? `Rs.${offer.discount}` : `${offer.discount}% off`}
                </div>
              </div>

              <div className="offer-content">
                <p className="offer-summary">
                  {productNames && <span className="offer-product-name">{productNames}</span>}
                  {productNames && offer.title && <span className="offer-summary-separator"> - </span>}
                  {offer.title && <span className="offer-title-inline">{offer.title}</span>}
                </p>

                <div className="offer-footer">
                  {offer.minQuantity && (
                    <div className="offer-requirement">
                      Min. {offer.minQuantity} {offer.unit || 'items'}
                    </div>
                  )}
                  <span className="offer-validity">{formatValidUntil(offer.validUntil)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OffersDisplay;
