/**
 * WanderWoll essentials - VirtualThreads.io Widget Integration
 * 
 * This script handles the integration of the VirtualThreads.io widget
 * into the WanderWoll essentials Shopify store for real-time 3D mockups.
 */

// Configuration
const WANDERWOLL_CONFIG = {
  apiKey: '{{shop.metafields.wanderwoll.vt_public_key}}',
  colors: {
    primary: '#2E8B57', // Forest Green
    secondary: '#F5DEB3', // Beige
    accent: '#000000' // Black
  },
  fallbackEnabled: true
};

// Initialize VirtualThreads widget
function initVirtualThreadsWidget() {
  // Check if widget container exists
  const widgetContainer = document.getElementById('vt-mockup-widget');
  if (!widgetContainer) {
    console.warn('VirtualThreads widget container not found');
    return;
  }

  // Check if VTWidget is loaded
  if (typeof VTWidget === 'undefined') {
    console.error('VirtualThreads widget script failed to load');
    showFallbackMockup();
    return;
  }

  // Configure widget
  try {
    VTWidget.init({
      elementId: 'vt-mockup-widget',
      apiKey: WANDERWOLL_CONFIG.apiKey,
      productId: widgetContainer.dataset.productId,
      templateId: widgetContainer.dataset.templateId,
      colors: {
        primary: WANDERWOLL_CONFIG.colors.primary,
        secondary: WANDERWOLL_CONFIG.colors.secondary,
        accent: WANDERWOLL_CONFIG.colors.accent
      },
      onError: handleWidgetError,
      onReady: handleWidgetReady,
      onMockupGenerated: handleMockupGenerated,
      onDesignUploaded: handleDesignUploaded
    });

    console.log('VirtualThreads widget initialized');
  } catch (error) {
    console.error('Error initializing VirtualThreads widget:', error);
    showFallbackMockup();
  }
}

// Handle widget errors
function handleWidgetError(error) {
  console.error('VirtualThreads widget error:', error);
  
  // Show error message to user
  const errorMessage = document.createElement('div');
  errorMessage.className = 'vt-error-message';
  errorMessage.textContent = 'Es gab ein Problem beim Laden des 3D-Viewers. Bitte versuchen Sie es später erneut.';
  
  const widgetContainer = document.getElementById('vt-mockup-widget');
  if (widgetContainer) {
    widgetContainer.appendChild(errorMessage);
  }
  
  // Show fallback mockup
  showFallbackMockup();
}

// Handle widget ready state
function handleWidgetReady() {
  console.log('VirtualThreads widget ready');
  
  // Hide loading indicator if exists
  const loadingIndicator = document.querySelector('.vt-loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
  
  // Show widget controls
  const widgetControls = document.querySelector('.vt-widget-controls');
  if (widgetControls) {
    widgetControls.style.display = 'flex';
  }
}

// Handle mockup generation completion
function handleMockupGenerated(result) {
  console.log('Mockup generated:', result);
  
  // Save mockup URL to cart attributes
  saveCustomMockup(result.mockupUrl);
  
  // Update product preview if needed
  updateProductPreview(result.mockupUrl);
  
  // Show success message
  showSuccessMessage('Ihr Design wurde erfolgreich auf das Produkt angewendet!');
}

// Handle design upload completion
function handleDesignUploaded(result) {
  console.log('Design uploaded:', result);
  
  // Show processing message
  showProcessingMessage('Ihr Design wird verarbeitet...');
}

// Save custom mockup to cart attributes
function saveCustomMockup(mockupUrl) {
  fetch('/cart/update.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      attributes: {
        'Custom Mockup': mockupUrl
      }
    })
  })
  .then(response => response.json())
  .then(data => console.log('Mockup saved to cart:', data))
  .catch(error => console.error('Error saving mockup:', error));
}

// Update product preview with generated mockup
function updateProductPreview(mockupUrl) {
  const productGallery = document.querySelector('.product-gallery');
  if (!productGallery) return;
  
  const mockupPreview = document.createElement('div');
  mockupPreview.className = 'custom-mockup-preview';
  mockupPreview.innerHTML = `
    <h3>Ihr personalisiertes Design</h3>
    <img src="${mockupUrl}" alt="Personalisiertes Design" />
    <p>Dieses personalisierte Design wird Teil Ihrer Bestellung sein.</p>
  `;
  
  productGallery.appendChild(mockupPreview);
}

// Show fallback mockup when widget fails
function showFallbackMockup() {
  if (!WANDERWOLL_CONFIG.fallbackEnabled) return;
  
  const fallbackContainer = document.getElementById('mockup-fallback');
  if (fallbackContainer) {
    fallbackContainer.style.display = 'block';
  }
  
  const widgetContainer = document.getElementById('vt-mockup-widget');
  if (widgetContainer) {
    widgetContainer.style.display = 'none';
  }
}

// Show success message
function showSuccessMessage(message) {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'vt-success-message';
  messageContainer.textContent = message;
  
  const widgetContainer = document.getElementById('vt-mockup-widget');
  if (widgetContainer) {
    widgetContainer.appendChild(messageContainer);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageContainer.remove();
    }, 5000);
  }
}

// Show processing message
function showProcessingMessage(message) {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'vt-processing-message';
  messageContainer.textContent = message;
  
  const widgetContainer = document.getElementById('vt-mockup-widget');
  if (widgetContainer) {
    widgetContainer.appendChild(messageContainer);
    
    // Return the message container so it can be removed later
    return messageContainer;
  }
  
  return null;
}

// Load VirtualThreads widget script
function loadVirtualThreadsScript() {
  const script = document.createElement('script');
  script.src = 'https://cdn.virtualthreads.io/widget.js';
  script.async = true;
  script.onload = initVirtualThreadsWidget;
  script.onerror = () => {
    console.error('Failed to load VirtualThreads widget script');
    showFallbackMockup();
  };
  
  document.head.appendChild(script);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a product page with 3D mockup enabled
  const widgetContainer = document.getElementById('vt-mockup-widget');
  if (widgetContainer) {
    // Load widget script
    loadVirtualThreadsScript();
    
    // Set up color variant selection integration
    setupColorVariantIntegration();
  }
});

// Integrate with product color variant selection
function setupColorVariantIntegration() {
  const colorSelectors = document.querySelectorAll('.color-swatch-selector');
  if (!colorSelectors.length) return;
  
  colorSelectors.forEach(selector => {
    selector.addEventListener('change', function() {
      const selectedColor = this.value;
      updateWidgetColor(selectedColor);
    });
  });
}

// Update widget with selected color
function updateWidgetColor(colorName) {
  // Map color name to hex code
  const colorMap = {
    'forest-green': '#2E8B57',
    'beige': '#F5DEB3',
    'black': '#000000'
  };
  
  const colorHex = colorMap[colorName] || colorMap['forest-green'];
  
  // Update widget if available
  if (typeof VTWidget !== 'undefined') {
    VTWidget.updateColor(colorHex);
  }
}
