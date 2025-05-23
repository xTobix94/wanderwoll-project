/**
 * WanderWoll essentials - AR Shopify Integration
 * 
 * This module integrates the AR functionality with Shopify product pages
 * and handles the necessary Liquid template modifications.
 */

class ARShopifyIntegration {
  /**
   * Initialize the AR Shopify integration
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || 'vt-demo-key',
      scriptUrl: config.scriptUrl || 'https://cdn.virtualthreads.io/ar/v1/ar-viewer.min.js',
      arModuleUrl: config.arModuleUrl || '/assets/ar_integration_module.js',
      arViewerComponentUrl: config.arViewerComponentUrl || '/assets/ar_viewer_component.js',
      productSelector: config.productSelector || '.product-single__media',
      buttonContainerSelector: config.buttonContainerSelector || '.product-single__description',
      addToCartSelector: config.addToCartSelector || '.product-form__cart-submit',
      ...config
    };
    
    // Initialize state
    this.state = {
      isInitialized: false,
      arViewerComponent: null,
      currentProduct: null,
      error: null
    };
    
    // Initialize if in browser environment
    if (typeof window !== 'undefined') {
      this._init();
    }
  }
  
  /**
   * Initialize the integration
   * @private
   */
  _init() {
    // Check if we're on a product page
    if (!this._isProductPage()) {
      return;
    }
    
    // Load required scripts
    this._loadScripts()
      .then(() => {
        // Extract product information
        this.state.currentProduct = this._extractProductInfo();
        
        // Initialize AR viewer
        this._initARViewer();
        
        this.state.isInitialized = true;
      })
      .catch(error => {
        console.error(`Error initializing AR Shopify integration: ${error.message}`);
        this.state.error = error.message;
      });
  }
  
  /**
   * Check if current page is a product page
   * @private
   * @returns {boolean} - Whether current page is a product page
   */
  _isProductPage() {
    // Check if product selector exists
    return !!document.querySelector(this.config.productSelector);
  }
  
  /**
   * Load required scripts
   * @private
   * @returns {Promise<void>}
   */
  _loadScripts() {
    return new Promise((resolve, reject) => {
      // Load VirtualThreads AR script
      this._loadScript(this.config.scriptUrl)
        .then(() => {
          // Load AR module script
          return this._loadScript(this.config.arModuleUrl);
        })
        .then(() => {
          // Load AR viewer component script
          return this._loadScript(this.config.arViewerComponentUrl);
        })
        .then(() => {
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  }
  
  /**
   * Load a script
   * @private
   * @param {string} url - Script URL
   * @returns {Promise<void>}
   */
  _loadScript(url) {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${url}"]`);
      if (existingScript) {
        resolve();
        return;
      }
      
      // Create script element
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      // Set up event listeners
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      
      // Add script to document
      document.head.appendChild(script);
    });
  }
  
  /**
   * Extract product information from the page
   * @private
   * @returns {Object} - Product information
   */
  _extractProductInfo() {
    // This would extract product information from Shopify's product JSON
    // For now, we'll use a simplified approach
    
    try {
      // Try to get product JSON from meta tag
      const productMetaTag = document.querySelector('meta[property="product:price:amount"]');
      const productJsonScript = document.getElementById('ProductJson-product-template');
      
      if (productJsonScript) {
        // Parse product JSON
        const productData = JSON.parse(productJsonScript.textContent);
        
        return {
          id: productData.id,
          title: productData.title,
          handle: productData.handle,
          productType: this._mapProductType(productData.type),
          variants: productData.variants.map(variant => ({
            id: variant.id,
            title: variant.title,
            price: variant.price,
            colorVariant: this._extractColorVariant(variant.title)
          })),
          currentVariant: productData.current_variant || productData.variants[0],
          colorVariant: this._extractColorVariant(productData.current_variant ? productData.current_variant.title : productData.variants[0].title)
        };
      }
      
      // Fallback to extracting from page elements
      const productTitle = document.querySelector('.product-single__title')?.textContent.trim();
      const productPrice = productMetaTag ? productMetaTag.getAttribute('content') : null;
      
      return {
        title: productTitle,
        price: productPrice,
        productType: this._detectProductType(),
        colorVariant: this._detectColorVariant()
      };
    } catch (error) {
      console.error(`Error extracting product information: ${error.message}`);
      
      // Return default values
      return {
        productType: 'tshirt',
        colorVariant: 'forest-green'
      };
    }
  }
  
  /**
   * Map product type to standardized type
   * @private
   * @param {string} type - Product type from Shopify
   * @returns {string} - Standardized product type
   */
  _mapProductType(type) {
    // Map Shopify product type to standardized type
    const typeMap = {
      'T-Shirt': 'tshirt',
      'T-shirt': 'tshirt',
      'Tshirt': 'tshirt',
      'T Shirt': 'tshirt',
      'Hoodie': 'hoodie',
      'Sweatshirt': 'hoodie',
      'Hooded Sweatshirt': 'hoodie',
      'Shorts': 'shorts',
      'Short': 'shorts',
      'Socks': 'socks',
      'Sock': 'socks',
      'Beanie': 'beanie',
      'Hat': 'beanie',
      'Cap': 'beanie'
    };
    
    return typeMap[type] || this._detectProductType();
  }
  
  /**
   * Extract color variant from variant title
   * @private
   * @param {string} variantTitle - Variant title
   * @returns {string} - Color variant
   */
  _extractColorVariant(variantTitle) {
    // Extract color from variant title
    const colorMap = {
      'Forest Green': 'forest-green',
      'Green': 'forest-green',
      'Beige': 'beige',
      'Black': 'black',
      'White': 'white',
      'Gray': 'gray',
      'Grey': 'gray'
    };
    
    // Check if variant title contains any of the colors
    for (const [colorName, colorValue] of Object.entries(colorMap)) {
      if (variantTitle.includes(colorName)) {
        return colorValue;
      }
    }
    
    return this._detectColorVariant();
  }
  
  /**
   * Detect product type from page content
   * @private
   * @returns {string} - Detected product type
   */
  _detectProductType() {
    // Try to detect product type from page content
    const pageContent = document.body.textContent.toLowerCase();
    
    if (pageContent.includes('t-shirt') || pageContent.includes('tshirt') || pageContent.includes('t shirt')) {
      return 'tshirt';
    } else if (pageContent.includes('hoodie') || pageContent.includes('sweatshirt')) {
      return 'hoodie';
    } else if (pageContent.includes('shorts') || pageContent.includes('short')) {
      return 'shorts';
    } else if (pageContent.includes('socks') || pageContent.includes('sock')) {
      return 'socks';
    } else if (pageContent.includes('beanie') || pageContent.includes('hat') || pageContent.includes('cap')) {
      return 'beanie';
    }
    
    // Default to t-shirt
    return 'tshirt';
  }
  
  /**
   * Detect color variant from page content
   * @private
   * @returns {string} - Detected color variant
   */
  _detectColorVariant() {
    // Try to detect color variant from page content
    const pageContent = document.body.textContent.toLowerCase();
    
    if (pageContent.includes('forest green') || pageContent.includes('green')) {
      return 'forest-green';
    } else if (pageContent.includes('beige')) {
      return 'beige';
    } else if (pageContent.includes('black')) {
      return 'black';
    } else if (pageContent.includes('white')) {
      return 'white';
    } else if (pageContent.includes('gray') || pageContent.includes('grey')) {
      return 'gray';
    }
    
    // Default to forest green
    return 'forest-green';
  }
  
  /**
   * Initialize AR viewer
   * @private
   */
  _initARViewer() {
    // Create container for AR viewer
    const arContainer = document.createElement('div');
    arContainer.id = 'wanderwoll-ar-viewer';
    arContainer.style.marginTop = '30px';
    arContainer.style.marginBottom = '30px';
    
    // Find insertion point
    const insertionPoint = document.querySelector(this.config.buttonContainerSelector);
    if (!insertionPoint) {
      console.error(`Insertion point not found: ${this.config.buttonContainerSelector}`);
      return;
    }
    
    // Insert container
    insertionPoint.parentNode.insertBefore(arContainer, insertionPoint.nextSibling);
    
    // Initialize AR module
    const arModule = new ARIntegrationModule({
      apiKey: this.config.apiKey
    });
    
    // Initialize AR viewer component
    this.state.arViewerComponent = new ARViewerComponent({
      containerId: 'wanderwoll-ar-viewer',
      productType: this.state.currentProduct.productType,
      colorVariant: this.state.currentProduct.colorVariant,
      arModule: arModule,
      onReady: () => {
        console.log('AR viewer ready');
        this._setupVariantChangeListeners();
      },
      onError: (error) => {
        console.error(`AR viewer error: ${error}`);
      }
    });
  }
  
  /**
   * Set up variant change listeners
   * @private
   */
  _setupVariantChangeListeners() {
    // Listen for variant changes
    document.addEventListener('variant:change', (event) => {
      const variant = event.detail.variant;
      if (variant) {
        const colorVariant = this._extractColorVariant(variant.title);
        this._updateARViewer(colorVariant);
      }
    });
    
    // Listen for variant selector changes
    const variantSelectors = document.querySelectorAll('.single-option-selector');
    variantSelectors.forEach(selector => {
      selector.addEventListener('change', () => {
        // Get selected variant
        const selectedOptions = Array.from(variantSelectors).map(select => select.value);
        const variantTitle = selectedOptions.join(' / ');
        const colorVariant = this._extractColorVariant(variantTitle);
        this._updateARViewer(colorVariant);
      });
    });
    
    // Listen for color swatch clicks
    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        // Get color from swatch
        const colorValue = swatch.getAttribute('data-value');
        const colorVariant = this._extractColorVariant(colorValue);
        this._updateARViewer(colorVariant);
      });
    });
  }
  
  /**
   * Update AR viewer with new color variant
   * @private
   * @param {string} colorVariant - Color variant
   */
  _updateARViewer(colorVariant) {
    if (this.state.arViewerComponent) {
      this.state.arViewerComponent.changeColorVariant(colorVariant)
        .catch(error => {
          console.error(`Error updating AR viewer: ${error.message}`);
        });
    }
  }
  
  /**
   * Generate Liquid snippet for AR viewer
   * @returns {string} - Liquid snippet
   */
  static generateLiquidSnippet() {
    return `
{% comment %}
  WanderWoll essentials AR Viewer Snippet
  
  This snippet adds the AR viewer to product pages.
  Include this in your product template.
{% endcomment %}

<div id="wanderwoll-ar-viewer-container" class="wanderwoll-ar-viewer-container">
  {% if product.metafields.wanderwoll.ar_enabled %}
    <div id="wanderwoll-ar-viewer" class="wanderwoll-ar-viewer"></div>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Initialize AR integration when scripts are loaded
        if (typeof ARShopifyIntegration !== 'undefined') {
          new ARShopifyIntegration({
            apiKey: '{{ shop.metafields.wanderwoll.ar_api_key }}',
            scriptUrl: '{{ 'virtualthreads-ar.js' | asset_url }}',
            arModuleUrl: '{{ 'ar_integration_module.js' | asset_url }}',
            arViewerComponentUrl: '{{ 'ar_viewer_component.js' | asset_url }}'
          });
        } else {
          console.error('ARShopifyIntegration not loaded');
        }
      });
    </script>
  {% endif %}
</div>
    `;
  }
  
  /**
   * Generate installation instructions
   * @returns {string} - Installation instructions
   */
  static generateInstallationInstructions() {
    return `
# WanderWoll AR Viewer Installation Instructions

Follow these steps to add the AR viewer to your Shopify store:

## 1. Upload JavaScript Files

Upload the following files to your theme's assets directory:
- \`ar_integration_module.js\`
- \`ar_viewer_component.js\`
- \`ar_shopify_integration.js\`
- \`virtualthreads-ar.js\` (download from VirtualThreads.io)

## 2. Create Liquid Snippet

Create a new snippet called \`wanderwoll-ar-viewer.liquid\` with the content from \`generateLiquidSnippet()\`.

## 3. Include Snippet in Product Template

Add the following line to your product template (usually \`product-template.liquid\` or \`product.liquid\`):

\`\`\`liquid
{% include 'wanderwoll-ar-viewer' %}
\`\`\`

Add it just after the product description or where you want the AR viewer to appear.

## 4. Add Metafields

Add the following metafields to your shop:
- Namespace: \`wanderwoll\`
- Key: \`ar_api_key\`
- Value: Your VirtualThreads API key

For each product that should have AR:
- Namespace: \`wanderwoll\`
- Key: \`ar_enabled\`
- Value: \`true\`

## 5. Test the Integration

Visit a product page with AR enabled to test the integration.
    `;
  }
}

// Export for use in Node.js or as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ARShopifyIntegration;
}
