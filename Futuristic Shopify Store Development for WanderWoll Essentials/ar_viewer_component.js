/**
 * WanderWoll essentials - AR Viewer Component
 * 
 * This component provides the UI for the AR viewer experience
 * and integrates with the AR Integration Module.
 */

class ARViewerComponent {
  /**
   * Initialize the AR viewer component
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      containerId: config.containerId || 'ar-viewer-container',
      productType: config.productType || 'tshirt',
      colorVariant: config.colorVariant || 'forest-green',
      showSizeRecommendation: config.showSizeRecommendation !== undefined ? config.showSizeRecommendation : true,
      showScreenshotButton: config.showScreenshotButton !== undefined ? config.showScreenshotButton : true,
      showShareButton: config.showShareButton !== undefined ? config.showShareButton : true,
      arModule: config.arModule || null,
      onReady: config.onReady || (() => {}),
      onError: config.onError || (() => {}),
      ...config
    };
    
    // Initialize state
    this.state = {
      isInitialized: false,
      isARMode: false,
      isLoading: false,
      arViewer: null,
      arSession: null,
      currentModel: null,
      sizeRecommendation: null,
      error: null
    };
    
    // Create AR module if not provided
    if (!this.config.arModule) {
      if (typeof ARIntegrationModule !== 'undefined') {
        this.config.arModule = new ARIntegrationModule();
      } else {
        console.error('ARIntegrationModule not found. Please include ar_integration_module.js before initializing ARViewerComponent.');
        this.state.error = 'AR module not available';
        if (typeof this.config.onError === 'function') {
          this.config.onError('AR module not available');
        }
        return;
      }
    }
    
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
      this.state.error = `Container not found: ${this.config.containerId}`;
      if (typeof this.config.onError === 'function') {
        this.config.onError(this.state.error);
      }
      return;
    }
    
    // Create UI
    this._createUI(container);
    
    // Initialize AR viewer
    this._initARViewer(container)
      .then(() => {
        this.state.isInitialized = true;
        if (typeof this.config.onReady === 'function') {
          this.config.onReady(this);
        }
      })
      .catch(error => {
        console.error(`Error initializing AR viewer: ${error.message}`);
        this.state.error = error.message;
        this._updateUI();
        if (typeof this.config.onError === 'function') {
          this.config.onError(error.message);
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
    container.style.height = '500px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.overflow = 'hidden';
    container.style.borderRadius = '8px';
    
    // Create viewer container
    const viewerContainer = document.createElement('div');
    viewerContainer.id = `${this.config.containerId}-viewer`;
    viewerContainer.style.width = '100%';
    viewerContainer.style.height = '100%';
    container.appendChild(viewerContainer);
    
    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'ar-viewer-controls';
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.bottom = '20px';
    controlsContainer.style.left = '0';
    controlsContainer.style.width = '100%';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.justifyContent = 'center';
    controlsContainer.style.gap = '10px';
    controlsContainer.style.zIndex = '10';
    container.appendChild(controlsContainer);
    
    // Create AR button
    const arButton = document.createElement('button');
    arButton.className = 'ar-button';
    arButton.textContent = 'Try On AR';
    arButton.style.padding = '10px 20px';
    arButton.style.backgroundColor = '#2E8B57';
    arButton.style.color = 'white';
    arButton.style.border = 'none';
    arButton.style.borderRadius = '4px';
    arButton.style.cursor = 'pointer';
    arButton.style.fontWeight = 'bold';
    arButton.addEventListener('click', () => this._toggleARMode());
    controlsContainer.appendChild(arButton);
    
    // Create screenshot button if enabled
    if (this.config.showScreenshotButton) {
      const screenshotButton = document.createElement('button');
      screenshotButton.className = 'screenshot-button';
      screenshotButton.textContent = 'Take Photo';
      screenshotButton.style.padding = '10px 20px';
      screenshotButton.style.backgroundColor = '#F5DEB3';
      screenshotButton.style.color = 'black';
      screenshotButton.style.border = 'none';
      screenshotButton.style.borderRadius = '4px';
      screenshotButton.style.cursor = 'pointer';
      screenshotButton.style.fontWeight = 'bold';
      screenshotButton.style.display = 'none'; // Initially hidden
      screenshotButton.addEventListener('click', () => this._captureScreenshot());
      controlsContainer.appendChild(screenshotButton);
    }
    
    // Create share button if enabled
    if (this.config.showShareButton) {
      const shareButton = document.createElement('button');
      shareButton.className = 'share-button';
      shareButton.textContent = 'Share';
      shareButton.style.padding = '10px 20px';
      shareButton.style.backgroundColor = '#F5DEB3';
      shareButton.style.color = 'black';
      shareButton.style.border = 'none';
      shareButton.style.borderRadius = '4px';
      shareButton.style.cursor = 'pointer';
      shareButton.style.fontWeight = 'bold';
      shareButton.style.display = 'none'; // Initially hidden
      shareButton.addEventListener('click', () => this._shareExperience());
      controlsContainer.appendChild(shareButton);
    }
    
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.style.position = 'absolute';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.zIndex = '20';
    loadingOverlay.style.display = 'none'; // Initially hidden
    
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.style.width = '50px';
    loadingSpinner.style.height = '50px';
    loadingSpinner.style.border = '5px solid #f3f3f3';
    loadingSpinner.style.borderTop = '5px solid #2E8B57';
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
    
    // Create size recommendation container if enabled
    if (this.config.showSizeRecommendation) {
      const sizeContainer = document.createElement('div');
      sizeContainer.className = 'size-recommendation';
      sizeContainer.style.position = 'absolute';
      sizeContainer.style.top = '20px';
      sizeContainer.style.right = '20px';
      sizeContainer.style.padding = '15px';
      sizeContainer.style.backgroundColor = 'white';
      sizeContainer.style.borderRadius = '8px';
      sizeContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      sizeContainer.style.zIndex = '10';
      sizeContainer.style.display = 'none'; // Initially hidden
      container.appendChild(sizeContainer);
    }
    
    // Create error message container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.position = 'absolute';
    errorContainer.style.top = '50%';
    errorContainer.style.left = '50%';
    errorContainer.style.transform = 'translate(-50%, -50%)';
    errorContainer.style.padding = '15px';
    errorContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    errorContainer.style.color = 'white';
    errorContainer.style.borderRadius = '8px';
    errorContainer.style.zIndex = '30';
    errorContainer.style.display = 'none'; // Initially hidden
    container.appendChild(errorContainer);
    
    // Store references to UI elements
    this.ui = {
      container,
      viewerContainer,
      controlsContainer,
      arButton,
      screenshotButton: this.config.showScreenshotButton ? controlsContainer.querySelector('.screenshot-button') : null,
      shareButton: this.config.showShareButton ? controlsContainer.querySelector('.share-button') : null,
      loadingOverlay,
      sizeContainer: this.config.showSizeRecommendation ? container.querySelector('.size-recommendation') : null,
      errorContainer
    };
  }
  
  /**
   * Initialize AR viewer
   * @private
   * @param {HTMLElement} container - Container element
   * @returns {Promise<void>}
   */
  async _initARViewer(container) {
    try {
      this._setLoading(true);
      
      // Initialize AR viewer
      const arViewer = this.config.arModule.initARViewer(
        `${this.config.containerId}-viewer`,
        {
          width: container.clientWidth,
          height: container.clientHeight,
          backgroundColor: '#f5f5f5',
          antialias: true,
          shadows: true
        }
      );
      
      this.state.arViewer = arViewer;
      
      // Load initial model
      await this._loadModel({
        productType: this.config.productType,
        colorVariant: this.config.colorVariant
      });
      
      this._setLoading(false);
      this._updateUI();
    } catch (error) {
      this._setLoading(false);
      this._showError(error.message);
      throw error;
    }
  }
  
