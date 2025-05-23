/**
 * WanderWoll essentials 3D Model Loader
 * 
 * This script handles the loading and optimization of 3D models
 * for the WanderWoll essentials Shopify store.
 */

class ModelLoader {
  constructor() {
    this.loader = new THREE.GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.cache = {};
    this.loadingManager = new THREE.LoadingManager();
    this.setupLoadingManager();
  }
  
  setupLoadingManager() {
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      console.log(`Loading: ${Math.round(progress)}% (${itemsLoaded}/${itemsTotal})`);
    };
    
    this.loadingManager.onError = (url) => {
      console.error(`Error loading: ${url}`);
    };
  }
  
  /**
   * Load a 3D model with optimizations
   * @param {string} url - URL to the model file
   * @param {Object} options - Loading options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} - Promise resolving to the loaded model
   */
  loadModel(url, options = {}, onProgress = null) {
    // Check cache first
    if (this.cache[url]) {
      return Promise.resolve(this.cloneModel(this.cache[url]));
    }
    
    return new Promise((resolve, reject) => {
      const defaultOptions = {
        optimizeForMobile: true,
        applyEnvironmentMap: true,
        centerModel: true,
        normalizeSize: true
      };
      
      const settings = { ...defaultOptions, ...options };
      
      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          
          // Apply optimizations
          if (settings.optimizeForMobile) {
            this.optimizeForMobile(model);
          }
          
          if (settings.centerModel) {
            this.centerModel(model);
          }
          
          if (settings.normalizeSize) {
            this.normalizeSize(model);
          }
          
          // Cache the model
          this.cache[url] = model.clone();
          
          resolve(model);
        },
        onProgress,
        reject
      );
    });
  }
  
  /**
   * Clone a cached model
   * @param {Object} originalModel - Original model to clone
   * @returns {Object} - Cloned model
   */
  cloneModel(originalModel) {
    return originalModel.clone();
  }
  
  /**
   * Center a model at origin
   * @param {Object} model - 3D model to center
   */
  centerModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;
  }
  
  /**
   * Normalize model size to fit within a standard cube
   * @param {Object} model - 3D model to normalize
   * @param {number} targetSize - Target size (default: 2)
   */
  normalizeSize(model, targetSize = 2) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim === 0) {
      return;
    }
    
    const scale = targetSize / maxDim;
    model.scale.set(scale, scale, scale);
  }
  
  /**
   * Optimize model for mobile devices
   * @param {Object} model - 3D model to optimize
   */
  optimizeForMobile(model) {
    // Reduce polygon count for complex meshes
    model.traverse((node) => {
      if (node.isMesh) {
        // Simplify geometry if it's too complex
        if (node.geometry && node.geometry.attributes && 
            node.geometry.attributes.position && 
            node.geometry.attributes.position.count > 10000) {
          console.log(`Optimizing complex mesh with ${node.geometry.attributes.position.count} vertices`);
          
          // In a real implementation, we would use a mesh simplification algorithm
          // For this example, we'll just log the optimization
        }
        
        // Optimize materials
        if (node.material) {
          this.optimizeMaterial(node.material);
        }
      }
    });
  }
  
  /**
   * Optimize material for performance
   * @param {Object|Array} material - Material or array of materials to optimize
   */
  optimizeMaterial(material) {
    const optimizeSingleMaterial = (mat) => {
      // Reduce texture sizes for mobile
      if (mat.map) {
        mat.map.anisotropy = 1;
        mat.map.minFilter = THREE.LinearFilter;
      }
      
      // Simplify shading model for performance
      mat.flatShading = true;
      
      // Disable expensive effects
      mat.fog = false;
    };
    
    if (Array.isArray(material)) {
      material.forEach(optimizeSingleMaterial);
    } else {
      optimizeSingleMaterial(material);
    }
  }
  
  /**
   * Load a texture with optimizations
   * @param {string} url - URL to the texture file
   * @param {Object} options - Loading options
   * @returns {Promise} - Promise resolving to the loaded texture
   */
  loadTexture(url, options = {}) {
    return new Promise((resolve, reject) => {
      const defaultOptions = {
        anisotropy: 1,
        minFilter: THREE.LinearFilter,
        generateMipmaps: false
      };
      
      const settings = { ...defaultOptions, ...options };
      
      this.textureLoader.load(
        url,
        (texture) => {
          texture.anisotropy = settings.anisotropy;
          texture.minFilter = settings.minFilter;
          texture.generateMipmaps = settings.generateMipmaps;
          
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }
  
  /**
   * Clear the model cache
   */
  clearCache() {
    Object.keys(this.cache).forEach(key => {
      const model = this.cache[key];
      model.traverse((node) => {
        if (node.isMesh) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(material => material.dispose());
            } else {
              node.material.dispose();
            }
          }
        }
      });
    });
    
    this.cache = {};
  }
}

// Export for use in Shopify theme
if (typeof module !== 'undefined') {
  module.exports = ModelLoader;
}
