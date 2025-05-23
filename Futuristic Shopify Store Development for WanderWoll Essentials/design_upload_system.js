/**
 * WanderWoll essentials - Design Upload System Integration
 * 
 * This component integrates the design upload, editor, and 3D preview components
 * into a cohesive workflow for the Shopify theme.
 */

class DesignUploadSystem {
  /**
   * Initialize the design upload system
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      uploadContainerId: config.uploadContainerId || 'design-upload-container',
      editorContainerId: config.editorContainerId || 'design-editor-container',
      previewContainerId: config.previewContainerId || 'design-preview-container',
      productType: config.productType || 'tshirt',
      colorVariant: config.colorVariant || 'forest-green',
      onDesignComplete: config.onDesignComplete || (() => {}),
      onError: config.onError || (() => {}),
      language: config.language || 'de',
      maxFileSize: config.maxFileSize || 5 * 1024 * 1024, // 5MB
      allowedFileTypes: config.allowedFileTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
      enableColorAdjustments: config.enableColorAdjustments !== undefined ? config.enableColorAdjustments : true,
      ...config
    };
    
    // Initialize state
    this.state = {
      currentStep: 'upload', // upload, edit, preview
      currentDesign: null,
      finalDesign: null,
      error: null
    };
    
    // Initialize components
    this.uploadComponent = null;
    this.editorComponent = null;
    this.previewComponent = null;
    
    // Initialize component
    this._init();
  }
  
  /**
   * Initialize the component
   * @private
   */
  _init() {
    // Check if containers exist
    const uploadContainer = document.getElementById(this.config.uploadContainerId);
    const editorContainer = document.getElementById(this.config.editorContainerId);
    const previewContainer = document.getElementById(this.config.previewContainerId);
    
    if (!uploadContainer || !editorContainer || !previewContainer) {
      console.error('One or more containers not found');
      return;
    }
    
    // Initialize upload component
    this._initializeUploadComponent(uploadContainer);
    
    // Initialize editor component (hidden initially)
    this._initializeEditorComponent(editorContainer);
    editorContainer.style.display = 'none';
    
    // Initialize preview component (hidden initially)
    this._initializePreviewComponent(previewContainer);
    previewContainer.style.display = 'none';
  }
  
  /**
   * Initialize upload component
   * @private
   * @param {HTMLElement} container - Container element
   */
  _initializeUploadComponent(container) {
    // Create upload component
    this.uploadComponent = new DesignUploadComponent({
      containerId: this.config.uploadContainerId,
      maxFileSize: this.config.maxFileSize,
      allowedFileTypes: this.config.allowedFileTypes,
      language: this.config.language,
      onDesignUploaded: (design) => {
        this._handleDesignUploaded(design);
      },
      onError: (error) => {
        this._handleError(error);
      }
    });
  }
  
  /**
   * Initialize editor component
   * @private
   * @param {HTMLElement} container - Container element
   */
  _initializeEditorComponent(container) {
    // Create editor component
    this.editorComponent = new DesignEditorComponent({
      containerId: this.config.editorContainerId,
      productType: this.config.productType,
      colorVariant: this.config.colorVariant,
      enableColorAdjustments: this.config.enableColorAdjustments,
      language: this.config.language,
      onDesignUpdate: (design) => {
        this._handleDesignUpdate(design);
      },
      onError: (error) => {
        this._handleError(error);
      }
    });
  }
  
  /**
   * Initialize preview component
   * @private
   * @param {HTMLElement} container - Container element
   */
  _initializePreviewComponent(container) {
    // Create preview component
    this.previewComponent = new Design3DIntegration({
      containerId: this.config.previewContainerId,
      productType: this.config.productType,
      colorVariant: this.config.colorVariant,
      language: this.config.language,
      onModelLoaded: (model) => {
        this._handleModelLoaded(model);
      },
      onDesignApplied: (design) => {
        this._handleDesignApplied(design);
      },
      onError: (error) => {
        this._handleError(error);
      }
    });
  }
  
  /**
   * Handle design uploaded
   * @private
   * @param {Object} design - Uploaded design
   */
  _handleDesignUploaded(design) {
    // Store current design
    this.state.currentDesign = design;
    
    // Move to edit step
    this._goToStep('edit');
    
    // Set design in editor
    this.editorComponent.setDesign(design);
  }
  
  /**
   * Handle design update
   * @private
   * @param {Object} design - Updated design
   */
  _handleDesignUpdate(design) {
    // Store current design
    this.state.currentDesign = design;
  }
  
  /**
   * Handle model loaded
   * @private
   * @param {Object} model - Loaded model
   */
  _handleModelLoaded(model) {
    // Apply current design to model
    if (this.state.currentDesign) {
      this.previewComponent.applyDesign(this.state.currentDesign);
    }
  }
  
  /**
   * Handle design applied
   * @private
   * @param {Object} design - Applied design
   */
  _handleDesignApplied(design) {
    // Store final design
    this.state.finalDesign = design;
    
    // Notify design complete
    this.config.onDesignComplete(design);
  }
  
  /**
   * Handle error
   * @private
   * @param {string} error - Error message
   */
  _handleError(error) {
    this.state.error = error;
    this.config.onError(error);
  }
  
  /**
   * Go to step
   * @private
   * @param {string} step - Step to go to
   */
  _goToStep(step) {
    const uploadContainer = document.getElementById(this.config.uploadContainerId);
    const editorContainer = document.getElementById(this.config.editorContainerId);
    const previewContainer = document.getElementById(this.config.previewContainerId);
    
    // Hide all containers
    uploadContainer.style.display = 'none';
    editorContainer.style.display = 'none';
    previewContainer.style.display = 'none';
    
    // Show container for current step
    switch (step) {
      case 'upload':
        uploadContainer.style.display = 'block';
        break;
      case 'edit':
        editorContainer.style.display = 'block';
        break;
      case 'preview':
        previewContainer.style.display = 'block';
        break;
    }
    
    // Update current step
    this.state.currentStep = step;
  }
  
  /**
   * Set product type
   * @param {string} productType - Product type
   */
  setProductType(productType) {
    this.config.productType = productType;
    
    // Update editor component
    if (this.editorComponent) {
      this.editorComponent.setProductType(productType);
    }
    
    // Update preview component
    if (this.previewComponent) {
      this.previewComponent.setProductType(productType);
    }
  }
  
  /**
   * Set color variant
   * @param {string} colorVariant - Color variant
   */
  setColorVariant(colorVariant) {
    this.config.colorVariant = colorVariant;
    
    // Update editor component
    if (this.editorComponent) {
      this.editorComponent.setColorVariant(colorVariant);
    }
    
    // Update preview component
    if (this.previewComponent) {
      this.previewComponent.setColorVariant(colorVariant);
    }
  }
  
  /**
   * Go to upload step
   */
  goToUpload() {
    this._goToStep('upload');
  }
  
  /**
   * Go to edit step
   */
  goToEdit() {
    if (!this.state.currentDesign) {
      this._handleError(this._getTranslation('noDesignError'));
      return;
    }
    
    this._goToStep('edit');
  }
  
  /**
   * Go to preview step
   */
  goToPreview() {
    if (!this.state.currentDesign) {
      this._handleError(this._getTranslation('noDesignError'));
      return;
    }
    
    this._goToStep('preview');
    
    // Apply current design to preview
    this.previewComponent.applyDesign(this.state.currentDesign);
  }
  
