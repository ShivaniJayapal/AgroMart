import React, { useState, useEffect } from 'react';
import api from '../services/api';
import NotificationToast from './NotificationToast';
import {
  createOffer,
  deleteOffer,
  fetchFarmerOffers,
  toggleOfferStatus,
  updateOffer,
} from '../utils/offers';
import './FarmerOffers.css';

const FarmerOffers = () => {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, title: '', message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    type: 'bulk_purchase',
    title: '',
    description: '',
    discount: 10,
    validUntil: '',
    applicableProducts: [],
    minQuantity: 1,
    unit: 'kg',
    discountType: 'percentage',
    priority: 'medium'
  });

  useEffect(() => {
    loadFarmerOffers();
    fetchFarmerProducts();
  }, []);

  const loadFarmerOffers = async () => {
    try {
      const farmerOffers = await fetchFarmerOffers();
      setOffers(farmerOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmerProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get('/products/my', { headers });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductToggle = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        applicableProducts: prev.applicableProducts.includes(productId)
          ? prev.applicableProducts.filter(p => p !== productId)
          : [...prev.applicableProducts, productId]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const offerData = {
        ...formData,
        validUntil: new Date(formData.validUntil).toISOString(),
        status: 'active'
      };

      if (editingOffer) {
        await updateOffer(editingOffer.id, offerData);
      } else {
        await createOffer(offerData);
      }

      resetForm();
      loadFarmerOffers();
      setToast({
        open: true,
        title: editingOffer ? 'Offer updated' : 'Offer created',
        message: editingOffer ? 'Your offer has been updated successfully.' : 'New offer is now active for customers.',
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving offer:', error);
      setToast({
        open: true,
        title: 'Save failed',
        message: error.response?.data?.message || error.message || 'Please try again.',
        type: 'error',
      });
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await deleteOffer(offerId);
        await loadFarmerOffers();
        setToast({
          open: true,
          title: 'Offer deleted',
          message: 'Your offer has been successfully removed.',
          type: 'success',
        });
      } catch (error) {
        console.error('Error deleting offer:', error);
        setToast({
          open: true,
          title: 'Delete failed',
          message: 'Please try again.',
          type: 'error',
        });
      }
    }
  };

  const handleToggleOfferStatus = async (offerId) => {
    try {
      await toggleOfferStatus(offerId);
      await loadFarmerOffers();
      setToast({
        open: true,
        title: 'Status updated',
        message: 'Offer status has been successfully updated.',
        type: 'success',
      });
    } catch (error) {
      console.error('Error toggling offer status:', error);
      setToast({
        open: true,
        title: 'Update failed',
        message: 'Please try again.',
        type: 'error',
      });
    }
  };

  const editOffer = (offer) => {
    setEditingOffer(offer);
    setFormData({
      type: offer.type,
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      validUntil: offer.validUntil.split('T')[0],
      applicableProducts: (offer.applicableProducts || []).map((item) => item._id || item),
      minQuantity: offer.minQuantity || 1,
      unit: offer.unit || 'kg',
      discountType: offer.discountType || 'percentage',
      priority: offer.priority || 'medium'
    });
    setShowOfferForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'bulk_purchase',
      title: '',
      description: '',
      discount: 10,
      validUntil: '',
      applicableProducts: [],
      minQuantity: 1,
      unit: 'kg',
      discountType: 'percentage',
      priority: 'medium'
    });
    setEditingOffer(null);
    setShowOfferForm(false);
  };

  const getOfferTypeLabel = (type) => {
    switch (type) {
      case 'near_expiry': return 'Near Expiry';
      case 'high_stock': return 'High Stock';
      case 'bulk_purchase': return 'Bulk Purchase';
      default: return 'Other';
    }
  };

  const getOfferTypeColor = (type) => {
    switch (type) {
      case 'near_expiry': return '#ef4444';
      case 'high_stock': return '#f59e0b';
      case 'bulk_purchase': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading your offers...</div>;
  }

  return (
    <div className="farmer-offers-container">
      <NotificationToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
      <div className="offers-header">
        <div className="offers-header-copy">
          <h1 className="page-title">My Offers</h1>
          <p className="page-subtitle">Create and manage special offers for your customers</p>
        </div>
        <button 
          className="create-offer-btn"
          onClick={() => setShowOfferForm(true)}
        >
          + Create New Offer
        </button>
      </div>

      {/* Offers List */}
      <div className="offers-list">
        {offers.length === 0 ? (
          <div className="no-offers">
            <div className="no-offers-icon">🎯</div>
            <h3>No offers yet</h3>
            <p>Create your first offer to attract more customers!</p>
            <button 
              className="create-first-offer-btn"
              onClick={() => setShowOfferForm(true)}
            >
              Create Your First Offer
            </button>
          </div>
        ) : (
          offers.map(offer => (
            <div key={offer.id} className="offer-card">
              <div className="offer-header">
                <div className="offer-type-badge" style={{ backgroundColor: getOfferTypeColor(offer.type) }}>
                  {getOfferTypeLabel(offer.type)}
                </div>
                <div className="offer-status">
                  <span className={`status-badge ${offer.status}`}>
                    {offer.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="offer-content">
                <h3 className="offer-title">{offer.title}</h3>
                <p className="offer-description">{offer.description}</p>
                
                <div className="offer-details">
                  <div className="discount-info">
                    <span className="discount-amount">
                      {offer.discountType === 'fixed' ? `₹${offer.discount}` : `${offer.discount}%`} OFF
                    </span>
                    {offer.minQuantity && (
                      <span className="min-quantity">Min. {offer.minQuantity} {offer.unit}</span>
                    )}
                  </div>
                  
                  <div className="validity-info">
                    <span className="valid-until">
                      Valid until: {new Date(offer.validUntil).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {offer.applicableProducts && offer.applicableProducts.length > 0 && (
                  <div className="applicable-products">
                    <span className="products-label">Products:</span>
                    <div className="product-tags">
                      {offer.applicableProducts.map((product, index) => (
                        <span key={index} className="product-tag">
                          {typeof product === 'object' ? product.name : product}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="offer-actions">
                <button 
                  className="edit-btn"
                  onClick={() => editOffer(offer)}
                >
                  Edit
                </button>
                <button 
                  className="toggle-btn"
                  onClick={() => handleToggleOfferStatus(offer.id)}
                >
                  {offer.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteOffer(offer.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Offer Form Modal */}
      {showOfferForm && (
        <div className="offer-form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="offer-form">
              <div className="form-section">
                <h3>Offer Details</h3>
                
                <div className="form-group">
                  <label>Offer Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} required>
                    <option value="bulk_purchase">Bulk Purchase</option>
                    <option value="near_expiry">Near Expiry</option>
                    <option value="high_stock">High Stock</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Offer Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Today Only – 20% off on Tomatoes"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your offer..."
                    rows={3}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Discount Type</label>
                    <select name="discountType" value={formData.discountType} onChange={handleInputChange}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Discount Amount</label>
                    <input 
                      type="number" 
                      name="discount" 
                      value={formData.discount}
                      onChange={handleInputChange}
                      min="1"
                      max={formData.discountType === 'percentage' ? "100" : ""}
                      placeholder={formData.discountType === 'percentage' ? "20" : "50"}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Valid Until</label>
                  <input 
                    type="date" 
                    name="validUntil" 
                    value={formData.validUntil}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleInputChange}>
                    <option value="high">High (Featured)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              
              {formData.type === 'bulk_purchase' && (
                <div className="form-section">
                  <h3>Bulk Purchase Details</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Minimum Quantity</label>
                      <input 
                        type="number" 
                        name="minQuantity" 
                        value={formData.minQuantity}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Unit</label>
                      <select name="unit" value={formData.unit} onChange={handleInputChange}>
                        <option value="kg">Kilograms</option>
                        <option value="pieces">Pieces</option>
                        <option value="dozens">Dozens</option>
                        <option value="liters">Liters</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="form-section">
                <h3>Applicable Products</h3>
                <div className="products-selection">
                  {products.map(product => (
                    <label key={product._id} className="product-checkbox">
                      <input 
                        type="checkbox"
                        checked={formData.applicableProducts.includes(product._id)}
                        onChange={() => handleProductToggle(product._id)}
                      />
                      <span>{product.name} - ₹{product.price}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingOffer ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerOffers;
