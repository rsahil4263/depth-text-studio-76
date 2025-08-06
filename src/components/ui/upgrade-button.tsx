import React, { useState } from 'react';
import { UpgradeModal } from './upgrade-modal';

interface UpgradeButtonProps {
  onClick?: () => void;
  className?: string;
}

export const UpgradeButton: React.FC<UpgradeButtonProps> = ({ 
  onClick, 
  className = '' 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => {
      setIsPressed(false);
    }, 200);
    
    if (onClick) {
      onClick();
    } else {
      // Open the upgrade modal
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <div className={`upgrade-button-container ${className}`}>
        <button
          className={`upgrade-button ${isPressed ? 'pressed' : ''}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          type="button"
        >
          <span className="button-text">Upgrade to Plus</span>
        </button>
      
      <style jsx>{`
        .upgrade-button-container {
          width: 100%;
          margin-top: 16px;
        }

        .upgrade-button {
          width: 100%;
          padding: 12px;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          color: #1a1a1a;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          position: relative;
          overflow: hidden;
          touch-action: manipulation;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upgrade-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .upgrade-button:hover {
          background: #f5f5f5;
          border-color: #d4d4d4;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .upgrade-button:hover::before {
          left: 100%;
        }

        .upgrade-button:active {
          background: #e5e5e5;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .upgrade-button:focus-visible {
          outline: 2px solid #20B2AA;
          outline-offset: 2px;
        }

        @keyframes buttonPress {
          0% { transform: scale(1); }
          50% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }

        .upgrade-button.pressed {
          animation: buttonPress 0.2s ease-out;
        }

        .button-text {
          white-space: nowrap;
        }

        /* Responsive adjustments to match sidebar patterns */
        @media (max-width: 1023px) {
          .upgrade-button {
            padding: 14px;
            font-size: 16px;
            min-height: 48px;
          }
        }

        @media (max-width: 767px) {
          .upgrade-button {
            padding: 16px;
            font-size: 16px;
            min-height: 52px;
            border-radius: 10px;
          }
        }

        @media (max-width: 479px) {
          .upgrade-button {
            padding: 14px;
            font-size: 15px;
            min-height: 48px;
          }
        }
      `}</style>
      </div>
      
      <UpgradeModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};