import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-column">
            <h3>Company</h3>
            <ul className="footer-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Open Guidelines</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Brand Assets</a></li>
              <li><a href="#">Terms & Conditions</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Product</h3>
            <ul className="footer-links">
              <li><a href="#">Desktop App</a></li>
              <li><a href="#">iPhone App</a></li>
              <li><a href="#">Android App</a></li>
              <li><a href="#">Chrome Extension</a></li>
              <li><a href="#">Default Search</a></li>
              <li><a href="#">API</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Resources</h3>
            <ul className="footer-links">
              <li><a href="#">Getting Started</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Technical Docs</a></li>
              <li><a href="#">API Reference</a></li>
              <li><a href="#">Best Practices</a></li>
              <li><a href="#">Developer Guide</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Follow Us</h3>
            <ul className="footer-links">
              <li><a href="#">𝕏 (Twitter)</a></li>
              <li><a href="#">YouTube</a></li>
              <li><a href="#">Discord</a></li>
              <li><a href="#">LinkedIn</a></li>
              <li><a href="#">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-logo-section">
            <div className="logo-placeholder demo-placeholder">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="copyright">© Copyright 2025. Perplexity — Where Knowledge Begins</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;