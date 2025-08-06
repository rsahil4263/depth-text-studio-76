import React from 'react';
import './FeaturesBenefits.css';

const FeaturesBenefits = () => {
  return (
    <div className="features-benefits-wrapper">
      <div className="background-container"></div>
      <div className="container">
        <div className="header">
          <h1 className="headline">
            Answers to power decisions with accuracy <span className="accent">and</span> speed.
          </h1>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 className="feature-title">Complete in-depth research in minutes</h3>
            <p className="feature-description">
              Get precise answers with citations and peer-reviewed literature. Synthesize complex topics and verify facts with confidence using academic sources.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 className="feature-title">Visualize and QA your data</h3>
            <p className="feature-description">
              Turn data into charts and uncover key insights and patterns. QA your work through interactive visualizations and validate critical assumptions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 className="feature-title">Access all the best AI models</h3>
            <p className="feature-description">
              Seamlessly use top AI models like Claude-3.5 Sonnet, GPT-4o, and others for 10x research capabilities across all topics and domains.
            </p>
          </div>
        </div>

        <div className="cta-section">
          <p className="cta-text">Use Perplexity as your dedicated research analyst.</p>
          <button className="cta-button">
            get started
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturesBenefits;