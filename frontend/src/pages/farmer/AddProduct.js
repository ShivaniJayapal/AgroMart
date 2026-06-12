import React, { useState } from "react";
import axios from "axios";
import NotificationToast from "../../components/NotificationToast";
import "./AddProduct.css";

function AddProduct() {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    unit: "kg",
    description: "",
    category: "Vegetables",
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, title: "", message: "", type: "success" });

  const validateForm = () => {
    const tempErrors = {};

    if (!formData.name.trim()) tempErrors.name = "Product name is required.";
    else if (formData.name.length < 3) tempErrors.name = "Name must be at least 3 characters.";

    if (!formData.price || formData.price <= 0) tempErrors.price = "Price must be greater than 0.";

    if (!formData.quantity || formData.quantity <= 0) tempErrors.quantity = "Quantity must be at least 1.";

    if (!formData.description.trim()) tempErrors.description = "Please provide a short description.";

    if (!file) {
      tempErrors.file = "Please upload a product photo.";
    } else {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        tempErrors.file = "Only JPG, JPEG, and PNG are allowed.";
      } else if (file.size > 5 * 1024 * 1024) {
        tempErrors.file = "File size must be less than 5MB.";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("quantity", formData.quantity);
    data.append("unit", formData.unit);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("image", file);

    try {
      await axios.post("http://localhost:5000/api/products/add", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setToast({
        open: true,
        title: "Harvest posted",
        message: "Your product is now live in AgroMart inventory.",
        type: "success",
      });
      setIsSubmitting(false);
      setTimeout(() => {
        window.location.reload();
      }, 1400);
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        title: "Post failed",
        message: err.response?.data?.message || "Error adding product to server.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-wrapper">
      <NotificationToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
      <div className="form-card">
        <div className="form-header">
          <h3>List New Harvest</h3>
          <p>Provide accurate details for our customers</p>
        </div>

        <div className="form-body">
          <form onSubmit={handleSubmit} className="add-harvest-form">
            <div className={`input-field ${errors.name ? "error-border" : ""}`}>
              <label>Product Name</label>
              <input
                type="text"
                placeholder="e.g., Organic Basmati Rice"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="row-group">
              <div className="input-field flex-2">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains">Grains</option>
                  <option value="Dairy">Dairy</option>
                </select>
              </div>

              <div className={`input-field flex-1 ${errors.price ? "error-border" : ""}`}>
                <label>Price (Rs)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>
            </div>

            <div className={`input-field ${errors.quantity ? "error-border" : ""}`}>
              <label>Stock Quantity</label>
              <div className="unit-input-group">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
                <select
                  className="unit-selector"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="kg">per kg</option>
                  <option value="unit">per unit</option>
                  <option value="litre">per litre</option>
                  <option value="bundle">per bundle</option>
                </select>
              </div>
              {errors.quantity && <span className="error-text">{errors.quantity}</span>}
            </div>

            <div className={`input-field ${errors.description ? "error-border" : ""}`}>
              <label>Product Description</label>
              <textarea
                rows="3"
                placeholder="Describe the freshness..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>

            <div className={`input-field ${errors.file ? "error-border" : ""}`}>
              <label>Product Photo</label>
              <div className={`file-upload-box ${errors.file ? "box-error" : ""}`}>
                <input type="file" id="file" hidden onChange={(e) => setFile(e.target.files[0])} />
                <label htmlFor="file" className="upload-trigger">
                  <strong>{file ? "Image Ready" : "Click to Upload Image"}</strong>
                  <p className={errors.file ? "upload-meta upload-meta-error" : "upload-meta"}>
                    {file ? file.name : "PNG, JPG up to 5MB"}
                  </p>
                </label>
              </div>
              {errors.file && <span className="error-text">{errors.file}</span>}
            </div>

            <button type="submit" className="submit-form-btn" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Post to AgroMart"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
