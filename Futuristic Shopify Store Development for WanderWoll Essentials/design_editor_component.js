/**
 * WanderWoll essentials - Design Editor Component
 * 
 * This component provides basic editing capabilities for uploaded designs,
 * including positioning, scaling, rotation, and color adjustments.
 */

class DesignEditorComponent {
  /**
   * Initialize the design editor component
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      containerId: config.containerId || 'design-editor-container',
      initialDesign: config.initialDesign || null,
      productType: config.productType || 'tshirt',
      colorVariant: config.colorVariant || 'forest-green',
      onDesignUpdate: config.onDesignUpdate || (() => {}),
      onEditorReady: config.onEditorReady || (() => {}),
      onError: config.onError || (() => {}),
      language: config.language || 'de',
      enableColorAdjustments: config.enableColorAdjustments !== undefined ? config.enableColorAdjustments : true,
      maxDesignScale: config.maxDesignScale || 2.0,
      minDesignScale: config.minDesignScale || 0.1,
      defaultDesignScale: config.defaultDesignScale || 0.5,
      defaultDesignPosition: config.defaultDesignPosition || { x: 0.5, y: 0.5 },
      defaultDesignRotation: config.defaultDesignRotation || 0,
      ...config
    };
    
    // Initialize state
    this.state = {
      isReady: false,
      currentDesign: null,
      designTransform: {
        scale: this.config.defaultDesignScale,
        rotation: this.config.defaultDesignRotation,
        position: { ...this.config.defaultDesignPosition }
      },
      colorAdjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0
      },
      isEditing: false,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
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
    
    // Set initial design if provided
    if (this.config.initialDesign) {
      this.setDesign(this.config.initialDesign);
    }
    
    // Mark as ready
    this.state.isReady = true;
    this.config.onEditorReady();
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
    
    // Create editor layout
    const editorLayout = document.createElement('div');
    editorLayout.className = 'design-editor-layout';
    editorLayout.style.display = 'flex';
    editorLayout.style.flexDirection = 'column';
    editorLayout.style.width = '100%';
    container.appendChild(editorLayout);
    
    // Create editor header
    const editorHeader = document.createElement('div');
    editorHeader.className = 'design-editor-header';
    editorHeader.style.padding = '15px';
    editorHeader.style.borderBottom = '1px solid #eee';
    editorHeader.style.display = 'flex';
    editorHeader.style.justifyContent = 'space-between';
    editorHeader.style.alignItems = 'center';
    
    const editorTitle = document.createElement('h3');
    editorTitle.className = 'editor-title';
    editorTitle.textContent = this._getTranslation('designEditor');
    editorTitle.style.margin = '0';
    editorTitle.style.color = '#2E8B57';
    editorTitle.style.fontSize = '18px';
    
    const resetButton = document.createElement('button');
    resetButton.className = 'reset-button';
    resetButton.textContent = this._getTranslation('resetDesign');
    resetButton.style.backgroundColor = '#f5f5f5';
    resetButton.style.color = '#666';
    resetButton.style.border = '1px solid #ccc';
    resetButton.style.borderRadius = '4px';
    resetButton.style.padding = '8px 12px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.fontSize = '14px';
    
    editorHeader.appendChild(editorTitle);
    editorHeader.appendChild(resetButton);
    editorLayout.appendChild(editorHeader);
    
    // Create editor content
    const editorContent = document.createElement('div');
    editorContent.className = 'design-editor-content';
    editorContent.style.display = 'flex';
    editorContent.style.flexDirection = 'row';
    editorContent.style.width = '100%';
    editorContent.style.minHeight = '400px';
    editorLayout.appendChild(editorContent);
    
    // Create preview area
    const previewArea = document.createElement('div');
    previewArea.className = 'design-preview-area';
    previewArea.style.flex = '1';
    previewArea.style.position = 'relative';
    previewArea.style.backgroundColor = '#f9f9f9';
    previewArea.style.overflow = 'hidden';
    previewArea.style.display = 'flex';
    previewArea.style.justifyContent = 'center';
    previewArea.style.alignItems = 'center';
    editorContent.appendChild(previewArea);
    
    // Create product preview
    const productPreview = document.createElement('div');
    productPreview.className = 'product-preview';
    productPreview.style.position = 'relative';
    productPreview.style.width = '300px';
    productPreview.style.height = '350px';
    productPreview.style.backgroundColor = this._getProductColor();
    productPreview.style.borderRadius = '4px';
    previewArea.appendChild(productPreview);
    
    // Create product outline
    const productOutline = document.createElement('div');
    productOutline.className = 'product-outline';
    productOutline.style.position = 'absolute';
    productOutline.style.top = '0';
    productOutline.style.left = '0';
    productOutline.style.width = '100%';
    productOutline.style.height = '100%';
    productOutline.style.backgroundImage = this._getProductOutlineUrl();
    productOutline.style.backgroundSize = 'contain';
    productOutline.style.backgroundPosition = 'center';
    productOutline.style.backgroundRepeat = 'no-repeat';
    productOutline.style.pointerEvents = 'none';
    productPreview.appendChild(productOutline);
    
    // Create design canvas
    const designCanvas = document.createElement('div');
    designCanvas.className = 'design-canvas';
    designCanvas.style.position = 'absolute';
    designCanvas.style.top = '0';
    designCanvas.style.left = '0';
    designCanvas.style.width = '100%';
    designCanvas.style.height = '100%';
    designCanvas.style.display = 'flex';
    designCanvas.style.justifyContent = 'center';
    designCanvas.style.alignItems = 'center';
    designCanvas.style.overflow = 'hidden';
    productPreview.appendChild(designCanvas);
    
    // Create design image
    const designImage = document.createElement('img');
    designImage.className = 'design-image';
    designImage.style.maxWidth = '80%';
    designImage.style.maxHeight = '80%';
    designImage.style.transform = 'translate(-50%, -50%)';
    designImage.style.position = 'absolute';
    designImage.style.top = '50%';
    designImage.style.left = '50%';
    designImage.style.transformOrigin = 'center';
    designImage.style.cursor = 'move';
    designImage.style.display = 'none';
    designCanvas.appendChild(designImage);
    
    // Create controls panel
    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'controls-panel';
    controlsPanel.style.width = '250px';
    controlsPanel.style.padding = '15px';
    controlsPanel.style.borderLeft = '1px solid #eee';
    controlsPanel.style.backgroundColor = '#fff';
    controlsPanel.style.overflowY = 'auto';
    editorContent.appendChild(controlsPanel);
    
    // Create control groups
    const transformControls = this._createTransformControls();
    const colorControls = this._createColorControls();
    
    controlsPanel.appendChild(transformControls);
    
    if (this.config.enableColorAdjustments) {
      controlsPanel.appendChild(colorControls);
    }
    
    // Create editor footer
    const editorFooter = document.createElement('div');
    editorFooter.className = 'design-editor-footer';
    editorFooter.style.padding = '15px';
    editorFooter.style.borderTop = '1px solid #eee';
    editorFooter.style.display = 'flex';
    editorFooter.style.justifyContent = 'flex-end';
    editorFooter.style.alignItems = 'center';
    
    const applyButton = document.createElement('button');
    applyButton.className = 'apply-button';
    applyButton.textContent = this._getTranslation('applyDesign');
    applyButton.style.backgroundColor = '#2E8B57';
    applyButton.style.color = 'white';
    applyButton.style.border = 'none';
    applyButton.style.borderRadius = '4px';
    applyButton.style.padding = '10px 20px';
    applyButton.style.cursor = 'pointer';
    applyButton.style.fontWeight = 'bold';
    applyButton.style.marginLeft = '10px';
    
    editorFooter.appendChild(applyButton);
    editorLayout.appendChild(editorFooter);
    
    // Create error container (initially hidden)
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    errorContainer.style.width = '100%';
    errorContainer.style.padding = '10px 15px';
    errorContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    errorContainer.style.color = '#e74c3c';
    errorContainer.style.display = 'none';
    editorLayout.appendChild(errorContainer);
    
    // Store UI references
    this.ui = {
      container,
      editorLayout,
      editorHeader,
      editorTitle,
      resetButton,
      editorContent,
      previewArea,
      productPreview,
      productOutline,
      designCanvas,
      designImage,
      controlsPanel,
      transformControls,
      colorControls,
      editorFooter,
      applyButton,
      errorContainer
    };
  }
  
  /**
   * Create transform controls
   * @private
   * @returns {HTMLElement} - Transform controls element
   */
  _createTransformControls() {
    const transformControls = document.createElement('div');
    transformControls.className = 'transform-controls';
    transformControls.style.marginBottom = '20px';
    
    const transformTitle = document.createElement('h4');
    transformTitle.textContent = this._getTranslation('positionAndSize');
    transformTitle.style.margin = '0 0 15px 0';
    transformTitle.style.color = '#333';
    transformTitle.style.fontSize = '16px';
    transformControls.appendChild(transformTitle);
    
    // Scale control
    const scaleControl = document.createElement('div');
    scaleControl.className = 'control-group';
    scaleControl.style.marginBottom = '15px';
    
    const scaleLabel = document.createElement('label');
    scaleLabel.textContent = this._getTranslation('scale');
    scaleLabel.style.display = 'block';
    scaleLabel.style.marginBottom = '5px';
    scaleLabel.style.color = '#666';
    scaleLabel.style.fontSize = '14px';
    
    const scaleSlider = document.createElement('input');
    scaleSlider.type = 'range';
    scaleSlider.min = this.config.minDesignScale * 100;
    scaleSlider.max = this.config.maxDesignScale * 100;
    scaleSlider.value = this.config.defaultDesignScale * 100;
    scaleSlider.style.width = '100%';
    scaleSlider.style.margin = '0';
    
    const scaleValue = document.createElement('span');
    scaleValue.textContent = `${Math.round(this.config.defaultDesignScale * 100)}%`;
    scaleValue.style.display = 'block';
    scaleValue.style.textAlign = 'right';
    scaleValue.style.fontSize = '12px';
    scaleValue.style.color = '#999';
    scaleValue.style.marginTop = '5px';
    
    scaleControl.appendChild(scaleLabel);
    scaleControl.appendChild(scaleSlider);
    scaleControl.appendChild(scaleValue);
    transformControls.appendChild(scaleControl);
    
    // Rotation control
    const rotationControl = document.createElement('div');
    rotationControl.className = 'control-group';
    rotationControl.style.marginBottom = '15px';
    
    const rotationLabel = document.createElement('label');
    rotationLabel.textContent = this._getTranslation('rotation');
    rotationLabel.style.display = 'block';
    rotationLabel.style.marginBottom = '5px';
    rotationLabel.style.color = '#666';
    rotationLabel.style.fontSize = '14px';
    
    const rotationSlider = document.createElement('input');
    rotationSlider.type = 'range';
    rotationSlider.min = -180;
    rotationSlider.max = 180;
    rotationSlider.value = this.config.defaultDesignRotation;
    rotationSlider.style.width = '100%';
    rotationSlider.style.margin = '0';
    
    const rotationValue = document.createElement('span');
    rotationValue.textContent = `${this.config.defaultDesignRotation}°`;
    rotationValue.style.display = 'block';
    rotationValue.style.textAlign = 'right';
    rotationValue.style.fontSize = '12px';
    rotationValue.style.color = '#999';
    rotationValue.style.marginTop = '5px';
    
    rotationControl.appendChild(rotationLabel);
    rotationControl.appendChild(rotationSlider);
    rotationControl.appendChild(rotationValue);
    transformControls.appendChild(rotationControl);
    
    // Position note
    const positionNote = document.createElement('p');
    positionNote.textContent = this._getTranslation('dragToPosition');
    positionNote.style.fontSize = '13px';
    positionNote.style.color = '#999';
    positionNote.style.margin = '10px 0';
    positionNote.style.fontStyle = 'italic';
    transformControls.appendChild(positionNote);
    
    // Store control references
    this.ui = this.ui || {};
    this.ui.scaleSlider = scaleSlider;
    this.ui.scaleValue = scaleValue;
    this.ui.rotationSlider = rotationSlider;
    this.ui.rotationValue = rotationValue;
    
    return transformControls;
  }
  
  /**
   * Create color controls
   * @private
   * @returns {HTMLElement} - Color controls element
   */
  _createColorControls() {
    const colorControls = document.createElement('div');
    colorControls.className = 'color-controls';
    
    const colorTitle = document.createElement('h4');
    colorTitle.textContent = this._getTranslation('colorAdjustments');
    colorTitle.style.margin = '0 0 15px 0';
    colorTitle.style.color = '#333';
    colorTitle.style.fontSize = '16px';
    colorControls.appendChild(colorTitle);
    
    // Brightness control
    const brightnessControl = document.createElement('div');
    brightnessControl.className = 'control-group';
    brightnessControl.style.marginBottom = '15px';
    
    const brightnessLabel = document.createElement('label');
    brightnessLabel.textContent = this._getTranslation('brightness');
    brightnessLabel.style.display = 'block';
    brightnessLabel.style.marginBottom = '5px';
    brightnessLabel.style.color = '#666';
    brightnessLabel.style.fontSize = '14px';
    
    const brightnessSlider = document.createElement('input');
    brightnessSlider.type = 'range';
    brightnessSlider.min = -100;
    brightnessSlider.max = 100;
    brightnessSlider.value = 0;
    brightnessSlider.style.width = '100%';
    brightnessSlider.style.margin = '0';
    
    const brightnessValue = document.createElement('span');
    brightnessValue.textContent = '0';
    brightnessValue.style.display = 'block';
    brightnessValue.style.textAlign = 'right';
    brightnessValue.style.fontSize = '12px';
    brightnessValue.style.color = '#999';
    brightnessValue.style.marginTop = '5px';
    
    brightnessControl.appendChild(brightnessLabel);
    brightnessControl.appendChild(brightnessSlider);
    brightnessC
(Content truncated due to size limit. Use line ranges to read in chunks)