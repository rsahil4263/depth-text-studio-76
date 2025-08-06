import React from 'react';
import './CTA.css';

const CTA = () => {
  return (
    <div className="cta-wrapper">
      <div className="cta-container">
        <div className="breadcrumb">
          <div className="breadcrumb-icon"></div>
          <span>Get started</span>
        </div>
        
        <h1 className="main-heading">Start building with Launch UI</h1>
        
        <p className="subtitle">
          Get started with Launch UI and build your landing page in no time with powerful components and clean design
        </p>
        
        <button className="cta-button">
          <div className="button-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          Get Started
        </button>
        
        <div className="features-hint">
          <div className="feature-item">
            <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            <span>No setup required</span>
          </div>
          
          <div className="feature-item">
            <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <span>5 min deployment</span>
          </div>
          
          <div className="feature-item">
            <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.03"/>
            </svg>
            <span>Free to start</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTA;