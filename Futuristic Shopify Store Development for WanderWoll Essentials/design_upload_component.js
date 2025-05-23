/**
 * WanderWoll essentials - Design Upload Component
 * 
 * This component handles the file upload functionality for custom designs,
 * including drag-and-drop, file validation, and initial processing.
 */

class DesignUploadComponent {
  /**
   * Initialize the design upload component
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      containerId: config.containerId || 'design-upload-container',
      maxFileSize: config.maxFileSize || 5 * 1024 * 1024, // 5MB default
      acceptedFileTypes: config.acceptedFileTypes || ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
      onUploadStart: config.onUploadStart || (() => {}),
      onUploadProgress: config.onUploadProgress || (() => {}),
      onUploadComplete: config.onUploadComplete || (() => {}),
      onUploadError: config.onUploadError || (() => {}),
      onDesignSelected: config.onDesignSelected || (() => {}),
      enableImageOptimization: config.enableImageOptimization !== undefined ? config.enableImageOptimization : true,
      maxImageDimension: config.maxImageDimension || 2048,
      language: config.language || 'de',
      ...config
    };
    
    // Initialize state
    this.state = {
      isDragging: false,
      isUploading: false,
      uploadProgress: 0,
      currentFile: null,
      processedDesign: null,
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
    container.style.minHeight = '200px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.border = '2px dashed #ccc';
    container.style.borderRadius = '8px';
    container.style.padding = '20px';
    container.style.boxSizing = 'border-box';
    container.style.textAlign = 'center';
    container.style.transition = 'all 0.3s ease';
    
    // Create upload zone
    const uploadZone = document.createElement('div');
    uploadZone.className = 'design-upload-zone';
    uploadZone.style.display = 'flex';
    uploadZone.style.flexDirection = 'column';
    uploadZone.style.alignItems = 'center';
    uploadZone.style.justifyContent = 'center';
    uploadZone.style.height = '100%';
    uploadZone.style.minHeight = '160px';
    container.appendChild(uploadZone);
    
    // Create icon
    const icon = document.createElement('div');
    icon.className = 'upload-icon';
    icon.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 16L12 8" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 11L12 8 15 11" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 16H16" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 20H21" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    uploadZone.appendChild(icon);
    
    // Create instructions
    const instructions = document.createElement('p');
    instructions.className = 'upload-instructions';
    instructions.textContent = this._getTranslation('dragAndDropInstructions');
    instructions.style.margin = '15px 0';
    instructions.style.color = '#666';
    uploadZone.appendChild(instructions);
    
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = `${this.config.containerId}-file-input`;
    fileInput.accept = this.config.acceptedFileTypes.join(',');
    fileInput.style.display = 'none';
    uploadZone.appendChild(fileInput);
    
    // Create browse button
    const browseButton = document.createElement('button');
    browseButton.className = 'browse-button';
    browseButton.textContent = this._getTranslation('browseFiles');
    browseButton.style.backgroundColor = '#2E8B57';
    browseButton.style.color = 'white';
    browseButton.style.border = 'none';
    browseButton.style.borderRadius = '4px';
    browseButton.style.padding = '10px 20px';
    browseButton.style.cursor = 'pointer';
    browseButton.style.fontWeight = 'bold';
    browseButton.style.marginTop = '10px';
    browseButton.addEventListener('click', () => {
      fileInput.click();
    });
    uploadZone.appendChild(browseButton);
    
    // Create file info
    const fileInfo = document.createElement('p');
    fileInfo.className = 'file-info';
    fileInfo.textContent = this._getTranslation('supportedFormats', {
      formats: this.config.acceptedFileTypes.map(type => type.split('/')[1].toUpperCase()).join(', '),
      maxSize: this._formatFileSize(this.config.maxFileSize)
    });
    fileInfo.style.fontSize = '12px';
    fileInfo.style.color = '#999';
    fileInfo.style.marginTop = '15px';
    uploadZone.appendChild(fileInfo);
    
    // Create progress container (initially hidden)
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.style.width = '100%';
    progressContainer.style.marginTop = '20px';
    progressContainer.style.display = 'none';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.height = '10px';
    progressBar.style.backgroundColor = '#eee';
    progressBar.style.borderRadius = '5px';
    progressBar.style.overflow = 'hidden';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.height = '100%';
    progressFill.style.width = '0%';
    progressFill.style.backgroundColor = '#2E8B57';
    progressFill.style.transition = 'width 0.3s ease';
    
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    
    const progressText = document.createElement('p');
    progressText.className = 'progress-text';
    progressText.style.fontSize = '12px';
    progressText.style.color = '#666';
    progressText.style.marginTop = '5px';
    progressText.style.textAlign = 'center';
    
    progressContainer.appendChild(progressText);
    uploadZone.appendChild(progressContainer);
    
    // Create preview container (initially hidden)
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    previewContainer.style.width = '100%';
    previewContainer.style.marginTop = '20px';
    previewContainer.style.display = 'none';
    
    const previewImage = document.createElement('img');
    previewImage.className = 'preview-image';
    previewImage.style.maxWidth = '100%';
    previewImage.style.maxHeight = '200px';
    previewImage.style.borderRadius = '4px';
    previewImage.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    
    previewContainer.appendChild(previewImage);
    
    const previewActions = document.createElement('div');
    previewActions.className = 'preview-actions';
    previewActions.style.display = 'flex';
    previewActions.style.justifyContent = 'center';
    previewActions.style.gap = '10px';
    previewActions.style.marginTop = '15px';
    
    const useDesignButton = document.createElement('button');
    useDesignButton.className = 'use-design-button';
    useDesignButton.textContent = this._getTranslation('useDesign');
    useDesignButton.style.backgroundColor = '#2E8B57';
    useDesignButton.style.color = 'white';
    useDesignButton.style.border = 'none';
    useDesignButton.style.borderRadius = '4px';
    useDesignButton.style.padding = '10px 20px';
    useDesignButton.style.cursor = 'pointer';
    useDesignButton.style.fontWeight = 'bold';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button';
    cancelButton.textContent = this._getTranslation('cancel');
    cancelButton.style.backgroundColor = '#f5f5f5';
    cancelButton.style.color = '#666';
    cancelButton.style.border = '1px solid #ccc';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.padding = '10px 20px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontWeight = 'bold';
    
    previewActions.appendChild(useDesignButton);
    previewActions.appendChild(cancelButton);
    previewContainer.appendChild(previewActions);
    
    uploadZone.appendChild(previewContainer);
    
    // Create error container (initially hidden)
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    errorContainer.style.width = '100%';
    errorContainer.style.marginTop = '20px';
    errorContainer.style.padding = '10px';
    errorContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.color = '#e74c3c';
    errorContainer.style.display = 'none';
    
    uploadZone.appendChild(errorContainer);
    
    // Store UI references
    this.ui = {
      container,
      uploadZone,
      icon,
      instructions,
      fileInput,
      browseButton,
      fileInfo,
      progressContainer,
      progressBar,
      progressFill,
      progressText,
      previewContainer,
      previewImage,
      previewActions,
      useDesignButton,
      cancelButton,
      errorContainer
    };
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    const { container, uploadZone, fileInput, useDesignButton, cancelButton } = this.ui;
    
    // Drag and drop events
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._setDragging(true);
    });
    
    container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._setDragging(false);
    });
    
    container.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._setDragging(false);
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this._handleFileSelection(files[0]);
      }
    });
    
    // File input change event
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this._handleFileSelection(e.target.files[0]);
      }
    });
    
    // Use design button click event
    useDesignButton.addEventListener('click', () => {
      if (this.state.processedDesign) {
        this.config.onDesignSelected(this.state.processedDesign);
      }
    });
    
    // Cancel button click event
    cancelButton.addEventListener('click', () => {
      this._resetUpload();
    });
  }
  
  /**
   * Handle file selection
   * @private
   * @param {File} file - Selected file
   */
  _handleFileSelection(file) {
    // Reset previous state
    this._resetError();
    
    // Validate file
    if (!this._validateFile(file)) {
      return;
    }
    
    // Set current file
    this.state.currentFile = file;
    
    // Start upload process
    this._processFile(file);
  }
  
