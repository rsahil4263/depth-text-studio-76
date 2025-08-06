import React, { useEffect, useState } from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleUpgradeClick = (plan: string) => {
    console.log(`Upgrade to ${plan} clicked`);
    // Here you would implement the actual upgrade logic
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal-container ${isVisible ? 'visible' : ''}`}>
        <button className="close-button" onClick={handleClose}>
          ✕
        </button>

        <div className="header">
          <div className="tab-container">
            <button className="tab active">Personal</button>
          </div>
        </div>

        <div className="pricing-container">
          <div className="pricing-card">
            <h3 className="plan-name">Pro</h3>
            <div className="plan-price">$20.00</div>
            <div className="plan-billing">$16.67 when billed annually</div>
            <p className="plan-description">
              Upgrade productivity and learning with additional access.
            </p>
            <button 
              className="cta-button secondary-button"
              onClick={() => handleUpgradeClick('Pro')}
            >
              Your current plan
            </button>
            <ul className="features-list">
              <li className="feature-item">
                <div className="checkmark"></div>
                10x as many citations in answers
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Access to Perplexity Labs
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Unlimited file and photo uploads
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Extended access to Perplexity Research
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Extended access to Image generation
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                One subscription for all the latest AI models
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Exclusive access to Pro Perks
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                And much more
              </li>
            </ul>
            <div className="additional-info">
              Existing subscriber? See <a href="#" className="billing-link">billing help</a>
            </div>
          </div>

          <div className="pricing-card">
            <div className="popular-badge">Popular</div>
            <h3 className="plan-name">Max</h3>
            <div className="plan-price">$200.00</div>
            <div className="plan-billing">/ month</div>
            <p className="plan-description">
              Unlock Perplexity's full capabilities with early access to new products.
            </p>
            <button 
              className="cta-button primary-button"
              onClick={() => handleUpgradeClick('Max')}
            >
              Upgrade to Max
            </button>
            <ul className="features-list">
              <li className="feature-item">
                <div className="checkmark"></div>
                Everything in Pro
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Early access to Comet, the agentic browser
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Unlimited access to Perplexity Labs
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Unlimited access to Perplexity Research
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Use advanced AI models like OpenAI o3-pro and Anthropic Claude 4 Opus
              </li>
              <li className="feature-item">
                <div className="checkmark"></div>
                Priority support
              </li>
            </ul>
            <div className="additional-info">
              For personal use only, and subject to our{' '}
              <a href="#" className="policies-link">policies</a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem 1rem;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .modal-container {
          max-width: 800px;
          width: 100%;
          position: relative;
          background: rgba(25, 26, 26, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
          line-height: 1.5;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-container.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #9ca3af;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 400;
          transition: all 0.2s ease;
          z-index: 10;
          backdrop-filter: blur(10px);
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          transform: scale(1.05);
        }

        .close-button:active {
          transform: scale(0.95);
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .tab-container {
          display: flex;
          justify-content: center;
          gap: 0;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 3rem;
          backdrop-filter: blur(10px);
          animation: slideInFromBottom 0.6s ease-out 0.2s both;
        }

        .tab {
          padding: 12px 32px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .tab::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s;
        }

        .tab:hover::before {
          left: 100%;
        }

        .tab.active {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          transform: scale(1.02);
        }

        .pricing-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
          animation: slideInFromBottom 0.8s ease-out 0.4s both;
        }

        .pricing-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(20px);
          overflow: hidden;
        }

        .pricing-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(32, 201, 151, 0.1), transparent);
          transition: left 0.6s ease;
          z-index: 0;
        }

        .pricing-card:hover::before {
          left: 100%;
        }

        .pricing-card:hover {
          border-color: rgba(32, 201, 151, 0.4);
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(32, 201, 151, 0.2);
        }

        .pricing-card > * {
          position: relative;
          z-index: 1;
        }

        .popular-badge {
          position: absolute;
          top: -1px;
          right: -1px;
          background: rgba(32, 201, 151, 0.1);
          backdrop-filter: blur(8px);
          color: #20c997;
          padding: 6px 12px;
          border-radius: 0 16px 0 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-left: 1px solid rgba(32, 201, 151, 0.2);
          border-bottom: 1px solid rgba(32, 201, 151, 0.2);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .popular-badge::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(32, 201, 151, 0.05), rgba(23, 162, 184, 0.05));
          border-radius: 0 16px 0 12px;
          z-index: -1;
        }

        .pricing-card:hover .popular-badge {
          background: rgba(32, 201, 151, 0.15);
          color: #1db584;
          transform: scale(1.05);
        }

        .plan-name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
          animation: slideInFromBottom 0.6s ease-out 0.6s both;
        }

        .plan-price {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.25rem;
          background: linear-gradient(135deg, #ffffff, #e5e7eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: slideInFromBottom 0.6s ease-out 0.7s both;
        }

        .plan-billing {
          color: #9ca3af;
          font-size: 14px;
          margin-bottom: 1rem;
          animation: slideInFromBottom 0.6s ease-out 0.8s both;
        }

        .plan-description {
          color: #d1d5db;
          font-size: 15px;
          margin-bottom: 2rem;
          line-height: 1.6;
          animation: slideInFromBottom 0.6s ease-out 0.9s both;
        }

        .cta-button {
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
          animation: slideInFromBottom 0.6s ease-out 1s both;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .cta-button:active::before {
          width: 300px;
          height: 300px;
        }

        .primary-button {
          background: linear-gradient(135deg, #20c997, #17a2b8);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(32, 201, 151, 0.3);
        }

        .primary-button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px rgba(32, 201, 151, 0.5);
          background: linear-gradient(135deg, #1db584, #1596a5);
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .secondary-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .features-list {
          list-style: none;
          animation: slideInFromBottom 0.6s ease-out 1.2s both;
        }

        .feature-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
          color: #e5e7eb;
          opacity: 0;
          animation: slideInFromBottom 0.4s ease-out calc(1.3s + var(--delay, 0) * 0.1s) both;
        }

        .feature-item:nth-child(1) { --delay: 0; }
        .feature-item:nth-child(2) { --delay: 1; }
        .feature-item:nth-child(3) { --delay: 2; }
        .feature-item:nth-child(4) { --delay: 3; }
        .feature-item:nth-child(5) { --delay: 4; }
        .feature-item:nth-child(6) { --delay: 5; }
        .feature-item:nth-child(7) { --delay: 6; }
        .feature-item:nth-child(8) { --delay: 7; }

        .checkmark {
          width: 18px;
          height: 18px;
          background: rgba(32, 201, 151, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .feature-item:hover .checkmark {
          background: rgba(32, 201, 151, 0.25);
          transform: scale(1.1);
        }

        .checkmark::before {
          content: "✓";
          color: #20c997;
          font-size: 12px;
          font-weight: 600;
        }

        .additional-info {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 1rem;
        }

        .billing-link,
        .policies-link {
          color: #20c997;
          text-decoration: none;
        }

        .billing-link:hover,
        .policies-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .pricing-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .pricing-card {
            padding: 1.5rem;
          }

          .plan-price {
            font-size: 2rem;
          }

          .modal-container {
            margin: 1rem;
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};