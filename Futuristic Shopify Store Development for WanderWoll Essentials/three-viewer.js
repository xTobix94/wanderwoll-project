/**
 * WanderWoll essentials 3D Product Viewer
 * Based on Three.js
 * 
 * This script provides a reusable 3D product viewer component
 * for the WanderWoll essentials Shopify store.
 */

class WanderWollProductViewer {
  constructor(options) {
    this.containerId = options.containerId;
    this.modelPath = options.modelPath;
    this.containerEl = document.getElementById(this.containerId);
    this.width = options.width || this.containerEl.clientWidth;
    this.height = options.height || this.containerEl.clientHeight;
    this.backgroundColor = options.backgroundColor || 0xf5deb3; // Beige
    this.autoRotate = options.autoRotate !== undefined ? options.autoRotate : true;
    this.enableZoom = options.enableZoom !== undefined ? options.enableZoom : true;
    this.enablePan = options.enablePan !== undefined ? options.enablePan : false;
    this.rotationSpeed = options.rotationSpeed || 0.005;
    this.cameraPosition = options.cameraPosition || { x: 0, y: 0, z: 3 };
    this.onLoadCallback = options.onLoad || function() {};
    this.onErrorCallback = options.onError || function(error) { console.error(error); };
    
    this.isInitialized = false;
    this.isLoading = false;
    this.isModelLoaded = false;
    
    // Performance monitoring
    this.stats = {
      loadTime: 0,
      frameRate: 0,
      lastFrameTime: 0
    };
    
    // Initialize if container exists
    if (this.containerEl) {
      this.init();
    } else {
      console.error(`Container element with ID "${this.containerId}" not found.`);
    }
  }
  
  init() {
    if (this.isInitialized) return;
    
    // Create loading indicator
    this.createLoadingIndicator();
    
    // Initialize Three.js components
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.initControls();
    
    // Add event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.containerEl.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.containerEl.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    
    // Start animation loop
    this.animate();
    
    // Load 3D model
    if (this.modelPath) {
      this.loadModel();
    }
    
    this.isInitialized = true;
  }
  
  createLoadingIndicator() {
    this.loadingEl = document.createElement('div');
    this.loadingEl.className = 'ww-viewer-loading';
    this.loadingEl.innerHTML = `
      <div class="ww-loading-spinner">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#2E8B57" stroke-width="4" stroke-dasharray="56.5487" stroke-dashoffset="0">
            <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div class="ww-loading-text">3D Modell wird geladen...</div>
    `;
    this.containerEl.appendChild(this.loadingEl);
    
    // Add loading styles
    const style = document.createElement('style');
    style.textContent = `
      .ww-viewer-loading {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba(245, 222, 179, 0.7);
        z-index: 10;
        transition: opacity 0.3s ease;
      }
      .ww-loading-spinner {
        margin-bottom: 10px;
      }
      .ww-loading-text {
        font-family: var(--font-body, sans-serif);
        color: #2E8B57;
        font-size: 14px;
      }
      .ww-viewer-controls {
        position: absolute;
        bottom: 10px;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        z-index: 5;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .ww-viewer-controls.active {
        opacity: 1;
      }
      .ww-control-button {
        background-color: rgba(46, 139, 87, 0.8);
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        margin: 0 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ww-control-button:hover {
        background-color: rgba(46, 139, 87, 1);
      }
    `;
    document.head.appendChild(style);
  }
  
