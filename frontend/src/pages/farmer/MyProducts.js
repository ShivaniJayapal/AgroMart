import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Masonry from "react-masonry-css";
import NotificationToast from "../../components/NotificationToast";
import "./MyProducts.css";

function MyProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState({ open: false, title: "", message: "", type: "success" });
  
  // ADDED: 'unit' to the edit state
  const [editData, setEditData] = useState({ 
    id: "", 
    name: "", 
    price: "", 
    quantity: "", 
    unit: "kg", 
    category: "Vegetables",
    image: null
  });

  const categories = ["All", "Vegetables", "Fruits", "Grains", "Dairy"];
  const token = localStorage.getItem("token");

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products", err);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let filtered = products;
    if (activeCategory !== "All") {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }
    setFilteredProducts(filtered);
  }, [products, activeCategory]);

  const handleFilter = (cat) => setActiveCategory(cat);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this product?")) {
      try {
        await axios.delete(`http://localhost:5000/api/products/delete/${id}`, { // Fixed path to match your controller
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(prev => prev.filter((p) => p._id !== id));
        setToast({
          open: true,
          title: "Product removed",
          message: "Harvest item has been removed from your inventory.",
          type: "success",
        });
      } catch (err) {
        console.error("Delete Error:", err.response?.data || err.message);
        setToast({
          open: true,
          title: "Remove failed",
          message: err.response?.data?.message || "Please try again.",
          type: "error",
        });
      }
    }
  };

  const openEditModal = (product) => {
    setEditData({
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      unit: product.unit || "kg", // Ensure unit is captured
      category: product.category || "Vegetables",
      image: null
    });
    setIsEditing(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('price', editData.price);
      formData.append('quantity', editData.quantity);
      formData.append('unit', editData.unit);
      formData.append('category', editData.category);
      if (editData.image) {
        formData.append('image', editData.image);
      }

      const response = await axios.put(
        `http://localhost:5000/api/products/update/${editData.id}`, 
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        }
      );

      if (response.data) {
        setIsEditing(false);
        fetchProducts(); 
        setToast({
          open: true,
          title: "Product updated",
          message: "Your harvest listing is now updated successfully.",
          type: "success",
        });
      }
    } catch (err) {
      setToast({
        open: true,
        title: "Update failed",
        message: err.response?.data?.message || "Please try again.",
        type: "error",
      });
    }
  };

  if (loading) return <div className="loading-text">Fetching your harvest...</div>;

  return (
    <div className="my-products-wrapper">
      <NotificationToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
      <div className="inventory-header">
        <h3>My Inventory</h3>
        <p>{products.length} products live on AgroMart</p>
      </div>

      <div className="filter-bar">
        {categories.map(cat => (
          <button key={cat} className={`filter-btn ${activeCategory === cat ? "active" : ""}`} onClick={() => handleFilter(cat)}>{cat}</button>
        ))}
      </div>

      <Masonry
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
        breakpointCols={{ default: 5, 1500: 4, 1100: 3, 760: 2, 520: 1 }}
      >
        {filteredProducts.map((p) => (
          <div key={p._id} className="item-card">
            <div className="image-container">
              {p.image ? (
                <img src={`http://localhost:5000/uploads/${p.image}`} alt={p.name} />
              ) : (
                <div className="placeholder-img">No Image</div>
              )}
            </div>

            <div className="card-details">
              <h4>{p.name}</h4>
              <div className="info-row">
                <span className="price-tag">₹{p.price} / {p.unit}</span>
                <span className="qty-tag">Stock: {p.quantity} {p.unit}</span>
              </div>
              
              <div className="action-row">
                <button className="edit-btn" onClick={() => openEditModal(p)}>Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(p._id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </Masonry>

      {isEditing && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h4>Update Harvest</h4>
              <button className="close-x" onClick={() => setIsEditing(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="edit-form">
              <div className="edit-field">
                <label>Product Name</label>
                <input 
                  type="text" 
                  value={editData.name} 
                  onChange={(e) => setEditData({...editData, name: e.target.value})} 
                />
              </div>

              <div className="row-group"> {/* Styled Row */}
                <div className="edit-field flex-2">
                  <label>Category</label>
                  <select 
                    value={editData.category} 
                    onChange={(e) => setEditData({...editData, category: e.target.value})}
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains</option>
                    <option value="Dairy">Dairy</option>
                  </select>
                </div>
                <div className="edit-field flex-1">
                   <label>Unit</label>
                   <select 
                    value={editData.unit} 
                    onChange={(e) => setEditData({...editData, unit: e.target.value})}
                  >
                    <option value="kg">kg</option>
                    <option value="unit">unit</option>
                    <option value="litre">litre</option>
                    <option value="bundle">bundle</option>
                  </select>
                </div>
              </div>

              <div className="edit-field">
                <label>Price (₹)</label>
                <input 
                  type="text" 
                  value={editData.price} 
                  onChange={(e) => setEditData({...editData, price: e.target.value})} 
                />
              </div>

              <div className="edit-field">
                <label>Stock Quantity</label>
                <input 
                  type="text" 
                  value={editData.quantity} 
                  onChange={(e) => setEditData({...editData, quantity: e.target.value})} 
                />
              </div>

              <div className="edit-field">
                <label>Update Image (optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setEditData({...editData, image: e.target.files[0]})} 
                />
              </div>

              <button type="submit" className="save-changes-btn">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProducts;
