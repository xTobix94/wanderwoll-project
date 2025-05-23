/**
 * WanderWoll essentials - VirtualThreads.io API Client
 * 
 * This module provides a client for interacting with the VirtualThreads.io API
 * for automated mockup generation and management.
 */

class VirtualThreadsClient {
  /**
   * Initialize the VirtualThreads API client
   * @param {string} apiKey - The API key for VirtualThreads.io
   * @param {Object} options - Additional configuration options
   */
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.virtualthreads.io/v1';
    this.timeout = options.timeout || 30000; // 30 seconds default timeout
    this.retries = options.retries || 3; // Default retry attempts
    this.cacheEnabled = options.cacheEnabled !== false; // Enable caching by default
    this.cacheExpiry = options.cacheExpiry || 7 * 24 * 60 * 60 * 1000; // 7 days default
    
    // Initialize cache
    this.cache = {};
  }

  /**
   * Make an API request to VirtualThreads.io
   * @param {string} endpoint - API endpoint to call
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {Object} data - Request data (for POST, PUT, etc.)
   * @returns {Promise<Object>} - API response
   */
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = this._getCacheKey(url, method, data);
    
    // Check cache for GET requests
    if (method === 'GET' && this.cacheEnabled) {
      const cachedResponse = this._getFromCache(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Prepare request options
    const options = {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: this.timeout
    };
    
    // Add body for non-GET requests
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    // Make request with retries
    let lastError;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        // Handle non-200 responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`API Error (${response.status}): ${errorData.message || 'Unknown error'}`);
        }
        
        // Parse response
        const responseData = await response.json();
        
        // Cache successful GET responses
        if (method === 'GET' && this.cacheEnabled) {
          this._saveToCache(cacheKey, responseData);
        }
        
        return responseData;
      } catch (error) {
        lastError = error;
        
        // Don't retry on 4xx errors (client errors)
        if (error.message.includes('API Error (4')) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error('API request failed after multiple retries');
  }

  /**
   * Generate a new mockup
   * @param {Object} options - Mockup generation options
   * @returns {Promise<Object>} - Mockup generation result
   */
  async generateMockup(options) {
    const requiredFields = ['designUrl', 'templateId'];
    for (const field of requiredFields) {
      if (!options[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return this.request('/mockups/generate', 'POST', {
      design_url: options.designUrl,
      template_id: options.templateId,
      product_id: options.productId,
      color: options.color,
      options: options.renderOptions || {}
    });
  }

  /**
   * Get mockup status and results
   * @param {string} mockupId - ID of the mockup to check
   * @returns {Promise<Object>} - Mockup status and results
   */
  async getMockup(mockupId) {
    if (!mockupId) {
      throw new Error('Mockup ID is required');
    }
    
    return this.request(`/mockups/${mockupId}`);
  }

  /**
   * Poll for mockup completion
   * @param {string} mockupId - ID of the mockup to check
   * @param {Object} options - Polling options
   * @returns {Promise<Object>} - Completed mockup data
   */
  async pollMockupCompletion(mockupId, options = {}) {
    const maxAttempts = options.maxAttempts || 20;
    const interval = options.interval || 1000;
    const timeout = options.timeout || 60000;
    
    let attempts = 0;
    const startTime = Date.now();
    
    while (attempts < maxAttempts && (Date.now() - startTime) < timeout) {
      const mockup = await this.getMockup(mockupId);
      
      if (mockup.status === 'completed') {
        return mockup;
      } else if (mockup.status === 'failed') {
        throw new Error(`Mockup generation failed: ${mockup.error || 'Unknown error'}`);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    
    throw new Error('Mockup generation timed out');
  }

  /**
   * Get available templates
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - List of templates
   */
  async getTemplates(filters = {}) {
    let endpoint = '/templates';
    
    // Add query parameters for filters
    if (Object.keys(filters).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        params.append(key, value);
      }
      endpoint += `?${params.toString()}`;
    }
    
    return this.request(endpoint);
  }

  /**
   * Get template details
   * @param {string} templateId - ID of the template
   * @returns {Promise<Object>} - Template details
   */
  async getTemplate(templateId) {
    if (!templateId) {
      throw new Error('Template ID is required');
    }
    
    return this.request(`/templates/${templateId}`);
  }

  /**
   * Generate a cache key for a request
   * @private
   */
  _getCacheKey(url, method, data) {
    const dataString = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataString}`;
  }

  /**
   * Get a response from cache
   * @private
   */
  _getFromCache(key) {
    const cached = this.cache[key];
    if (!cached) return null;
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      delete this.cache[key];
      return null;
    }
    
    return cached.data;
  }

  /**
   * Save a response to cache
   * @private
   */
  _saveToCache(key, data) {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache = {};
  }
}

// Export for use in Node.js or as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualThreadsClient;
}
