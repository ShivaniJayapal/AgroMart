import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./OtpVerify.css";

function OtpVerify() {
  const navigate = useNavigate();
  const phone = localStorage.getItem("phone");

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(300);

  const calculateCountdown = () => {
    const sentAt = localStorage.getItem("otpSentAt");
    if (!sentAt) return 0;

    const target = new Date(sentAt).getTime() + 5 * 60 * 1000;
    const secondsLeft = Math.ceil((target - Date.now()) / 1000);
    return secondsLeft > 0 ? secondsLeft : 0;
  };

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const initial = calculateCountdown();
    if (initial <= 0) {
      setResendDisabled(false);
      setCountdown(0);
      return;
    }

    setResendDisabled(true);
    setCountdown(initial);

    const interval = setInterval(() => {
      const secondsLeft = calculateCountdown();
      if (secondsLeft <= 0) {
        setResendDisabled(false);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(secondsLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleResend = async () => {
    if (!phone) {
      setMessage("Phone number is missing. Please start again.");
      return;
    }

    try {
      setResendLoading(true);
      setMessage("");

      await api.post("/otp/request-otp", { phone });
      const now = new Date().toISOString();
      localStorage.setItem("otpSentAt", now);
      setResendDisabled(true);
      setCountdown(300);
      setMessage("OTP resent successfully. Please check your phone.");
    } catch (err) {
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage("Failed to resend OTP");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp) {
      setMessage("OTP is required");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await api.post("/otp/verify-otp", {
        phone,
        otp,
      });

      const token = res.data.token;

      // Save token
      localStorage.setItem("token", token);

      // Decode role from JWT (simple decode)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload.role;

      if (role === "farmer") {
        navigate("/farmer");
      } else {
        navigate("/customer");
      }

    } catch (err) {
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage("OTP verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="form-box">
          <h2>Verify OTP</h2>

          <form onSubmit={handleVerify}>
            <label>Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
            />

            <button className="signup-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="signup-btn resend-btn"
              onClick={handleResend}
              disabled={resendDisabled || resendLoading}
            >
              {resendLoading
                ? "Resending..."
                : resendDisabled
                ? `Resend OTP in ${formatCountdown(countdown)}`
                : "Resend OTP"}
            </button>

            {message && <p className="message">{message}</p>}
          </form>
        </div>
      </div>

      <div className="auth-right">
        <img
          src="https://plus.unsplash.com/premium_photo-1678344150665-4678b1bb2e1d?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="OTP"
        />
      </div>
    </div>
  );
}

export default OtpVerify;
