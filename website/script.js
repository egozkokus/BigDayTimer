// Website JavaScript for BigDayTimer Landing Page

class BigDayTimerWebsite {
  constructor() {
    this.demoTimer = null;
    this.init();
  }
  
  init() {
    this.setupDemoTimer();
    this.setupEventListeners();
    this.setupScrollAnimations();
    this.setupFAQAccordion();
    this.setupNavigation();
  }
  
  setupDemoTimer() {
    // Create a demo timer that counts to a future wedding date
    const now = new Date();
    const weddingDate = new Date(now.getTime() + (127 * 24 * 60 * 60 * 1000)); // 127 days from now
    
    this.updateDemoTimer(weddingDate);
    
    // Update every second
    this.demoTimer = setInterval(() => {
      this.updateDemoTimer(weddingDate);
    }, 1000);
  }
  
  updateDemoTimer(targetDate) {
    const now = new Date().getTime();
    const difference = targetDate.getTime() - now;
    
    if (difference < 0) {
      // Reset the wedding date if it has passed
      const newWeddingDate = new Date(now + (127 * 24 * 60 * 60 * 1000));
      this.updateDemoTimer(newWeddingDate);
      return;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    // Update demo timer with animation
    this.animateNumberChange('demoDays', days);
    this.animateNumberChange('demoHours', hours);
    this.animateNumberChange('demoMinutes', minutes);
    this.animateNumberChange('demoSeconds', seconds);
  }
  
  animateNumberChange(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const paddedValue = newValue.toString().padStart(2, '0');
    
    if (currentValue !== newValue) {
      element.classList.add('updating');
      element.textContent = paddedValue;
      
      setTimeout(() => {
        element.classList.remove('updating');
      }, 300);
    }
  }
  
  setupEventListeners() {
    // Install button clicks
    document.getElementById('installBtn')?.addEventListener('click', this.handleInstallClick);
    document.getElementById('freeBtn')?.addEventListener('click', this.handleInstallClick);
    
    // Premium button clicks
    document.getElementById('premiumBtn')?.addEventListener('click', this.handlePremiumClick);
    
    // Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', this.handleSmoothScroll);
    });
    
