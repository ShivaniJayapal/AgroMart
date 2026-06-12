import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PhoneInput.css";

function PhoneInput() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) {
      setMessage("Phone number is required");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      //  SAVE PHONE HERE 
      localStorage.setItem("phone", phone);

      await api.post("/otp/request-otp", { phone });
      localStorage.setItem("otpSentAt", new Date().toISOString());

      navigate("/otp");

    } catch (err) {
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage("Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="form-box">
          <h2>Login with OTP</h2>

          <label>Phone Number</label>
          <input
            type="text"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <button className="signup-btn" onClick={handleSendOtp} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>

          {message && <p className="message">{message}</p>}

          <p className="message">
            New account? <a href="/signup">Signup</a>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <img
          src="https://plus.unsplash.com/premium_photo-1697730304904-2bdf66da8f2b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Login"
        />
      </div>
    </div>
  );
}

export default PhoneInput;
