import { useState } from "react";
import Login from "./PhoneInput";
import Signup from "./Signup";
import "./AuthPage.css";

function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="auth-container">
      
      {/* LEFT */}
      <div className="auth-left">
        <div className="form-box">

          {/* TOGGLE */}
          <div className="toggle-buttons">
            <button
              className={activeTab === "login" ? "toggle-active" : "toggle-inactive"}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>

            <button
              className={activeTab === "signup" ? "toggle-active" : "toggle-inactive"}
              onClick={() => setActiveTab("signup")}
            >
              Signup
            </button>
          </div>

          {/* FORM CONTENT */}
          <div className="form-content">
            {activeTab === "login" ? <Login /> : <Signup />}
          </div>

        </div>
      </div>

      {/* RIGHT */}
      <div className="auth-right">
        <img
          src="https://images.unsplash.com/photo-1615485290382-441e4d049cb5"
          alt="Vegetables"
        />
      </div>

    </div>
  );
}

export default AuthPage;