  hideLoadingIndicator() {
    if (this.loadingEl) {
      this.loadingEl.style.opacity = '0';
      setTimeout(() => {
        if (this.loadingEl && this.loadingEl.parentNode) {
          this.loadingEl.parentNode.removeChild(this.loadingEl);
        }
      }, 300);
    }
  }
  
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundColor);
    
    // Add environment map for realistic reflections
    const envMapLoader = new THREE.PMREMGenerator(new THREE.WebGLRenderer());
    envMapLoader.compileEquirectangularShader();
    
    // Add a simple environment for reflections
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath('path/to/cubemap/'); // Will be replaced with actual path
    
    // Placeholder for environment map
    const envMap = cubeTextureLoader.load([
      'px.jpg', 'nx.jpg',
      'py.jpg', 'ny.jpg',
      'pz.jpg', 'nz.jpg'
    ]);
    
    this.scene.environment = envMap;
  }
  
  initCamera() {
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(
      this.cameraPosition.x,
      this.cameraPosition.y,
      this.cameraPosition.z
    );
    this.camera.lookAt(0, 0, 0);
  }
  
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMappingExposure = 1.0;
    
    // Clear container and append renderer
    this.containerEl.innerHTML = '';
    this.containerEl.appendChild(this.renderer.domElement);
    
    // Add controls container
    this.controlsEl = document.createElement('div');
    this.controlsEl.className = 'ww-viewer-controls';
    this.containerEl.appendChild(this.controlsEl);
    
    // Add zoom controls
    if (this.enableZoom) {
      const zoomInBtn = document.createElement('button');
      zoomInBtn.className = 'ww-control-button ww-zoom-in';
      zoomInBtn.innerHTML = '+';
      zoomInBtn.setAttribute('aria-label', 'Zoom in');
      zoomInBtn.addEventListener('click', () => this.zoomIn());
      
      const zoomOutBtn = document.createElement('button');
      zoomOutBtn.className = 'ww-control-button ww-zoom-out';
      zoomOutBtn.innerHTML = '-';
      zoomOutBtn.setAttribute('aria-label', 'Zoom out');
      zoomOutBtn.addEventListener('click', () => this.zoomOut());
      
      this.controlsEl.appendChild(zoomInBtn);
      this.controlsEl.appendChild(zoomOutBtn);
    }
    
    // Add reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'ww-control-button ww-reset';
    resetBtn.innerHTML = '↺';
    resetBtn.setAttribute('aria-label', 'Reset view');
    resetBtn.addEventListener('click', () => this.resetView());
    this.controlsEl.appendChild(resetBtn);
  }
  
  initLights() {
    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(1, 1, 2);
    this.scene.add(keyLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-1, 0, 1);
    this.scene.add(fillLight);
    
    // Back light
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(0, -1, -1);
    this.scene.add(backLight);
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);
  }
  
  initControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = this.enableZoom;
    this.controls.enablePan = this.enablePan;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 2.0;
    
    // Limit zoom
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 5;
    
    // Limit rotation
    this.controls.minPolarAngle = Math.PI / 4; // 45 degrees
    this.controls.maxPolarAngle = Math.PI / 1.5; // 120 degrees
  }
  
  loadModel() {
    if (!this.modelPath || this.isLoading) return;
    
    this.isLoading = true;
    const startTime = performance.now();
    
    const loader = new THREE.GLTFLoader();
    
    loader.load(
      this.modelPath,
      (gltf) => {
        // Success callback
        this.model = gltf.scene;
        
        // Center model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.x = -center.x;
        this.model.position.y = -center.y;
        this.model.position.z = -center.z;
        
        // Scale model to fit view
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim;
        this.model.scale.set(scale, scale, scale);
        
        // Add model to scene
        this.scene.add(this.model);
        
        // Update stats
        this.stats.loadTime = performance.now() - startTime;
        
        // Hide loading indicator
        this.hideLoadingIndicator();
        
        // Update state
        this.isLoading = false;
        this.isModelLoaded = true;
        
        // Call onLoad callback
        this.onLoadCallback();
      },
      (xhr) => {
        // Progress callback
        const percent = (xhr.loaded / xhr.total) * 100;
        if (this.loadingEl) {
          const textEl = this.loadingEl.querySelector('.ww-loading-text');
          if (textEl) {
            textEl.textContent = `Laden: ${Math.round(percent)}%`;
          }
        }
      },
      (error) => {
        // Error callback
        console.error('Error loading 3D model:', error);
        this.isLoading = false;
        
        // Show error in loading indicator
        if (this.loadingEl) {
          const textEl = this.loadingEl.querySelector('.ww-loading-text');
          if (textEl) {
            textEl.textContent = 'Fehler beim Laden des 3D-Modells';
            textEl.style.color = 'red';
          }
        }
        
        // Call error callback
        this.onErrorCallback(error);
      }
    );
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Calculate frame rate
    const now = performance.now();
    if (this.stats.lastFrameTime) {
      const delta = now - this.stats.lastFrameTime;
      this.stats.frameRate = 1000 / delta;
    }
    this.stats.lastFrameTime = now;
    
    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  onWindowResize() {
    if (!this.camera || !this.renderer || !this.containerEl) return;
    
    // Update dimensions
    this.width = this.containerEl.clientWidth;
    this.height = this.containerEl.clientHeight;
    
    // Update camera
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer
    this.renderer.setSize(this.width, this.height);
  }
  
  onMouseEnter() {
    // Show controls
    if (this.controlsEl) {
      this.controlsEl.classList.add('active');
    }
    
    // Pause auto-rotation
    if (this.controls && this.autoRotate) {
      this.controls.autoRotate = false;
    }
  }
  
  onMouseLeave() {
    // Hide controls
    if (this.controlsEl) {
      this.controlsEl.classList.remove('active');
    }
    
    // Resume auto-rotation
    if (this.controls && this.autoRotate) {
      this.controls.autoRotate = true;
    }
  }
  
  zoomIn() {
    if (this.controls) {
      const zoomScale = 0.9;
      this.controls.dollyIn(zoomScale);
      this.controls.update();
    }
  }
  
  zoomOut() {
    if (this.controls) {
      const zoomScale = 1.1;
      this.controls.dollyOut(zoomScale);
      this.controls.update();
    }
  }
  
  resetView() {
    if (this.controls) {
      this.controls.reset();
    }
  }
  
  setModelColor(color) {
    if (!this.model) return;
    
    this.model.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.color.set(color);
          });
        } else {
          child.material.color.set(color);
        }
      }
    });
  }
  
  dispose() {
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.containerEl.removeEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.containerEl.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
    
    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }
    
    // Dispose model
    if (this.model) {
      this.model.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.scene.remove(this.model);
    }
    
    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Clear container
    if (this.containerEl) {
      this.containerEl.innerHTML = '';
    }
    
    // Reset state
    this.isInitialized = false;
    this.isModelLoaded = false;
  }
}

// Export for use in Shopify theme
if (typeof module !== 'undefined') {
  module.exports = WanderWollProductViewer;
}
