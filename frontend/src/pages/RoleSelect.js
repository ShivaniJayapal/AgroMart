import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RoleSelect.css";
import backgroundImg from "../assets/background.png";

function RoleSelect() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");

  useEffect(() => {
    const revealItems = document.querySelectorAll(".reveal-item");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleContinue = () => {
    if (!role) {
      alert("Please select a role");
      return;
    }
    localStorage.setItem("role", role);
    navigate("/phone");
  };

  return (
    <div
      className="landing-wrapper"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
      }}
    >
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text-container">
            <div className="logo-group">
              
              <span className="logo-slogan">Harvesting Innovation, Straight to Your Door</span>
            </div>

            <h1>
              Nature’s <span>Bounty</span> <br />
              Delivered <strong>Fresh</strong>
            </h1>
            <p>
              Experience the purest farm to table journey. We bridge the gap 
              between rural soil and urban souls with 100% transparency.
            </p>

            <div className="selection-pill-box">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="role-dropdown"
              >
                <option value="">Identify yourself...</option>
                <option value="farmer">I am a Farmer</option>
                <option value="customer">I am a Customer</option>
              </select>
              <button className="cta-button" onClick={handleContinue}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="about-deco-layer"></div>
        <div className="about-container">
          <div className="section-header reveal-item">
            <h2>About Us</h2>
            <p>Revolutionizing agriculture through technology and transparency</p>
          </div>

          <div className="story-section">
            <div className="story-content reveal-item">
              <h3>The Core Story</h3>
              <p>
                AgroMart was born from a simple yet powerful vision: to bridge the gap between farmers and consumers,
                eliminating unnecessary intermediaries and ensuring fair compensation for hard-working agricultural communities.
                We believe in creating a sustainable ecosystem where quality food reaches your table while farmers thrive.
              </p>
            </div>
            <div className="story-image reveal-item reveal-delay-1">
              <img
                src="https://plus.unsplash.com/premium_photo-1661833262194-af73a8905821?q=80&w=1122&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Agricultural landscape"
              />
            </div>
          </div>

          <div className="problem-section">
            <div className="problem-image reveal-item reveal-delay-2">
              <img
                src="https://images.unsplash.com/photo-1746106388675-4a5cb72db549?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Farmers working"
              />
            </div>
            <div className="problem-content reveal-item reveal-delay-3">
              <h3>The Problem We Solve</h3>
              <p>
                Traditional agricultural supply chains are plagued by inefficiencies, lack of transparency, and unfair practices
                that hurt both farmers and consumers. Middlemen take significant cuts, food loses freshness through multiple
                handling points, and farmers often receive inadequate compensation for their labor.
              </p>
            </div>
          </div>

          <div className="comparison-section reveal-item reveal-delay-4">
            <h3>The Traditional Way vs The AgroMart Way</h3>
            <div className="comparison-grid">
              <div className="comparison-card traditional-card">
                <div className="card-header">
                  <h4>The Traditional Way</h4>
                  <div className="card-icon"></div>
                </div>
                <ul>
                  <li><strong>Middlemen:</strong> Up to 60% of your money goes to transporters and wholesalers.</li>
                  <li><strong>Unknown Origin:</strong> Food travels through multiple warehouses; freshness is lost.</li>
                  <li><strong>Opaque Pricing:</strong> Farmers are often underpaid and exploited by market fluctuations.</li>
                </ul>
                <div className="card-image">
                  <img
                    src="https://plus.unsplash.com/premium_photo-1663090106056-bbb60d2be552?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Traditional supply chain"
                  />
                </div>
              </div>

              <div className="comparison-card agromart-card">
                <div className="card-header">
                  <h4>The AgroMart Way</h4>
                  <div className="card-icon"></div>
                </div>
                <ul>
                  <li><strong>Direct Access:</strong> Your money goes directly to the farmer who set the price.</li>
                  <li><strong>Fresh Harvest:</strong> Harvesting begins only after you place your order.</li>
                  <li><strong>Fair Trade:</strong> Farmers have 100% control over their pricing and inventory.</li>
                </ul>
                <div className="card-image">
                  <img
                    src="https://plus.unsplash.com/premium_photo-1661833262194-af73a8905821?q=80&w=1122&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Direct farm to table"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip and Footer remain the same */}
      <section className="trust-strip">
        <div className="trust-card">
          <div className="img-wrapper">
            <img src="https://media.istockphoto.com/id/998461732/photo/free-delivery.jpg?s=1024x1024&w=is&k=20&c=9PF8ZygCqyX_qKjE2N4Au6XXfBSUr4MRIyQxtvouwMI=" alt="Delivery" />
          </div>
          <div className="trust-text">
            <h4>Free Delivery</h4>
            <p>Zero cost shipping</p>
          </div>
        </div>

        <div className="trust-card">
          <div className="img-wrapper">
            <img src="https://plus.unsplash.com/premium_photo-1677093906007-9938de41bcde?q=80&w=627&auto=format&fit=crop" alt="Payments" />
          </div>
          <div className="trust-text">
            <h4>Secure Payment</h4>
            <p>SSL Encrypted</p>
          </div>
        </div>

        <div className="trust-card">
          <div className="img-wrapper">
            <img src="https://media.istockphoto.com/id/914906098/photo/young-woman-harvesting-home-grown-lettuce.jpg?s=1024x1024&w=is&k=20&c=uDW3DTN2dXdeGd0k0Fj_5x12MBjRb-dA0TFeY_dxR-U=" alt="Harvest" />
          </div>
          <div className="trust-text">
            <h4>Fresh Harvest</h4>
            <p>Direct from farm</p>
          </div>
        </div>
      </section>

      <footer className="footer-v2">
        <div className="footer-inner">
          <div className="footer-brand-side">
            <h2 className="footer-logo">Agro<span>Mart</span></h2>
            <p>Empowering local agriculture through digital innovation and fair-trade systems.</p>
            <div className="social-links-v3">
              <Link to="#!">Facebook</Link>
              <Link to="#!">Instagram</Link>
              <Link to="#!">LinkedIn</Link>
            </div>
          </div>

          <div className="footer-links-side">
            <div className="footer-col">
              <h5>Platform</h5>
              <Link to="#!">Marketplace</Link>
              <Link to="#!">Farmer Hub</Link>
            </div>
            <div className="footer-col">
              <h5>Resources</h5>
              <Link to="#!">Farmer Blog</Link>
              <Link to="#!">Help Center</Link>
            </div>
            <div className="footer-col">
              <h5>Legal</h5>
              <Link to="#!">Privacy Policy</Link>
              <Link to="#!">Terms</Link>
            </div>
          </div>
        </div>
        <div className="footer-copyright">
          <p>&copy; 2026 AgroMart Digital. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default RoleSelect;