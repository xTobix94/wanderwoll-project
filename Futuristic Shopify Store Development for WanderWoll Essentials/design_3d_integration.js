/**
 * WanderWoll essentials - Design 3D Integration
 * 
 * This component integrates the custom design upload system with the 3D pipeline,
 * allowing designs to be applied to 3D models in real-time.
 */

class Design3DIntegration {
  /**
   * Initialize the design 3D integration
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || 'vt-demo-key',
      virtualThreadsEndpoint: config.virtualThreadsEndpoint || 'https://api.virtualthreads.io/v1',
      mockeyEndpoint: config.mockeyEndpoint || 'https://api.mockey.ai/v1',
      productType: config.productType || 'tshirt',
      colorVariant: config.colorVariant || 'forest-green',
      containerId: config.containerId || 'design-3d-container',
      onModelLoaded: config.onModelLoaded || (() => {}),
      onDesignApplied: config.onDesignApplied || (() => {}),
      onError: config.onError || (() => {}),
      enableFallback: config.enableFallback !== undefined ? config.enableFallback : true,
      cacheEnabled: config.cacheEnabled !== undefined ? config.cacheEnabled : true,
      language: config.language || 'de',
      ...config
    };
    
    // Initialize state
    this.state = {
      isReady: false,
      isLoading: false,
      currentModel: null,
      currentDesign: null,
      appliedDesign: null,
      modelCache: {},
      designCache: {},
      error: null
    };
    
    // Initialize component
    this._init();
  }
  
  /**
   * Initialize the component
   * @private
   */
  _init() {
    // Check if container exists
    const container = document.getElementById(this.config.containerId);
    if (!container) {
      console.error(`Container not found: ${this.config.containerId}`);
      return;
    }
    
    // Create UI
    this._createUI(container);
    
    // Load VirtualThreads SDK
    this._loadVirtualThreadsSDK()
      .then(() => {
        // Initialize 3D viewer
        this._initialize3DViewer();
        
        // Load initial model
        this._loadModel(this.config.productType, this.config.colorVariant);
      })
      .catch(error => {
        console.error('Failed to load VirtualThreads SDK:', error);
        
        if (this.config.enableFallback) {
          this._initializeFallbackViewer();
        } else {
          this._showError(this._getTranslation('sdkLoadError'));
        }
      });
  }
  
  /**
   * Create UI elements
   * @private
   * @param {HTMLElement} container - Container element
   */
  _createUI(container) {
    // Clear container
    container.innerHTML = '';
    
    // Set container style
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.backgroundColor = '#f9f9f9';
    container.style.borderRadius = '8px';
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';
    
    // Create viewer container
    const viewerContainer = document.createElement('div');
    viewerContainer.className = 'viewer-container';
    viewerContainer.style.width = '100%';
    viewerContainer.style.height = '100%';
    container.appendChild(viewerContainer);
    
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.style.position = 'absolute';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.zIndex = '10';
    loadingOverlay.style.display = 'none';
    
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.style.width = '40px';
    loadingSpinner.style.height = '40px';
    loadingSpinner.style.border = '4px solid #f3f3f3';
    loadingSpinner.style.borderTop = '4px solid #2E8B57';
    loadingSpinner.style.borderRadius = '50%';
    loadingSpinner.style.animation = 'spin 1s linear infinite';
    
    // Add keyframes for spinner animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    loadingOverlay.appendChild(loadingSpinner);
    container.appendChild(loadingOverlay);
    
    // Create error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'error-overlay';
    errorOverlay.style.position = 'absolute';
    errorOverlay.style.top = '0';
    errorOverlay.style.left = '0';
    errorOverlay.style.width = '100%';
    errorOverlay.style.height = '100%';
    errorOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    errorOverlay.style.display = 'flex';
    errorOverlay.style.flexDirection = 'column';
    errorOverlay.style.justifyContent = 'center';
    errorOverlay.style.alignItems = 'center';
    errorOverlay.style.zIndex = '20';
    errorOverlay.style.padding = '20px';
    errorOverlay.style.textAlign = 'center';
    errorOverlay.style.display = 'none';
    
    const errorIcon = document.createElement('div');
    errorIcon.className = 'error-icon';
    errorIcon.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 8V12" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 16H12.01" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    const errorMessage = document.createElement('p');
    errorMessage.className = 'error-message';
    errorMessage.style.color = '#e74c3c';
    errorMessage.style.margin = '15px 0';
    errorMessage.style.fontSize = '16px';
    
    const retryButton = document.createElement('button');
    retryButton.className = 'retry-button';
    retryButton.textContent = this._getTranslation('retry');
    retryButton.style.backgroundColor = '#2E8B57';
    retryButton.style.color = 'white';
    retryButton.style.border = 'none';
    retryButton.style.borderRadius = '4px';
    retryButton.style.padding = '10px 20px';
    retryButton.style.cursor = 'pointer';
    retryButton.style.fontWeight = 'bold';
    retryButton.addEventListener('click', () => {
      this._retry();
    });
    
    errorOverlay.appendChild(errorIcon);
    errorOverlay.appendChild(errorMessage);
    errorOverlay.appendChild(retryButton);
    container.appendChild(errorOverlay);
    
    // Create controls overlay
    const controlsOverlay = document.createElement('div');
    controlsOverlay.className = 'controls-overlay';
    controlsOverlay.style.position = 'absolute';
    controlsOverlay.style.bottom = '0';
    controlsOverlay.style.left = '0';
    controlsOverlay.style.width = '100%';
    controlsOverlay.style.padding = '10px';
    controlsOverlay.style.display = 'flex';
    controlsOverlay.style.justifyContent = 'center';
    controlsOverlay.style.zIndex = '5';
    controlsOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    
    const rotateLeftButton = document.createElement('button');
    rotateLeftButton.className = 'rotate-left-button';
    rotateLeftButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 14L5 10L9 6" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 10H16C17.0609 10 18.0783 10.4214 18.8284 11.1716C19.5786 11.9217 20 12.9391 20 14C20 15.0609 19.5786 16.0783 18.8284 16.8284C18.0783 17.5786 17.0609 18 16 18H13" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    rotateLeftButton.style.backgroundColor = 'transparent';
    rotateLeftButton.style.border = 'none';
    rotateLeftButton.style.cursor = 'pointer';
    rotateLeftButton.style.padding = '5px';
    rotateLeftButton.style.margin = '0 5px';
    rotateLeftButton.addEventListener('click', () => {
      this._rotateModel('left');
    });
    
    const rotateRightButton = document.createElement('button');
    rotateRightButton.className = 'rotate-right-button';
    rotateRightButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 14L19 10L15 6" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 10H8C6.93913 10 5.92172 10.4214 5.17157 11.1716C4.42143 11.9217 4 12.9391 4 14C4 15.0609 4.42143 16.0783 5.17157 16.8284C5.92172 17.5786 6.93913 18 8 18H11" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    rotateRightButton.style.backgroundColor = 'transparent';
    rotateRightButton.style.border = 'none';
    rotateRightButton.style.cursor = 'pointer';
    rotateRightButton.style.padding = '5px';
    rotateRightButton.style.margin = '0 5px';
    rotateRightButton.addEventListener('click', () => {
      this._rotateModel('right');
    });
    
    const zoomInButton = document.createElement('button');
    zoomInButton.className = 'zoom-in-button';
    zoomInButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 21L16.65 16.65" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11 8V14" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 11H14" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    zoomInButton.style.backgroundColor = 'transparent';
    zoomInButton.style.border = 'none';
    zoomInButton.style.cursor = 'pointer';
    zoomInButton.style.padding = '5px';
    zoomInButton.style.margin = '0 5px';
    zoomInButton.addEventListener('click', () => {
      this._zoomModel('in');
    });
    
    const zoomOutButton = document.createElement('button');
    zoomOutButton.className = 'zoom-out-button';
    zoomOutButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 21L16.65 16.65" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 11H14" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    zoomOutButton.style.backgroundColor = 'transparent';
    zoomOutButton.style.border = 'none';
    zoomOutButton.style.cursor = 'pointer';
    zoomOutButton.style.padding = '5px';
    zoomOutButton.style.margin = '0 5px';
    zoomOutButton.addEventListener('click', () => {
      this._zoomModel('out');
    });
    
    const resetViewButton = document.createElement('button');
    resetViewButton.className = 'reset-view-button';
    resetViewButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12C3 13.1819 3.23279 14.3522 3.68508 15.4442C4.13738 16.5361 4.80031 17.5282 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 9.61305 20.0518 7.32387 18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12Z" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 12H6" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18 12H21" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 3V6" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 18V21" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    resetViewButton.style.backgroundColor = 'transparent';
    resetViewButton.style.border = 'none';
    resetViewButton.style.cursor = 'pointer';
    resetViewButton.style.padding = '5px';
    resetViewButton.style.margin = '0 5px';
    resetViewButton.addEventListener('click', () => {
      this._resetView();
    });
    
    controlsOverlay.appendChild(rotateLeftButton);
    controlsOverlay.appendChild(zoomOutButton);
    controlsOverlay.appendChild(resetViewButton);
    controlsOverlay.appendChild(zoomInButton);
    controlsOverlay.appendChild(rotateRightButton);
    container.appendChild(controlsOverlay);
    
    // Store UI references
    this.ui = {
      container,
      viewerContainer,
      loadingOverlay,
      loadingSpinner,
      errorOverlay,
      errorMessage,
      retryButton,
      controlsOverlay,
      rotateLeftButton,
      rotateRightButton,
      zoomInButton,
      zoomOutButton,
      resetViewButton
    };
  }
  
