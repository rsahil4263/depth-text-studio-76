import React from 'react';
import './FeaturesGrid.css';

const FeaturesGrid = () => {
  return (
    <div className="features-grid-wrapper">
      <div className="container">
        <div className="header">
          <h1 className="title">
            <span className="title-accent">enterprise</span> security,<br />
            <span className="title-accent">real</span> protection
          </h1>
          <p className="subtitle">
            research smarter with real-time, cited insights for confident decisions—all backed with enterprise-grade security.
          </p>
          <div className="cta-buttons">
            <button className="btn-primary">
              get started 
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button className="btn-secondary">request a demo</button>
          </div>
        </div>

        <div className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                  <path d="M3 12c0 4.4 1.6 8 4 8s4-3.6 4-8-1.6-8-4-8-4 3.6-4 8z"/>
                  <path d="M21 12c0 4.4-1.6 8-4 8s-4-3.6-4-8 1.6-8 4-8 4 3.6 4 8z"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">SOC 2 Type II Certified</h3>
                <p className="feature-description">meets policies and strict path validation during planning and user systems and data centers</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Data privacy</h3>
                <p className="feature-description">we never store your data in LLMs or information submitted. customer traffic is protected and service compliant</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Configurable file retention</h3>
                <p className="feature-description">configure your best and provide perfect compliance including detailed file and page</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">User management</h3>
                <p className="feature-description">easily manage who can upload and download files and also wherever its needed</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10,17 15,12 10,7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">SSO + SCIM</h3>
                <p className="feature-description">easily leverage access via Perplexity while controlling your User lifecycle</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Enhanced visibility</h3>
                <p className="feature-description">track user activity with audit logs for compliance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesGrid;