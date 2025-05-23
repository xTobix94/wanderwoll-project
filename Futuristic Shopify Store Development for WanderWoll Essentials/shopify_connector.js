/**
 * WanderWoll essentials - Shopify Integration Connector
 * 
 * This module provides integration between the 3D mockup pipeline
 * and the Shopify store for WanderWoll essentials.
 */

class ShopifyConnector {
  /**
   * Initialize the Shopify connector
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      shopName: config.shopName || 'wanderwoll-essentials',
      apiKey: config.apiKey || process.env.SHOPIFY_API_KEY,
      apiPassword: config.apiPassword || process.env.SHOPIFY_API_PASSWORD,
      apiVersion: config.apiVersion || '2023-07',
      metafieldNamespace: config.metafieldNamespace || 'wanderwoll',
      ...config
    };
    
    this.baseUrl = `https://${this.config.shopName}.myshopify.com/admin/api/${this.config.apiVersion}`;
    
    // Initialize logger
    this.logger = this._createLogger(config.logLevel || 'info');
    
    this.logger.info('Shopify connector initialized');
  }
  
  /**
   * Make an API request to Shopify
   * @param {string} endpoint - API endpoint to call
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {Object} data - Request data (for POST, PUT, etc.)
   * @returns {Promise<Object>} - API response
   */
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Prepare request options
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.config.apiPassword
      }
    };
    
    // Add body for non-GET requests
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Shopify API Error (${response.status}): ${errorData.message || 'Unknown error'}`);
      }
      
      // Parse response
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      this.logger.error(`Shopify API request failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Product data
   */
  async getProduct(productId) {
    this.logger.info(`Getting product: ${productId}`);
    
    const response = await this.request(`/products/${productId}.json`);
    return response.product;
  }
  
  /**
   * Update a product
   * @param {string} productId - Product ID
   * @param {Object} productData - Product data to update
   * @returns {Promise<Object>} - Updated product data
   */
  async updateProduct(productId, productData) {
    this.logger.info(`Updating product: ${productId}`);
    
    const response = await this.request(`/products/${productId}.json`, 'PUT', {
      product: productData
    });
    
    return response.product;
  }
  
  /**
   * Get product metafields
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} - Metafields
   */
  async getProductMetafields(productId) {
    this.logger.info(`Getting metafields for product: ${productId}`);
    
    const response = await this.request(`/products/${productId}/metafields.json`);
    return response.metafields;
  }
  
  /**
   * Update product metafields
   * @param {string} productId - Product ID
   * @param {Object} metafields - Metafield data to update
   * @returns {Promise<Object>} - Update result
   */
  async updateProductMetafields(productId, metafields) {
    this.logger.info(`Updating metafields for product: ${productId}`);
    
    const results = {};
    
    // Process each metafield
    for (const [key, value] of Object.entries(metafields)) {
      try {
        // Check if metafield already exists
        const existingMetafields = await this.getProductMetafields(productId);
        const existingMetafield = existingMetafields.find(m => 
          m.namespace === this.config.metafieldNamespace && m.key === key
        );
        
        let response;
        
        if (existingMetafield) {
          // Update existing metafield
          response = await this.request(
            `/products/${productId}/metafields/${existingMetafield.id}.json`,
            'PUT',
            {
              metafield: {
                id: existingMetafield.id,
                value,
                type: typeof value === 'string' ? 'string' : 'json_string'
              }
            }
          );
        } else {
          // Create new metafield
          response = await this.request(
            `/products/${productId}/metafields.json`,
            'POST',
            {
              metafield: {
                namespace: this.config.metafieldNamespace,
                key,
                value,
                type: typeof value === 'string' ? 'string' : 'json_string'
              }
            }
          );
        }
        
        results[key] = {
          success: true,
          data: response.metafield
        };
      } catch (error) {
        this.logger.error(`Error updating metafield ${key}: ${error.message}`);
        
        results[key] = {
          success: false,
          error: error.message
        };
      }
    }
    
    return results;
  }
  
  /**
   * Upload a product image
   * @param {string} productId - Product ID
   * @param {string} imageUrl - Image URL
   * @param {string} altText - Alt text for the image
   * @returns {Promise<Object>} - Upload result
   */
  async uploadProductImage(productId, imageUrl, altText = '') {
    this.logger.info(`Uploading image for product: ${productId}`);
    
    try {
      // Create image
      const response = await this.request(
        `/products/${productId}/images.json`,
        'POST',
        {
          image: {
            src: imageUrl,
            alt: altText
          }
        }
      );
      
      return {
        success: true,
        image: response.image
      };
    } catch (error) {
      this.logger.error(`Error uploading image: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create a product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} - Created product
   */
  async createProduct(productData) {
    this.logger.info(`Creating product: ${productData.title}`);
    
    const response = await this.request('/products.json', 'POST', {
      product: productData
    });
    
    return response.product;
  }
  
  /**
   * Get all products
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Products
   */
  async getProducts(options = {}) {
    this.logger.info('Getting products');
    
    const queryParams = new URLSearchParams();
    
    if (options.limit) {
      queryParams.append('limit', options.limit);
    }
    
    if (options.ids) {
      queryParams.append('ids', options.ids.join(','));
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await this.request(`/products.json${queryString}`);
    return response.products;
  }
  
  /**
   * Check health of Shopify connection
   * @returns {Promise<Object>} - Health status
   */
  async checkHealth() {
    try {
      // Try to get shop info as a health check
      await this.request('/shop.json');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Create a logger
   * @private
   */
  _createLogger(logLevel) {
    // Simple logger implementation
    const logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    const currentLevel = logLevels[logLevel] || 2;
    
    return {
      error: (message) => {
        if (currentLevel >= logLevels.error) {
          console.error(`[SHOPIFY ERROR] ${message}`);
        }
      },
      warn: (message) => {
        if (currentLevel >= logLevels.warn) {
          console.warn(`[SHOPIFY WARN] ${message}`);
        }
      },
      info: (message) => {
        if (currentLevel >= logLevels.info) {
          console.info(`[SHOPIFY INFO] ${message}`);
        }
      },
      debug: (message) => {
        if (currentLevel >= logLevels.debug) {
          console.debug(`[SHOPIFY DEBUG] ${message}`);
        }
      }
    };
  }
}

// Export for use in Node.js or as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopifyConnector;
}
