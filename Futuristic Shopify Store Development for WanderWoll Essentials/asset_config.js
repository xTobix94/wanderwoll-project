/**
 * WanderWoll essentials - CGTrader Asset Configuration
 * 
 * This file contains the configuration for CGTrader assets to be used
 * in the WanderWoll essentials Shopify store.
 */

module.exports = {
  // Base configuration
  baseConfig: {
    outputDir: '../assets',
    shopifyThemeDir: '../../shopify-theme/assets/3d-models',
    blenderPath: 'blender', // Assumes blender is in PATH
    colors: {
      'forest-green': '#2E8B57',
      'beige': '#F5DEB3',
      'black': '#000000'
    }
  },
  
  // Priority assets to download and process
  priorityAssets: [
    {
      name: 'merino-tshirt',
      type: 'clothing',
      searchTerms: ['t-shirt 3d model free', 'realistic t-shirt 3d'],
      recommendedUrls: [
        'https://free3d.com/3d-model/t-shirt-31485.html',
        'https://www.cgtrader.com/free-3d-models/character/clothing/realistic-t-shirt-3d-model'
      ],
      targetPolygons: '10000-15000',
      productType: 'T-shirt',
      priority: 1
    },
    {
      name: 'merino-hoodie',
      type: 'clothing',
      searchTerms: ['hoodie 3d model free', 'sweatshirt 3d model'],
      recommendedUrls: [
        'https://www.cgtrader.com/free-3d-models/character/clothing/hoodie-3d-model',
        'https://free3d.com/3d-model/hoodie-31486.html'
      ],
      targetPolygons: '15000-20000',
      productType: 'Hoodie',
      priority: 2
    },
    {
      name: 'merino-socks',
      type: 'clothing',
      searchTerms: ['socks 3d model free', 'realistic socks 3d'],
      recommendedUrls: [
        'https://www.cgtrader.com/free-3d-models/character/clothing/socks-3d-model',
        'https://free3d.com/3d-model/socks-31487.html'
      ],
      targetPolygons: '5000-8000',
      productType: 'Socks',
      priority: 3
    },
    {
      name: 'merino-shorts',
      type: 'clothing',
      searchTerms: ['shorts 3d model free', 'clothing shorts 3d'],
      recommendedUrls: [
        'https://www.cgtrader.com/free-3d-models/character/clothing/shorts-3d-model',
        'https://free3d.com/3d-model/shorts-31488.html'
      ],
      targetPolygons: '8000-12000',
      productType: 'Shorts',
      priority: 4
    },
    {
      name: 'merino-beanie',
      type: 'clothing',
      searchTerms: ['beanie 3d model free', 'winter hat 3d model'],
      recommendedUrls: [
        'https://www.cgtrader.com/free-3d-models/character/clothing/beanie-3d-model',
        'https://free3d.com/3d-model/beanie-31489.html'
      ],
      targetPolygons: '5000-8000',
      productType: 'Beanie',
      priority: 5
    }
  ],
  
  // Processing options
  processingOptions: {
    convertToGltf: true,
    optimizeModels: true,
    createColorVariants: true,
    generateThumbnails: true,
    uploadToShopify: false // Set to true when ready for production
  },
  
  // Shopify integration
  shopifyIntegration: {
    createProducts: false, // Set to true when ready for production
    updateMetafields: true,
    metafieldNamespace: 'wanderwoll',
    metafieldKeys: {
      has3dModel: 'has_3d_model',
      modelHandle: 'model_handle',
      modelSource: 'model_source'
    }
  }
};