  /**
   * Load VirtualThreads SDK
   * @private
   * @returns {Promise} - Promise that resolves when SDK is loaded
   */
  _loadVirtualThreadsSDK() {
    return new Promise((resolve, reject) => {
      // Check if SDK is already loaded
      if (window.VirtualThreads) {
        resolve(window.VirtualThreads);
        return;
      }
      
      // Create script element
      const script = document.createElement('script');
      script.src = 'https://cdn.virtualthreads.io/sdk/v1/virtualthreads.min.js';
      script.async = true;
      
      // Set up event listeners
      script.onload = () => {
        if (window.VirtualThreads) {
          resolve(window.VirtualThreads);
        } else {
          reject(new Error('VirtualThreads SDK not found after loading'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load VirtualThreads SDK'));
      };
      
      // Add script to document
      document.head.appendChild(script);
    });
  }
  
  /**
   * Initialize 3D viewer
   * @private
   */
  _initialize3DViewer() {
    const { viewerContainer } = this.ui;
    
    try {
      // Initialize VirtualThreads SDK
      this.vtSDK = new window.VirtualThreads.SDK({
        apiKey: this.config.apiKey,
        container: viewerContainer,
        endpoint: this.config.virtualThreadsEndpoint
      });
      
      // Initialize 3D viewer
      this.viewer = this.vtSDK.createViewer({
        autoRotate: false,
        backgroundColor: '#f9f9f9',
        controls: {
          enableZoom: true,
          enableRotate: true,
          enablePan: false
        }
      });
      
      // Set up event listeners
      this.viewer.on('loaded', () => {
        this._hideLoading();
        this.state.isReady = true;
        
        // Apply design if one is pending
        if (this.state.currentDesign && !this.state.appliedDesign) {
          this._applyDesignToModel(this.state.currentDesign);
        }
        

(Content truncated due to size limit. Use line ranges to read in chunks)