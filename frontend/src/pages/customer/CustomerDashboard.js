import { useEffect, useState, useCallback } from "react";
import "./CustomerDashboard.css";
import api from "../../services/api";
import { useCart } from "../../context/CartContext";
import ProductDetailsModal from "../../components/ProductDetailsModal";
import OffersDisplay from "../../components/OffersDisplay";
import ProductCardWithOffers from "../../components/ProductCardWithOffers";
import NotificationToast from "../../components/NotificationToast";
import { fetchAllOffers, getActiveFarmerOffers } from "../../utils/offers";

function CustomerDashboard() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("none");
  const [quantities, setQuantities] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', message: '', type: 'success' });

  const { addToCart, toggleFavorite, favorites, loading } = useCart();
  const categories = [
    { 
      name: "All", 
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=64&h=64&fit=crop&crop=center"
    },
    { 
      name: "Vegetables", 
      image: "https://images.unsplash.com/photo-1566842600175-97dca489844f?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    { 
      name: "Fruits", 
      image: "https://plus.unsplash.com/premium_photo-1675237625753-c01705e314bb?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    { 
      name: "Grains", 
      image:"https://images.unsplash.com/photo-1561978248-bffcdd0457ad?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    { 
      name: "Dairy", 
      image: "https://plus.unsplash.com/premium_photo-1699292720983-725a6bb65d8a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
  ];

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get("/products/all");
      setProducts(res.data);
      const initialQtys = {};
      res.data.forEach(p => { initialQtys[p._id] = 1; });
      setQuantities(initialQtys);
    } catch (err) {
      console.error("Error fetching products", err);
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      const offersData = await fetchAllOffers();
      setOffers(getActiveFarmerOffers(offersData));
    } catch (error) {
      console.error("Error loading offers:", error);
      setOffers([]);
    }
  }, []);

  useEffect(() => { fetchProducts(); fetchOffers(); }, [fetchProducts, fetchOffers]);

  useEffect(() => {
    let filtered = products;
    if (activeCategory !== "All") filtered = filtered.filter((p) => p.category === activeCategory);
    if (searchTerm) filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortOption === "low-high") filtered = [...filtered].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortOption === "high-low") filtered = [...filtered].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    setFilteredProducts(filtered);
  }, [products, activeCategory, searchTerm, sortOption]);

  const handleFilter = (cat) => setActiveCategory(cat);

  const updateQty = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta) 
    }));
  };

  const showToast = ({ title, message, type = 'success' }) => {
    setToast({ open: true, title, message, type });
  };

  const closeToast = () => setToast(prev => ({ ...prev, open: false }));

  const handleAddToCart = async (product, requestedQuantity = 1) => {
    try {
      const quantity = Math.max(1, requestedQuantity);
      if (quantity > product.quantity) {
        showToast({
          title: 'Not enough stock',
          message: `Only ${product.quantity} ${product.unit || 'units'} available.`,
          type: 'error'
        });
        return;
      }
      await addToCart(product._id, quantity);
      showToast({
        title: 'Added to Cart',
        message: `${quantity} × ${product.name} added to your cart.`,
        type: 'success'
      });
    } catch (err) {
      console.error("Cart Error:", err);
      showToast({
        title: 'Add to Cart failed',
        message: 'Please try again shortly.',
        type: 'error'
      });
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  if (loading && products.length === 0) return <div className="loading-screen">Curating fresh produce...</div>;

  return (
    <div className="customer-container">
      <NotificationToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
      <header className="customer-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">Fresh Marketplace</h1>
            <p className="page-subtitle">Handpicked directly from local farms</p>
          </div>
          
          <div className="search-section">
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="search-input" 
              />
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)} 
                className="sort-select"
              >
                <option value="none">Sort by</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="categories-section">
          <h3 className="section-title">Categories</h3>
          <div className="filter-bar">
            {categories.map(cat => (
              <button 
                key={cat.name} 
                className={`filter-btn ${activeCategory === cat.name ? "active" : ""}`} 
                onClick={() => handleFilter(cat.name)}
              >
                <div className="category-icon">
                  <img src={cat.image} alt={cat.name} className="category-image" />
                </div>
                <span className="category-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="results-info">
          <span className="results-count">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
          </span>
        </div>
      </header>

      <div className="customer-main-content">
        {/* Offers Sidebar */}
        <OffersDisplay />

        {/* Products Section */}
        <div className="products-section">
          <div className="customer-products-grid">
            {filteredProducts.map(p => (
              <ProductCardWithOffers
                key={p._id}
                product={p}
                offers={offers}
                onAddToCart={handleAddToCart}
                onToggleFavorite={toggleFavorite}
                isFavorite={favorites.some(fav => fav?._id === p._id)}
                quantities={quantities}
                onUpdateQty={updateQty}
                onClick={handleProductClick}
              />
            ))}
          </div>
        </div>
      </div>
      
      {showModal && (
        <ProductDetailsModal 
          product={selectedProduct} 
          offers={offers}
          onClose={closeModal} 
        />
      )}
    </div>
  );
}

export default CustomerDashboard;