    // Newsletter signup (if implemented later)
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', this.handleNewsletterSignup);
    }
  }
  
  handleInstallClick = (e) => {
    e.preventDefault();
    
    // Track the click
    this.trackEvent('install_clicked', { source: 'landing_page' });
    
    // Check if Chrome
    if (!this.isChrome()) {
      alert('BigDayTimer is currently only available for Google Chrome. We are working on support for additional browsers!');
      return;
    }
    
    // For now, show instructions since we don't have a published extension yet
    this.showInstallInstructions();
  }
  
  handlePremiumClick = (e) => {
    e.preventDefault();
    
    // Track the click
    this.trackEvent('premium_clicked', { source: 'landing_page' });
    
    // Show premium info modal or redirect
    this.showPremiumModal();
  }
  
  handleSmoothScroll = (e) => {
    e.preventDefault();
    
    const targetId = e.currentTarget.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
  
  isChrome() {
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  }
  
  showInstallInstructions() {
    const modal = this.createModal('Installation Instructions', `
      <div style="text-align: left; line-height: 1.6;">
        <p><strong>The extension is in development and will be available soon!</strong></p>
        <br>
        <p>To install the extension when available:</p>
        <ol style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>Open Google Chrome browser</li>
          <li>Go to the Chrome Web Store</li>
          <li>Search for "BigDayTimer"</li>
          <li>Click "Add to Chrome"</li>
          <li>Confirm the installation</li>
        </ol>
        <p>We'll notify you as soon as the extension is available!</p>
        <br>
        <div style="text-align: center;">
          <input type="email" placeholder="Email for updates" id="emailNotification" 
                 style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-right: 10px; width: 200px;">
          <button onclick="window.bigDayTimer.subscribeToUpdates()" 
                  style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Subscribe for Updates
          </button>
        </div>
      </div>
    `);
    
    document.body.appendChild(modal);
  }
  
  showPremiumModal() {
    const modal = this.createModal('Upgrade to Premium', `
      <div style="text-align: left; line-height: 1.6;">
        <p><strong>Special Premium Features:</strong></p>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>📷 Upload unlimited custom images</li>
          <li>🔢 Create up to 10 timers simultaneously</li>
          <li>🌟 Premium background library with 50+ options</li>
          <li>🎨 Advanced customization of fonts and colors</li>
          <li>🚫 No ads forever</li>
          <li>🔔 Advanced notifications</li>
        </ul>
        <p><strong>Special launch price: $4.99 instead of $7.99!</strong></p>
        <p>One-time payment, no recurring subscriptions.</p>
        <br>
        <div style="text-align: center;">
          <p style="color: #666; font-size: 0.9rem;">Upgrade will be available with extension launch</p>
          <button onclick="window.bigDayTimer.closeModal()" 
                  style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
            Got it, notify me when available
          </button>
        </div>
      </div>
    `);
    
    document.body.appendChild(modal);
  }
  
  subscribeToUpdates() {
    const email = document.getElementById('emailNotification')?.value;
    
    if (!email || !this.isValidEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Here you would typically send to your backend
    console.log('Subscribing email:', email);
    
    // For now, just show success message
    alert('Thank you! We\'ll notify you as soon as the extension is available 🎉');
    this.closeModal();
    
    // Track the subscription
    this.trackEvent('email_subscribed', { email: email });
  }
  
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  createModal(title, content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 16px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <button onclick="window.bigDayTimer.closeModal()" style="
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        ">×</button>
        <h3 style="margin-bottom: 1.5rem; color: #333; text-align: center;">${title}</h3>
        ${content}
      </div>
    `;
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
    
    return modal;
  }
  
  closeModal() {
    const modals = document.querySelectorAll('div[style*="position: fixed"][style*="z-index: 10000"]');
    modals.forEach(modal => modal.remove());
  }
  
  setupScrollAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);
    
    // Add animation styles and observe elements
    const animatedElements = document.querySelectorAll('.feature-card, .audience-card, .step, .faq-item');
    animatedElements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
      observer.observe(el);
    });
  }
  
  setupFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      
      if (question && answer) {
        // Initially hide answers
        answer.style.maxHeight = '0';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.3s ease';
        
        question.style.cursor = 'pointer';
        question.style.userSelect = 'none';
        
        // Add click handler
        question.addEventListener('click', () => {
          const isOpen = answer.style.maxHeight !== '0px';
          
          if (isOpen) {
            answer.style.maxHeight = '0';
            question.style.color = '#333';
          } else {
            answer.style.maxHeight = answer.scrollHeight + 'px';
            question.style.color = '#667eea';
          }
        });
        
        // Add hover effect to question
        question.addEventListener('mouseenter', () => {
          if (answer.style.maxHeight === '0px') {
            question.style.color = '#667eea';
          }
        });
        
        question.addEventListener('mouseleave', () => {
          if (answer.style.maxHeight === '0px') {
            question.style.color = '#333';
          }
        });
      }
    });
  }
  
  trackEvent(eventName, properties = {}) {
    // Analytics tracking (Google Analytics, Mixpanel, etc.)
    console.log('Event tracked:', eventName, properties);
    
    // Example Google Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
    
    // Example Facebook Pixel tracking
    if (typeof fbq !== 'undefined') {
      fbq('trackCustom', eventName, properties);
    }
  }
  
  // Cleanup
  destroy() {
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
    }
  }
  
  setupNavigation() {
    // Mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const header = document.querySelector('.header');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
      
      // Close mobile menu when clicking on a link
      navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navToggle.classList.remove('active');
          navMenu.classList.remove('active');
        });
      });
      
      // Close mobile menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navToggle.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    }
    
    // Enhanced header scroll behavior with auto-hide and throttling
    let lastScrollTop = 0;
    let isScrollingDown = false;
    let ticking = false;
    
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollDelta = Math.abs(scrollTop - lastScrollTop);
      
      // Only process if there's significant scroll movement
      if (scrollDelta < 5) return;
      
      // Determine scroll direction
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down - hide header
        if (!isScrollingDown) {
          isScrollingDown = true;
          header.classList.add('hidden');
          header.classList.remove('visible');
        }
      } else if (scrollTop < lastScrollTop && scrollDelta > 10) {
        // Scrolling up - show header (with minimum scroll distance to avoid flickering)
        if (isScrollingDown) {
          isScrollingDown = false;
          header.classList.remove('hidden');
          header.classList.add('visible');
        }
      }
      
      // Add scrolled class for styling
      if (scrollTop > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
        header.classList.remove('hidden');
        header.classList.remove('visible');
        isScrollingDown = false;
      }
      
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    }, { passive: true });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.bigDayTimer = new BigDayTimerWebsite();
});

// Add some additional CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
  .timer-number.updating {
    animation: numberPulse 0.3s ease-in-out;
  }
  
  @keyframes numberPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  .hero-demo .timer-preview:hover {
    transform: scale(1.02);
  }
  
  .feature-card:hover .feature-icon {
    transform: scale(1.2);
    transition: transform 0.3s ease;
  }
  
  .audience-card:hover .audience-icon {
    transform: rotate(10deg) scale(1.1);
    transition: transform 0.3s ease;
  }
  
  .btn:active {
    transform: translateY(0px) scale(0.98);
  }
`;

document.head.appendChild(style);