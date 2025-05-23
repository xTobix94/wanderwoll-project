/**
 * WanderWoll essentials Product Models Configuration
 * 
 * This file contains the configuration for 3D product models
 * including paths, textures, and variant information.
 */

const WANDERWOLL_PRODUCT_MODELS = {
  // Unisex Merino T-shirt (highest priority)
  'merino-tshirt': {
    name: 'Unisex Merino T-Shirt',
    modelPath: '/3d-assets/models/merino-tshirt.glb',
    thumbnail: '/3d-assets/textures/merino-tshirt-thumb.jpg',
    defaultColor: '#2E8B57', // Forest Green
    variants: {
      'forest-green': {
        color: '#2E8B57',
        texture: '/3d-assets/textures/merino-texture-green.jpg'
      },
      'beige': {
        color: '#F5DEB3',
        texture: '/3d-assets/textures/merino-texture-beige.jpg'
      },
      'black': {
        color: '#000000',
        texture: '/3d-assets/textures/merino-texture-black.jpg'
      }
    },
    cameraPosition: { x: 0, y: 0, z: 2.5 },
    initialRotation: { x: 0, y: 0, z: 0 },
    size: {
      width: 1.2,
      height: 1.8,
      depth: 0.3
    },
    description: 'Unser meistverkauftes Merino-T-Shirt für ultimativen Komfort unterwegs.'
  },
  
  // Merino Hoodie (second priority)
  'merino-hoodie': {
    name: 'Merino Hoodie',
    modelPath: '/3d-assets/models/merino-hoodie.glb',
    thumbnail: '/3d-assets/textures/merino-hoodie-thumb.jpg',
    defaultColor: '#2E8B57', // Forest Green
    variants: {
      'forest-green': {
        color: '#2E8B57',
        texture: '/3d-assets/textures/merino-texture-green.jpg'
      },
      'beige': {
        color: '#F5DEB3',
        texture: '/3d-assets/textures/merino-texture-beige.jpg'
      },
      'black': {
        color: '#000000',
        texture: '/3d-assets/textures/merino-texture-black.jpg'
      }
    },
    cameraPosition: { x: 0, y: 0, z: 3 },
    initialRotation: { x: 0, y: 0, z: 0 },
    size: {
      width: 1.4,
      height: 2,
      depth: 0.4
    },
    description: 'Unser Premium Merino-Hoodie für Wärme und Stil auf allen Abenteuern.'
  },
  
  // Placeholder configurations for future models (Phase 2)
  'merino-socks': {
    name: 'Merino-Socken 3er-Pack',
    modelPath: '/3d-assets/models/merino-socks.glb',
    thumbnail: '/3d-assets/textures/merino-socks-thumb.jpg',
    defaultColor: '#2E8B57',
    variants: {
      'forest-green': { color: '#2E8B57' },
      'beige': { color: '#F5DEB3' },
      'black': { color: '#000000' }
    },
    cameraPosition: { x: 0, y: 0, z: 1.5 },
    description: 'Komfortable Merino-Socken für lange Wanderungen und Reisen.'
  },
  
  'merino-shorts': {
    name: 'Merino-Shorts',
    modelPath: '/3d-assets/models/merino-shorts.glb',
    thumbnail: '/3d-assets/textures/merino-shorts-thumb.jpg',
    defaultColor: '#2E8B57',
    variants: {
      'forest-green': { color: '#2E8B57' },
      'beige': { color: '#F5DEB3' },
      'black': { color: '#000000' }
    },
    cameraPosition: { x: 0, y: 0, z: 2 },
    description: 'Leichte und atmungsaktive Merino-Shorts für warme Tage.'
  },
  
  'merino-beanie': {
    name: 'Merino-Beanie',
    modelPath: '/3d-assets/models/merino-beanie.glb',
    thumbnail: '/3d-assets/textures/merino-beanie-thumb.jpg',
    defaultColor: '#2E8B57',
    variants: {
      'forest-green': { color: '#2E8B57' },
      'beige': { color: '#F5DEB3' },
      'black': { color: '#000000' }
    },
    cameraPosition: { x: 0, y: 0, z: 1.2 },
    description: 'Stilvolle und warme Merino-Beanie für kühle Abende.'
  }
};

// Helper function to get model by product handle
function getProductModel(handle) {
  return WANDERWOLL_PRODUCT_MODELS[handle] || null;
}

// Helper function to get all available models
function getAllProductModels() {
  return Object.keys(WANDERWOLL_PRODUCT_MODELS).map(key => {
    return {
      handle: key,
      ...WANDERWOLL_PRODUCT_MODELS[key]
    };
  });
}

// Helper function to get priority models for MVP
function getMVPProductModels() {
  return ['merino-tshirt', 'merino-hoodie'].map(handle => {
    return {
      handle,
      ...WANDERWOLL_PRODUCT_MODELS[handle]
    };
  });
}

// Export for use in Shopify theme
if (typeof module !== 'undefined') {
  module.exports = {
    WANDERWOLL_PRODUCT_MODELS,
    getProductModel,
    getAllProductModels,
    getMVPProductModels
  };
}
