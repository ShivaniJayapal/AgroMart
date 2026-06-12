import { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaStar, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./ProfilePage.css";

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    address: {
      street: "",
      landmark: "",
      city: "",
      pincode: "",
    },
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await api.get("/users/profile", { headers });
        const user = response.data || {};

        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "customer",
          address: {
            street: user.address?.street || "",
            landmark: user.address?.landmark || "",
            city: user.address?.city || "",
            pincode: user.address?.pincode || "",
          },
        });
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess("");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await api.put(
        "/users/profile",
        {
          name: profile.name,
          address: profile.address,
        },
        { headers }
      );

      setSuccess("Profile updated successfully.");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-info-section">
          <div className="avatar-circle">
            <FaUserCircle />
          </div>
          <h2>{profile.name || "Customer Profile"}</h2>
          <span className="role-badge">{profile.role}</span>
        </div>

        <div className="address-section">
          <h3>
            <FaMapMarkerAlt /> Profile Details
          </h3>

          <div className="input-group">
            <label>Full Name</label>
            <input name="name" value={profile.name} onChange={handleProfileChange} />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input value={profile.email} readOnly />
          </div>

          <div className="input-group">
            <label>Phone</label>
            <input value={profile.phone} readOnly />
          </div>

          <div className="input-group">
            <label>Street</label>
            <input name="street" value={profile.address.street} onChange={handleAddressChange} />
          </div>

          <div className="input-group">
            <label>Landmark</label>
            <input name="landmark" value={profile.address.landmark} onChange={handleAddressChange} />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>City</label>
              <input name="city" value={profile.address.city} onChange={handleAddressChange} />
            </div>

            <div className="input-group">
              <label>Pincode</label>
              <input name="pincode" value={profile.address.pincode} onChange={handleAddressChange} />
            </div>
          </div>

          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
          {success && <p className="success-text">{success}</p>}
        </div>

        <div className="profile-actions">
          <button className="my-reviews-btn" onClick={() => navigate("/my-reviews")}>
            <FaStar /> My Reviews
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