  /**
   * Validate file
   * @private
   * @param {File} file - File to validate
   * @returns {boolean} - Whether file is valid
   */
  _validateFile(file) {
    // Check file type
    if (!this.config.acceptedFileTypes.includes(file.type)) {
      this._showError(this._getTranslation('invalidFileType', {
        formats: this.config.acceptedFileTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')
      }));
      return false;
    }
    
    // Check file size
    if (file.size > this.config.maxFileSize) {
      this._showError(this._getTranslation('fileTooLarge', {
        maxSize: this._formatFileSize(this.config.maxFileSize)
      }));
      return false;
    }
    
    return true;
  }
  
  /**
   * Process file
   * @private
   * @param {File} file - File to process
   */
  _processFile(file) {
    // Set uploading state
    this._setUploading(true, 0);
    
    // Notify upload start
    this.config.onUploadStart(file);
    
    // Read file
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        this._setUploading(true, progress);
        this.config.onUploadProgress(progress);
      }
    };
    
    reader.onerror = () => {
      this._setUploading(false);
      this._showError(this._getTranslation('fileReadError'));
      this.config.onUploadError('File read error');
    };
    
    reader.onload = (event) => {
      // Process image
      this._processImage(event.target.result, file.type);
    };
    
    reader.readAsDataURL(file);
  }
  
  /**
   * Process image
   * @private
   * @param {string} dataUrl - Image data URL
   * @param {string} fileType - File MIME type
   */
  _processImage(dataUrl, fileType) {
    // Create image element
    const img = new Image();
    
    img.onerror = () => {
      this._setUploading(false);
      this._showError(this._getTranslation('invalidImage'));
      this.config.onUploadError('Invalid image');
    };
    
    img.onload = () => {
      // Check if image optimization is needed
      if (this.config.enableImageOptimization && 
          (img.width > this.config.maxImageDimension || img.height > this.config.maxImageDimension)) {
        // Optimize image
        const optimizedDataUrl = this._optimizeImage(img, fileType);
        this._finalizeImageProcessing(optimizedDataUrl);
      } else {
        // Use original image
        this._finalizeImageProcessing(dataUrl);
      }
    };
    
    img.src = dataUrl;
  }
  
  /**
   * Optimize image
   * @private
   * @param {HTMLImageElement} img - Image element
   * @param {string} fileType - File MIME type
   * @returns {string} - Optimized image data URL
   */
  _optimizeImage(img, fileType) {
    // Calculate new dimensions
    const maxDimension = this.config.maxImageDimension;
    let width = img.width;
    let height = img.height;
    
    if (width > height) {
      if (width > maxDimension) {
        height = Math.round(height * (maxDimension / width));
        width = maxDimension;
      }
    } else {
      if (height > maxDimension) {
        width = Math.round(width * (maxDimension / height));
        height = maxDimension;
      }
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Draw image on canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    // Get data URL
    const quality = fileType === 'image/jpeg' ? 0.9 : 1;
    return canvas.toDataURL(fileType, quality);
  }
  
  /**
   * Finalize image processing
   * @private
   * @param {string} dataUrl - Processed image data URL
   */
  _finalizeImageProcessing(dataUrl) {
    // Create processed design object
    this.state.processedDesign = {
      dataUrl,
      timestamp: Date.now(),
      id: this._generateDesignId()
    };
    
    // Set uploading state to complete
    this._setUploading(false);
    
    // Show preview
    this._showPreview(dataUrl);
    
    // Notify upload complete
    this.config.onUploadComplete(this.state.processedDesign);
  }
  
  /**
   * Show preview
   * @private
   * @param {string} dataUrl - Image data URL
   */
  _showPr
(Content truncated due to size limit. Use line ranges to read in chunks)