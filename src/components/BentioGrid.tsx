import React from 'react';
import './BentioGrid.css';

const BentioGrid = () => {
  return (
    <>
      <div className="floating-dot"></div>
      <div className="floating-dot"></div>
      <div className="floating-dot"></div>
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">One reliable platform to search all your sources</h1>
          <div className="features-layout">
            {/* Large card - Internal knowledge */}
            <div className="feature-card large">
              <div className="feature-icon">
                <span className="demo-placeholder">[Demo Image: Internal Knowledge Dashboard]</span>
              </div>
              <h3 className="feature-title">Internal knowledge</h3>
              <p className="feature-description">
                Connect and access your data. Find deep insights across all your sources using Enterprise that help you make sense of everything. Your data always stays secure with end-to-end encryption and privacy controls.
              </p>
              <div className="loading-bar"></div>
            </div>

            {/* Small card top - External research */}
            <div className="feature-card small-top">
              <div className="feature-icon">
                <span className="demo-placeholder">[Demo Image: Web Research]</span>
              </div>
              <h3 className="feature-title">External research</h3>
              <p className="feature-description">
                Real-time access to the web. Get verified, comprehensive insights from authoritative sources around the internet rather than generalizations.
              </p>
              <div className="loading-bar"></div>
            </div>

            {/* Small card bottom - Premium data */}
            <div className="feature-card small-bottom">
              <div className="feature-icon">
                <span className="demo-placeholder">[Demo Image: Premium Analytics]</span>
              </div>
              <h3 className="feature-title">Premium data</h3>
              <p className="feature-description">
                Bring decisions with proprietary data. Internal and external sources from partnerships with professional data providers.
              </p>
              <div className="loading-bar"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BentioGrid;