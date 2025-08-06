import { useState, useRef, useEffect } from "react";
import styles from "./UserAvatar.module.css";
import { SettingsModal } from "./SettingsModal";

interface UserAvatarProps {
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);

  const toggleModal = () => {
    setIsModalOpen(prev => {
      const newValue = !prev;
      if (!newValue) {
        setIsHelpOpen(false);
      }
      return newValue;
    });
  };

  const hideModal = () => {
    setIsModalOpen(false);
    setIsHelpOpen(false);
  };

  const toggleHelpDropdown = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsHelpOpen(prev => !prev);
  };

  const signOut = () => {
    alert('Sign out clicked!');
    hideModal();
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    hideModal(); // Close the user menu when opening settings
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isModalOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        hideModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isModalOpen]);

  return (
    <>
      <div className={`${styles.avatarContainer} ${className}`}>
        <button
          ref={avatarRef}
          className={styles.avatarButton}
          onClick={toggleModal}
          title="User menu"
          aria-label="Open user menu"
        />
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={hideModal}>
          <div
            ref={modalRef}
            className={styles.userMenu}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.userProfile}>
              <div className={styles.avatar} />
              <div className={styles.userInfo}>
                <div className={styles.userName}>John Doe</div>
                <div className={styles.userEmail}>john.doe@example.com</div>
              </div>
            </div>

            <div className={styles.menuSection}>
              <a href="#" className={`${styles.menuItem} ${styles.upgradeItem}`}>
                <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upgrade to plan
              </a>
              <a href="#" className={styles.menuItem}>
                <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </a>
              <button className={styles.menuItem} onClick={openSettings}>
                <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <div className={`${styles.helpDropdown} ${isHelpOpen ? styles.active : ''}`}>
                <div className={styles.helpMainItem} onClick={toggleHelpDropdown}>
                  <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help
                  <svg className={styles.chevronIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className={styles.helpSubmenu}>
                  <a href="#" className={styles.menuItem}>
                    <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help center
                  </a>
                  <a href="#" className={styles.menuItem}>
                    <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Release notes
                  </a>
                  <a href="#" className={styles.menuItem}>
                    <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Terms & policies
                  </a>
                  <a href="#" className={styles.menuItem}>
                    <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Download apps
                  </a>
                  <a href="#" className={styles.menuItem}>
                    <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    Keyboard shortcuts
                  </a>
                </div>
              </div>
            </div>

            <div className={`${styles.menuSection} ${styles.signOut}`}>
              <button className={styles.menuItem} onClick={signOut}>
                <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </>
  );
};