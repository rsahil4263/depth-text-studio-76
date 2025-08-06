import { useEffect } from 'react';
import '../styles/new-landing.css';

const NewLanding = () => {

  useEffect(() => {
    // Header scroll effect
    const header = document.getElementById('header');
    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
      lastScrollY = currentScrollY;
    };

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const toggleIcon = document.getElementById('toggleIcon');

    const handleMobileToggle = () => {
      mobileMenu?.classList.toggle('active');
      if (toggleIcon) {
        toggleIcon.textContent = mobileMenu?.classList.contains('active') ? '✕' : '☰';
      }
    };

    // Close mobile menu when clicking outside
    const handleOutsideClick = (e: Event) => {
      if (!mobileToggle?.contains(e.target as Node) && !mobileMenu?.contains(e.target as Node)) {
        mobileMenu?.classList.remove('active');
        if (toggleIcon) {
          toggleIcon.textContent = '☰';
        }
      }
    };

    // Active link handling
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const handleNavClick = (e: Event) => {
      e.preventDefault();
      const link = e.target as HTMLElement;
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      // Add active class to clicked link
      link.classList.add('active');
      // Close mobile menu if open
      mobileMenu?.classList.remove('active');
      if (toggleIcon) {
        toggleIcon.textContent = '☰';
      }
    };

    // Smooth scrolling for anchor links
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(target.getAttribute('href')!);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    // Intersection Observer for scroll animations
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      elements.forEach(element => {
        observer.observe(element);
      });

      return () => observer.disconnect();
    };

    // FAQ Toggle functionality
    const initFAQ = () => {
      const faqItems = document.querySelectorAll('.faq-item');
      faqItems.forEach(item => {
        const question = item.querySelector('.faq-question') as HTMLElement;
        const answer = item.querySelector('.faq-answer') as HTMLElement;
        const toggle = item.querySelector('.faq-toggle') as HTMLElement;

        // Initially hide all answers
        answer.style.display = 'none';

        question.addEventListener('click', () => {
          const isOpen = answer.style.display === 'block';

          // Close all other answers
          faqItems.forEach(otherItem => {
            const otherAnswer = otherItem.querySelector('.faq-answer') as HTMLElement;
            const otherToggle = otherItem.querySelector('.faq-toggle') as HTMLElement;
            otherAnswer.style.display = 'none';
            otherToggle.style.transform = 'rotate(0deg)';
            otherToggle.textContent = '+';
          });

          // Toggle current answer
          if (!isOpen) {
            answer.style.display = 'block';
            toggle.style.transform = 'rotate(45deg)';
            toggle.textContent = '×';
          }
        });
      });
    };

    // Counter animation for stats
    const animateCounters = () => {
      const counters = document.querySelectorAll('.stat-number');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const counter = entry.target as HTMLElement;
            const target = counter.textContent!;
            const targetValue = parseInt(target.replace(/[^\d]/g, ''));
            const suffix = target.replace(/[\d]/g, '');
            let current = 0;
            const increment = targetValue / 50;

            const timer = setInterval(() => {
              current += increment;
              if (current >= targetValue) {
                counter.textContent = target;
                clearInterval(timer);
              } else {
                counter.textContent = Math.floor(current) + suffix;
              }
            }, 30);

            observer.unobserve(counter);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(counter => observer.observe(counter));
      return () => observer.disconnect();
    };

    // Video play button functionality
    const initVideoDemo = () => {
      const videoContainer = document.querySelector('.video-container');
      const playButton = document.querySelector('.video-play-button') as HTMLElement;

      if (videoContainer && playButton) {
        videoContainer.addEventListener('click', () => {
          // Add a subtle animation when clicked
          playButton.style.transform = 'scale(0.95)';
          setTimeout(() => {
            playButton.style.transform = 'scale(1.1)';
          }, 150);

          // You can replace this with actual video modal/popup logic
          console.log('Video demo clicked - integrate with your video player');
        });
      }
    };



    // Add event listeners
    window.addEventListener('scroll', handleScroll);
    mobileToggle?.addEventListener('click', handleMobileToggle);
    document.addEventListener('click', handleOutsideClick);
    navLinks.forEach(link => {
      link.addEventListener('click', handleNavClick);
    });
    document.addEventListener('click', handleAnchorClick);

    // Initialize all functionality
    const cleanupAnimations = animateOnScroll();
    initFAQ();
    const cleanupCounters = animateCounters();
    initVideoDemo();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      mobileToggle?.removeEventListener('click', handleMobileToggle);
      document.removeEventListener('click', handleOutsideClick);
      navLinks.forEach(link => {
        link.removeEventListener('click', handleNavClick);
      });
      document.removeEventListener('click', handleAnchorClick);
      cleanupAnimations();
      cleanupCounters();
    };
  }, []);

  return (
    <div className="new-landing-page">
      {/* Header */}
      <header className="header" id="header">
        <nav className="nav">
          <a href="#" className="logo">
            <div className="logo-icon"></div>
            TextBehind.AI
          </a>
          <ul className="nav-links">
            <li className="nav-item">
              <a href="#features" className="nav-link active">Features</a>
            </li>
            <li className="nav-item">
              <a href="#examples" className="nav-link">Examples</a>
            </li>
            <li className="nav-item">
              <a href="#pricing" className="nav-link">Pricing</a>
            </li>
            <li className="nav-item">
              <a href="#about" className="nav-link">About</a>
            </li>
            <li className="nav-item">
              <a href="#faq" className="nav-link">Help</a>
            </li>
          </ul>
          <a href="/signin" className="cta-nav">Get Started</a>
          <button className="mobile-toggle" id="mobileToggle">
            <span id="toggleIcon">☰</span>
          </button>
          <div className="mobile-menu" id="mobileMenu">
            <a href="#features" className="mobile-nav-link active">Features</a>
            <a href="#examples" className="mobile-nav-link">Examples</a>
            <a href="#pricing" className="mobile-nav-link">Pricing</a>
            <a href="#about" className="mobile-nav-link">About</a>
            <a href="#faq" className="mobile-nav-link">Help</a>
            <a href="#" className="mobile-cta">Get Started</a>
          </div>
        </nav>
      </header>

      {/* Grid Background */}
      <div className="grid-background"></div>
      <div className="grid-overlay"></div>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <div className="ai-icon"></div>
          AI-Powered Editing
        </div>
        <h1>Create & Edit Text Behind Images with AI Magic</h1>
        <p className="hero-subtitle">
          The only tool that lets you create stunning text-behind-image designs AND edit everything with advanced AI. Transform your visuals in seconds.
        </p>
        <div className="hero-cta">
          <a href="/signin" className="btn-primary">Start Creating Free</a>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="video-section animate-on-scroll">
        <div className="video-container">
          <div className="video-placeholder">
            <div className="video-play-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </div>
            <div className="video-overlay">
              <h3 className="video-title">See TextBehind.AI in Action</h3>
              <p className="video-description">
                Watch how easy it is to create stunning text-behind-image designs and edit them with AI magic.
              </p>
              <div className="video-duration">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                2:30 Demo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="bento-section animate-on-scroll">
        <div className="bento-header">
          <h2 className="bento-title">AI-Enhanced Designs</h2>
          <p className="bento-subtitle">Every creation showcases the power of our AI editing technology</p>
        </div>
        <div className="bento-grid">
          <div className="bento-item large">
            <img src="/bento-images/san.png" alt="Explore Design" className="bento-image" />
          </div>
          <div className="bento-item medium">
            <img src="/bento-images/bear.png" alt="Create Design" className="bento-image" />
          </div>
          <div className="bento-item tall">
            <img src="/bento-images/inspire.png" alt="Dream Design" className="bento-image" />
          </div>
          <div className="bento-item extra-wide">
            <img src="/bento-images/ride.png" alt="Combined Design" className="bento-image" />
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="photo-gallery-section animate-on-scroll">
        <div className="container">
          <div className="header">
            <div className="title">You're now browsing Mike's</div>
            <div className="subtitle">Photos Collection</div>
          </div>
          <div className="gallery-grid">
            <div className="photo-item">
              <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=600&fit=crop" alt="Urban Architecture" loading="lazy" />
              <div className="photo-overlay"></div>
              <div className="photo-info">
                <div className="photo-title">Urban Reflections</div>
                <div className="photo-meta">Architecture • Downtown</div>
              </div>
            </div>
            <div className="photo-item">
              <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop" alt="Forest Path" loading="lazy" />
              <div className="photo-overlay"></div>
              <div className="photo-info">
                <div className="photo-title">Forest Journey</div>
                <div className="photo-meta">Nature • Trail</div>
              </div>
            </div>
            <div className="photo-item">
              <img src="https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400&h=500&fit=crop" alt="Silhouettes" loading="lazy" />
              <div className="photo-overlay"></div>
              <div className="photo-info">
                <div className="photo-title">Evening Silhouettes</div>
                <div className="photo-meta">People • Sunset</div>
              </div>
            </div>
            <div className="photo-item">
              <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop" alt="Plant Life" loading="lazy" />
              <div className="photo-overlay"></div>
              <div className="photo-info">
                <div className="photo-title">Indoor Garden</div>
                <div className="photo-meta">Nature • Home</div>
              </div>
            </div>
            <div className="photo-item">
              <img src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=600&fit=crop" alt="Cherry Blossoms" loading="lazy" />
              <div className="photo-overlay"></div>
              <div className="photo-info">
                <div className="photo-title">Spring Blossoms</div>
                <div className="photo-meta">Nature • Garden</div>
              </div>
            </div>
            <div className="photo-item">
              <img src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=250&fit=crop" alt="Modern Building" loading="lazy" />
              <div className="photo-overlay"></div>
              <div className="photo-info">
                <div className="photo-title">Minimal Architecture</div>
                <div className="photo-meta">Architecture • Modern</div>
              </div>
            </div>
            <div className="photo-item">
              <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=550&fit=crop" alt="Ocean View" loading="lazy" />
              <div className="photo-overlay"></div>
              <div className="photo-info">
                <div className="photo-title">Ocean Depths</div>
                <div className="photo-meta">Nature • Seascape</div>
              </div>
            </div>
            <div className="photo-item">
              <img src="https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=400&h=600&fit=crop" alt="Bridge Structure" loading="lazy" />
              <div className="photo-overlay"></div>
              <div className="photo-info">
                <div className="photo-title">Architectural Lines</div>
                <div className="photo-meta">Architecture • Bridge</div>
              </div>
            </div>
            <div className="photo-item">
              <img src="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=280&fit=crop" alt="Flowers" loading="lazy" />
              <div className="photo-overlay"></div>
              <div className="photo-info">
                <div className="photo-title">Delicate Blooms</div>
                <div className="photo-meta">Nature • Macro</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features animate-on-scroll" id="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h3 className="feature-title">Classic Text Behind Image</h3>
            <p className="feature-desc">
              Create professional text-behind-image designs with our intuitive editor. Choose from hundreds of fonts and styles.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <h3 className="feature-title">AI-Powered Editing</h3>
            <p className="feature-desc">
              Edit ANYTHING about your image using AI commands. Change colors, remove objects, add elements, or transform the entire scene.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
              </svg>
            </div>
            <h3 className="feature-title">Instant Results</h3>
            <p className="feature-desc">
              No complex software needed. Create and edit professional designs in seconds, not hours. Export in high quality instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing animate-on-scroll" id="pricing">
        <div className="pricing-header">
          <h2>Choose Your Plan</h2>
          <p>Start creating amazing designs today. Upgrade anytime as your needs grow.</p>
        </div>
        <div className="pricing-grid">
          {/* Pro Plan */}
          <div className="pricing-card featured">
            <div className="plan-badge">
              <div className="plan-icon pro">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9 8.91,8.26 12,2"/>
                </svg>
              </div>
              <div>
                <div className="plan-name">Creator</div>
                <div className="plan-subtitle">Perfect for content creators and designers</div>
              </div>
            </div>
            <div className="plan-price">
              <span className="price-amount">$10</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="plan-features">
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>100 exports</strong>/month</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>Unlimited</strong> AI edits</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>Priority</strong> support</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>Early</strong> feature access</span>
              </li>
              <li className="new">
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>HD</strong> output resolution</span>
              </li>
              <li className="new">
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>No</strong> watermark</span>
              </li>
              <li className="new">
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>Multi-format</strong> export (.jpg/.png/.webp/.svg)</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>3-day</strong> free trial</span>
              </li>
            </ul>
            <a href="#" className="plan-cta primary">Start Free Trial</a>
          </div>

          {/* Elite Plan */}
          <div className="pricing-card">
            <div className="plan-badge">
              <div className="plan-icon elite">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <div className="plan-name">Studio</div>
                <div className="plan-subtitle">For advanced users and small teams</div>
              </div>
            </div>
            <div className="plan-price">
              <span className="price-amount">$25</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="plan-features">
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>500 exports</strong>/month</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>Unlimited</strong> AI edits</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>Priority & live</strong> support</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>Beta features</strong> & feedback loop</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>Team workspace</strong> (up to 3 seats)</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>Custom</strong> export presets</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>AI style memory</strong> per user</span>
              </li>
              <li>
                <div className="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span><strong>API access</strong> (future-ready)</span>
              </li>
            </ul>
            <a href="#" className="plan-cta secondary">Choose Studio</a>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="social-proof animate-on-scroll">
        <h2>Loved by creators worldwide</h2>
        <div className="testimonials-grid">
          <div className="testimonial">
            <div className="testimonial-content">
              "TextBehind.AI completely transformed my workflow. The AI editing features are incredible - I can modify any aspect of my designs in seconds."
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">SM</div>
              <div className="author-info">
                <h4>Sarah Mitchell</h4>
                <p>Content Creator</p>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              "As a graphic designer, I was skeptical about AI tools. But this platform delivers professional results that rival traditional software."
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">JC</div>
              <div className="author-info">
                <h4>James Chen</h4>
                <p>Graphic Designer</p>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              "The text-behind-image effects are stunning, and the AI editing capabilities make it so easy to customize everything exactly how I want."
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">AR</div>
              <div className="author-info">
                <h4>Alex Rivera</h4>
                <p>Social Media Manager</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats animate-on-scroll">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item" tabIndex={0}>
              <div className="stat-number">500K+</div>
              <div className="stat-label">Designs Created</div>
            </div>
            <div className="stat-item" tabIndex={0}>
              <div className="stat-number">50K+</div>
              <div className="stat-label">Happy Users</div>
            </div>
            <div className="stat-item" tabIndex={0}>
              <div className="stat-number">1M+</div>
              <div className="stat-label">AI Edits Made</div>
            </div>
            <div className="stat-item" tabIndex={0}>
              <div className="stat-number">99%</div>
              <div className="stat-label">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq animate-on-scroll" id="faq">
        <div className="faq-header">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about TextBehind.AI</p>
        </div>
        <div className="faq-item">
          <div className="faq-question">
            <h3>How does the AI editing work?</h3>
            <div className="faq-toggle">+</div>
          </div>
          <div className="faq-answer">
            Our AI uses advanced machine learning models to understand your editing commands in natural language. Simply describe what you want to change, and our AI will intelligently modify your image while preserving the text-behind-image effect.
          </div>
        </div>
        <div className="faq-item">
          <div className="faq-question">
            <h3>Can I use my own images?</h3>
            <div className="faq-toggle">+</div>
          </div>
          <div className="faq-answer">
            Absolutely! You can upload your own images or choose from our extensive library of high-quality stock photos. Our AI works with any image format and resolution.
          </div>
        </div>
        <div className="faq-item">
          <div className="faq-question">
            <h3>What formats can I export in?</h3>
            <div className="faq-toggle">+</div>
          </div>
          <div className="faq-answer">
            Pro and Studio plans support multiple formats including JPG, PNG, WebP, and SVG. You can also export in various resolutions up to 4K quality.
          </div>
        </div>
        <div className="faq-item">
          <div className="faq-question">
            <h3>Is there a free trial?</h3>
            <div className="faq-toggle">+</div>
          </div>
          <div className="faq-answer">
            Yes! We offer a 3-day free trial for the Creator plan. No credit card required to start - just sign up and begin creating immediately.
          </div>
        </div>
        <div className="faq-item">
          <div className="faq-question">
            <h3>How does team collaboration work?</h3>
            <div className="faq-toggle">+</div>
          </div>
          <div className="faq-answer">
            Our Studio plan includes team workspaces for up to 3 members. Share projects, maintain consistent AI style preferences, and collaborate seamlessly with your team.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <h3>Ready to Create AI-Enhanced Designs?</h3>
          <p>
            Join thousands of creators using the most advanced text-behind-image tool with AI editing capabilities.
          </p>
          <a href="#pricing" className="btn-primary">Get Started Now - Free Trial</a>
        </div>
        <div className="footer-bottom">
          <p>© 2025 TextBehind.AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default NewLanding;