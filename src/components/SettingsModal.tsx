import { useState, useRef, useEffect } from "react";
import styles from "./SettingsModal.module.css";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("general");
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && e.target === modalRef.current) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const toggleSwitch = (element: HTMLDivElement) => {
    element.classList.toggle(styles.active);
  };

  if (!isOpen) return null;

  return (
    <div ref={modalRef} className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>Settings</div>
          </div>
          
          <button 
            className={`${styles.navItem} ${activeTab === 'general' ? styles.active : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <svg className={styles.navIcon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            General
          </button>
          
          <button 
            className={`${styles.navItem} ${activeTab === 'text-behind' ? styles.active : ''}`}
            onClick={() => setActiveTab('text-behind')}
          >
            <svg className={styles.navIcon} fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            Text Behind Subject
          </button>
          
          <button 
            className={`${styles.navItem} ${activeTab === 'ai-agent' ? styles.active : ''}`}
            onClick={() => setActiveTab('ai-agent')}
          >
            <svg className={styles.navIcon} fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            AI Agent Mode
          </button>
          
          <button 
            className={`${styles.navItem} ${activeTab === 'file-management' ? styles.active : ''}`}
            onClick={() => setActiveTab('file-management')}
          >
            <svg className={styles.navIcon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
            </svg>
            File Management
          </button>
          
          <button 
            className={`${styles.navItem} ${activeTab === 'account' ? styles.active : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <svg className={styles.navIcon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Account
          </button>
        </div>

        <div className={styles.content}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>

          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className={`${styles.tabContent} ${styles.fadeIn}`}>
              <div className={styles.contentHeader}>
                <div className={styles.contentTitle}>General</div>
                <div className={styles.contentSubtitle}>Basic preferences that apply across the tool</div>
              </div>
              
              <div className={styles.settingSection}>
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Language</div>
                    <div className={styles.settingDescription}>Choose your preferred interface language</div>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.dropdown}>
                      <option>Auto-detect</option>
                      <option>English</option>
                      <option>Español</option>
                      <option>Français</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Theme</div>
                    <div className={styles.settingDescription}>Appearance preference</div>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.dropdown}>
                      <option>System</option>
                      <option>Dark</option>
                      <option>Light</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Show follow up suggestions</div>
                    <div className={styles.settingDescription}>Get suggested follow-up questions</div>
                  </div>
                  <div className={styles.settingControl}>
                    <div 
                      className={`${styles.toggle} ${styles.active}`}
                      onClick={(e) => toggleSwitch(e.currentTarget as HTMLDivElement)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Text Behind Subject Tab */}
          {activeTab === 'text-behind' && (
            <div className={`${styles.tabContent} ${styles.fadeIn}`}>
              <div className={styles.contentHeader}>
                <div className={styles.contentTitle}>Text Behind Subject</div>
                <div className={styles.contentSubtitle}>Configure text placement and styling options</div>
              </div>
              
              <div className={styles.settingSection}>
                <div className={styles.sectionTitle}>Text Style Presets</div>
                <div className={styles.presetGrid}>
                  <div className={`${styles.presetItem} ${styles.active}`}>Bold Sans</div>
                  <div className={styles.presetItem}>Script</div>
                  <div className={styles.presetItem}>Minimal</div>
                  <div className={styles.presetItem}>Retro</div>
                  <div className={styles.presetItem}>Modern</div>
                  <div className={styles.presetItem}>Custom</div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Shadow/Glow Effect</div>
                    <div className={styles.settingDescription}>Add depth with shadow or glow</div>
                  </div>
                  <div className={styles.settingControl}>
                    <div 
                      className={styles.toggle}
                      onClick={(e) => toggleSwitch(e.currentTarget as HTMLDivElement)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Agent Mode Tab */}
          {activeTab === 'ai-agent' && (
            <div className={`${styles.tabContent} ${styles.fadeIn}`}>
              <div className={styles.contentHeader}>
                <div className={styles.contentTitle}>AI Agent Mode</div>
                <div className={styles.contentSubtitle}>Configure the chat-based editing assistant</div>
              </div>
              
              <div className={styles.settingSection}>
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>AI Personality Style</div>
                    <div className={styles.settingDescription}>Communication tone</div>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.dropdown}>
                      <option>Friendly</option>
                      <option>Professional</option>
                      <option>Minimal</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Real-time Suggestions</div>
                    <div className={styles.settingDescription}>Get AI suggestions as you work</div>
                  </div>
                  <div className={styles.settingControl}>
                    <div 
                      className={`${styles.toggle} ${styles.active}`}
                      onClick={(e) => toggleSwitch(e.currentTarget as HTMLDivElement)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Management Tab */}
          {activeTab === 'file-management' && (
            <div className={`${styles.tabContent} ${styles.fadeIn}`}>
              <div className={styles.contentHeader}>
                <div className={styles.contentTitle}>File Management</div>
                <div className={styles.contentSubtitle}>Storage and export preferences</div>
              </div>
              
              <div className={styles.settingSection}>
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Default Save Format</div>
                    <div className={styles.settingDescription}>Export format for images</div>
                  </div>
                  <div className={styles.settingControl}>
                    <select className={styles.dropdown}>
                      <option>PNG</option>
                      <option>JPG</option>
                      <option>WEBP</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Cloud Sync</div>
                    <div className={styles.settingDescription}>Sync across devices</div>
                  </div>
                  <div className={styles.settingControl}>
                    <div 
                      className={styles.toggle}
                      onClick={(e) => toggleSwitch(e.currentTarget as HTMLDivElement)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className={`${styles.tabContent} ${styles.fadeIn}`}>
              <div className={styles.contentHeader}>
                <div className={styles.contentTitle}>Account</div>
                <div className={styles.contentSubtitle}>Manage your subscription and preferences</div>
              </div>
              
              <div className={styles.settingSection}>
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Current Plan</div>
                    <div className={styles.settingDescription}>Pro - 14 days left in trial</div>
                  </div>
                  <div className={styles.settingControl}>
                    <button className={styles.button}>Upgrade</button>
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Email</div>
                    <div className={styles.settingDescription}>user@example.com</div>
                  </div>
                  <div className={styles.settingControl}>
                    <button className={`${styles.button} ${styles.secondary}`}>Change</button>
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingName}>Delete Account</div>
                    <div className={styles.settingDescription}>Permanently delete your account and data</div>
                  </div>
                  <div className={styles.settingControl}>
                    <button className={`${styles.button} ${styles.secondary} ${styles.danger}`}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};