  /**
   * Load 3D model
   * @private
   * @param {Object} modelOptions - Model options
   * @returns {Promise<void>}
   */
  async _loadModel(modelOptions) {
    try {
      this._setLoading(true);
      
      // Load model into AR viewer
      const result = await this.config.arModule.loadModelIntoAR(
        this.state.arViewer,
        modelOptions
      );
      
      this.state.currentModel = {
        ...modelOptions,
        ...result
      };
      
      this._setLoading(false);
      this._updateUI();
    } catch (error) {
      this._setLoading(false);
      this._showError(`Error loading model: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Toggle AR mode
   * @private
   */
  async _toggleARMode() {
    if (this.state.isARMode) {
      // End AR session
      await this._endARSession();
    } else {
      // Start AR session
      await this._startARSession();
    }
  }
  
  /**
   * Start AR session
   * @private
   * @returns {Promise<void>}
   */
  async _startARSession() {
    try {
      this._setLoading(true);
      
      // Start AR session
      const arSession = await this.config.arModule.startARSession(
        this.state.arViewer,
        {
          bodyTracking: true,
          initialScale: 1.0,
          placementMode: 'auto'
        }
      );
      
      this.state.arSession = arSession;
      this.state.isARMode = true;
      
      // Generate size recommendation if enabled
      if (this.config.showSizeRecommendation) {
        await this._generateSizeRecommendation();
      }
      
      this._setLoading(false);
      this._updateUI();
    } catch (error) {
      this._setLoading(false);
      this._showError(`Error starting AR session: ${error.message}`);
    }
  }
  
  /**
   * End AR session
   * @private
   * @returns {Promise<void>}
   */
  async _endARSession() {
    try {
      this._setLoading(true);
      
      // End AR session
      if (this.state.arSession) {
        await this.config.arModule.endARSession(this.state.arSession);
      }
      
      this.state.arSession = null;
      this.state.isARMode = false;
      this.state.sizeRecommendation = null;
      
      this._setLoading(false);
      this._updateUI();
    } catch (error) {
      this._setLoading(false);
      this._showError(`Error ending AR session: ${error.message}`);
    }
  }
  
  /**
   * Generate size recommendation
   * @private
   * @returns {Promise<void>}
   */
  async _generateSizeRecommendation() {
    try {
      // Generate size recommendation
      const recommendation = await this.config.arModule.generateSizeRecommendation(
        this.state.arSession,
        {
          productType: this.config.productType
        }
      );
      
      this.state.sizeRecommendation = recommendation;
      this._updateUI();
    } catch (error) {
      console.error(`Error generating size recommendation: ${error.message}`);
      // Don't show error to user, just log it
    }
  }
  
  /**
   * Capture screenshot
   * @private
   * @returns {Promise<void>}
   */
  async _captureScreenshot() {
    try {
      this._setLoading(true);
      
      // Capture screenshot
      const screenshot = await this.config.arModule.captureARScreenshot(
        this.state.arSession,
        {
          format: 'image/jpeg',
          quality: 0.8,
          addWatermark: true,
          watermarkText: 'WanderWoll essentials'
        }
      );
      
      // Store screenshot
      this.state.screenshot = screenshot;
      
      this._setLoading(false);
      this._updateUI();
      
      // Show success message
      this._showMessage('Screenshot captured successfully!');
    } catch (error) {
      this._setLoading(false);
      this._showError(`Error capturing screenshot: ${error.message}`);
    }
  }
  
  /**
   * Share AR experience
   * @private
   * @returns {Promise<void>}
   */
  async _shareExperience() {
    try {
      this._setLoading(true);
      
      // Capture screenshot if not already captured
      if (!this.state.screenshot) {
        this.state.screenshot = await this.config.arModule.captureARScreenshot(
          this.state.arSession,
          {
            format: 'image/jpeg',
            quality: 0.8,
            addWatermark: true,
            watermarkText: 'WanderWoll essentials'
          }
        );
      }
      
      // Share experience
      const result = await this.config.arModule.shareARExperience(
        this.state.screenshot,
        {
          title: 'My WanderWoll AR Experience',
          text: 'Check out how this WanderWoll product looks on me!',
          url: window.location.href
        }
      );
      
      this._setLoading(false);
      
      // Show success message
      if (result.method === 'webshare') {
        this._showMessage('Shared successfully!');
      } else {
        // For custom sharing UI, show download link
        this._showDownloadLink(result.downloadUrl);
      }
    } catch (error) {
      this._setLoading(false);
      this._showError(`Error sharing experience: ${error.message}`);
    }
  }
  
  /**
   * Update UI based on current state
   * @private
   */
  _updateUI() {
    // Update AR button
    if (this.ui.arButton) {
      this.ui.arButton.textContent = this.state.isARMode ? 'Exit AR' 
(Content truncated due to size limit. Use line ranges to read in chunks)