  /**
   * Get translation
   * @private
   * @param {string} key - Translation key
   * @param {Object} params - Translation parameters
   * @returns {string} - Translated text
   */
  _getTranslation(key, params = {}) {
    const translations = {
      de: {
        noDesignError: 'Kein Design vorhanden. Bitte lade zuerst ein Design hoch.'
      },
      en: {
        noDesignError: 'No design available. Please upload a design first.'
      }
    };
    
    // Get translation for current language or fallback to English
    const lang = this.config.language;
    const translation = translations[lang] || translations.en;
    
    // Get text for key
    let text = translation[key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  }
  
  /**
   * Get current step
   * @returns {string} - Current step
   */
  getCurrentStep() {
    return this.state.currentStep;
  }
  
  /**
   * Get current design
   * @returns {Object|null} - Current design or null
   */
  getCurrentDesign() {
    return this.state.currentDesign;
  }
  
  /**
   * Get final design
   * @returns {Object|null} - Final design or null
   */
  getFinalDesign() {
    return this.state.finalDesign;
  }
  
  /**
   * Reset the system
   */
  reset() {
    // Reset state
    this.state.currentDesign = null;
    this.state.finalDesign = null;
    this.state.error = null;
    
    // Reset components
    if (this.uploadComponent) {
      this.uploadComponent.reset();
    }
    
    if (this.editorComponent) {
      this.editorComponent.reset();
    }
    
    if (this.previewComponent) {
      this.previewComponent.reset();
    }
    
    // Go to upload step
    this._goToStep('upload');
  }
  
  /**
   * Dispose the system
   */
  dispose() {
    // Dispose components
    if (this.uploadComponent) {
      this.uploadComponent.dispose();
      this.uploadComponent = null;
    }
    
    if (this.editorComponent) {
      this.editorComponent.dispose();
      this.editorComponent = null;
    }
    
    if (this.previewComponent) {
      this.previewComponent.dispose();
      this.previewComponent = null;
    }
    
    // Reset state
    this.state = {
      currentStep: 'upload',
      currentDesign: null,
      finalDesign: null,
      error: null
    };
  }
}

/**
 * WanderWoll essentials - Design Upload Component
 * 
 * This component provides file upload functionality for designs.
 */
class DesignUploadComponent {
  /**
   * Initialize the design upload component
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      containerId: config.containerId || 'design-upload-container',
      maxFileSize: config.maxFileSize || 5 * 1024 * 1024, // 5MB
      allowedFileTypes: config.allowedFileTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
      onDesignUploaded: config.onDesignUploaded || (() => {}),
      onError: config.onError || (() => {}),
      language: config.language || 'de',
      ...config
    };
    
    // Initialize state
    this.state = {
      isDragging: false,
      isUploading: false,
      uploadedDesign: null,
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
    
    // Set up event listeners
    this._setupEventListeners();
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
    container.style.backgroundColor = '#fff';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    container.style.overflow = 'hidden';
    container.style.boxSizing = 'border-box';
    
    // Create upload layout
    const uploadLayout = document.createElement('div');
    uploadLayout.className = 'design-upload-layout';
    uploadLayout.style.display = 'flex';
    uploadLayout.style.flexDirection = 'column';
    uploadLayout.style.width = '100%';
    container.appendChild(uploadLayout);
    
    // Create upload header
    const uploadHeader = document.createElement('div');
    uploadHeader.className = 'design-upload-header';
    uploadHeader.style.padding = '15px';
    uploadHeader.style.borderBottom = '1px solid #eee';
    
    const uploadTitle = document.createElement('h3');
    uploadTitle.className = 'upload-title';
    uploadTitle.textContent = this._getTranslation('uploadDesign');
    uploadTitle.style.margin = '0';
    uploadTitle.style.color = '#2E8B57';
    uploadTitle.style.fontSize = '18px';
    
    uploadHeader.appendChild(uploadTitle);
    uploadLayout.appendChild(uploadHeader);
    
    // Create upload content
    const uploadContent = document.createElement('div');
    uploadContent.className = 'design-upload-content';
    uploadContent.style.padding = '20px';
    uploadContent.style.display = 'flex';
    uploadContent.style.flexDirection = 'column';
    uploadContent.style.alignItems = 'center';
    uploadContent.style.justifyContent = 'center';
    uploadContent.style.minHeight = '300px';
    uploadLayout.appendChild(uploadContent);
    
    // Create drop zone
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.style.width = '100%';
    dropZone.style.height = '200px';
    dropZone.style.border = '2px dashed #ccc';
    dropZone.style.borderRadius = '4px';
    dropZone.style.display = 'flex';
    dropZone.style.flexDirection = 'column';
    dropZone.style.alignItems = 'center';
    dropZone.style.justifyContent = 'center';
    dropZone.style.cursor = 'pointer';
    dropZone.style.transition = 'border-color 0.3s ease';
    
    const uploadIcon = document.createElement('div');
    uploadIcon.className = 'upload-icon';
    uploadIcon.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 8L12 3L7 8" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 3V15" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    const uploadText = document.createElement('p');
    uploadText.className = 'upload-text';
    uploadText.textContent = this._getTranslation('dropFilesHere');
    uploadText.style.margin = '10px 0';
    uploadText.style.color = '#666';
    uploadText.style.fontSize = '16px';
    uploadText.style.textAlign = 'center';
    
    const uploadSubtext = document.createElement('p');
    uploadSubtext.className = 'upload-subtext';
    uploadSubtext.textContent = this._getTranslation('orClickToUpload');
    uploadSubtext.style.margin = '0';
    uploadSubtext.style.color = '#999';
    uploadSubtext.style.fontSize = '14px';
    uploadSubtext.style.textAlign = 'center';
    
    dropZone.appendChild(uploadIcon);
    dropZone.appendChild(uploadText);
    dropZone.appendChild(uploadSubtext);
    uploadContent.appendChild(dropZone);
    
    // Create file input
    const fileInput = document.createE
(Content truncated due to size limit. Use line ranges to read in chunks)