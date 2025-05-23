document.addEventListener('DOMContentLoaded', function() {
  // Theme initialization
  initMobileMenu();
  initParallaxEffect();
  initProductHoverEffects();
  
  // Check if we need to initialize 3D viewers
  if (document.querySelector('.product-3d-container')) {
    init3DViewers();
  }
});

// Mobile menu functionality
function initMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navList = document.querySelector('.nav-list');
  
  if (mobileMenuToggle && navList) {
    mobileMenuToggle.addEventListener('click', function() {
      navList.classList.toggle('active');
      const expanded = navList.classList.contains('active');
      mobileMenuToggle.setAttribute('aria-expanded', expanded);
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.header-nav') && !event.target.closest('.mobile-menu-toggle')) {
        navList.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// Parallax effect for hero section
function initParallaxEffect() {
  const parallaxBg = document.querySelector('.parallax-bg');
  
  if (parallaxBg) {
    window.addEventListener('scroll', function() {
      const scrollPosition = window.pageYOffset;
      parallaxBg.style.transform = `translateY(${scrollPosition * 0.5}px)`;
    });
  }
}

// Product hover effects
function initProductHoverEffects() {
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      const image = this.querySelector('.product-image');
      if (image) {
        image.style.transform = 'scale(1.05)';
      }
    });
    
    card.addEventListener('mouseleave', function() {
      const image = this.querySelector('.product-image');
      if (image) {
        image.style.transform = 'scale(1)';
      }
    });
  });
}

// Placeholder for 3D viewer initialization
// Will be fully implemented in the 3D mockup system phase
function init3DViewers() {
  console.log('3D viewers initialization placeholder');
  
  // This function will be expanded during the 3D mockup system implementation
  const containers = document.querySelectorAll('.product-3d-container');
  
  containers.forEach(container => {
    const modelUrl = container.dataset.modelUrl;
    if (modelUrl) {
      // Placeholder for Three.js initialization
      console.log(`3D model to load: ${modelUrl}`);
      
      // Add placeholder content until 3D implementation
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 300px; background-color: #f5f5f5;">
          <div style="text-align: center;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#2E8B57" stroke-width="2"/>
              <path d="M12 16V12" stroke="#2E8B57" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 8H12.01" stroke="#2E8B57" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p style="margin-top: 10px; color: #2E8B57;">3D Viewer wird geladen...</p>
          </div>
        </div>
      `;
    }
  });
}

// Cookie consent functionality
function initCookieConsent() {
  const cookieBanner = document.querySelector('.cookie-banner');
  const acceptButton = document.querySelector('.cookie-accept');
  const declineButton = document.querySelector('.cookie-decline');
  
  if (cookieBanner && acceptButton && declineButton) {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookie-consent');
    
    if (!cookieConsent) {
      cookieBanner.classList.add('active');
      
      acceptButton.addEventListener('click', function() {
        localStorage.setItem('cookie-consent', 'accepted');
        cookieBanner.classList.remove('active');
        // Here we would initialize analytics and tracking
      });
      
      declineButton.addEventListener('click', function() {
        localStorage.setItem('cookie-consent', 'declined');
        cookieBanner.classList.remove('active');
        // Here we would ensure no tracking is initialized
      });
    } else if (cookieConsent === 'accepted') {
      // Initialize analytics and tracking
    }
  }
}

// Newsletter subscription validation
function validateNewsletterForm() {
  const form = document.querySelector('.newsletter-form');
  
  if (form) {
    form.addEventListener('submit', function(event) {
      const emailInput = this.querySelector('input[type="email"]');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(emailInput.value)) {
        event.preventDefault();
        alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      }
    });
  }
}

// Initialize everything
initCookieConsent();
validateNewsletterForm();
