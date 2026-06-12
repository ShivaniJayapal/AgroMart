import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) {
      setFormData((prev) => ({ ...prev, role: savedRole }));
    }
  }, []);

  // --- STRICTOR VALIDATION LOGIC ---
  const validateForm = () => {
    let tempErrors = {};
    
    // 1. Email: No capitals, must have @, must end with gmail.com
    // Regex breakdown: ^[a-z0-9._%+-]+ -> lowercase/numbers, @gmail\.com$ -> specific domain
    const gmailRegex = /^[a-z0-9._%+-]+@gmail\.com$/;
    
    // 2. Phone: Exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.name.trim()) {
      tempErrors.name = "Full name is required";
    }

    if (!formData.email) {
      tempErrors.email = "Email is required";
    } else if (/[A-Z]/.test(formData.email)) {
      tempErrors.email = "Email must not contain capital letters";
    } else if (!gmailRegex.test(formData.email)) {
      tempErrors.email = "Please enter a valid @gmail.com address";
    }

    if (!formData.phone) {
      tempErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      tempErrors.phone = "Phone number must be exactly 10 digits";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Feature: Auto-convert email to lowercase as the user types
    if (e.target.name === "email") {
      value = value.toLowerCase();
    }

    setFormData({
      ...formData,
      [e.target.name]: value,
    });

    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage("");

      const response = await api.post("/auth/signup", formData);
      setMessage(response.data.message || "Signup successful!");

      setTimeout(() => {
        navigate("/phone");
      }, 1500);

    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="form-box">
          <h2>Create an Account</h2>

          <form onSubmit={handleSubmit} noValidate>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              className={errors.name ? "input-error" : ""}
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}

            <label>Email Address</label>
            <input
              type="email"
              name="email"
              className={errors.email ? "input-error" : ""}
              placeholder="example@gmail.com (lowercase only)"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}

            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              maxLength="10"
              className={errors.phone ? "input-error" : ""}
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}

            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="customer">Customer</option>
              <option value="farmer">Farmer</option>
            </select>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </button>

            {message && <p className={`message ${message.includes("failed") ? "error" : "success"}`}>{message}</p>}
          </form>
        </div>
      </div>

      <div className="auth-right">
        <img
          src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1170&auto=format&fit=crop"
          alt="AgroMart"
        />
      </div>
    </div>
  );
}

export default Signup;