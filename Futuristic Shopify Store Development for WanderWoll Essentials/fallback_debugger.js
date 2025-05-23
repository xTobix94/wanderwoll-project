/**
 * WanderWoll essentials - Pipeline Fallback Debugger
 * 
 * This script identifies and fixes issues with the fallback mechanisms
 * in the 3D mockup pipeline.
 */

const PipelineOrchestrator = require('./orchestrator');
const ConnectorFactory = require('./connector_factory');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  logLevel: 'debug', // Use debug level for more detailed logging
  outputDir: path.resolve(__dirname, '../fallback-test-results'),
  useMocks: true
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Set up the pipeline for testing
 * @returns {Object} - Pipeline orchestrator
 */
function setupPipeline() {
  console.log('Setting up pipeline with mock connectors for fallback testing');
  
  // Create orchestrator with fallback explicitly enabled
  const orchestrator = new PipelineOrchestrator({
    logLevel: CONFIG.logLevel,
    cacheEnabled: true,
    fallbackEnabled: true
  });
  
  // Register mock connectors
  orchestrator.registerConnector('virtualthreads', createMockVirtualThreadsConnector());
  orchestrator.registerConnector('mockey', createMockMockeyConnector());
  orchestrator.registerConnector('cgtrader', createMockCGTraderConnector());
  orchestrator.registerConnector('blender', createMockBlenderConnector());
  orchestrator.registerConnector('shopify', createMockShopifyConnector());
  
  return orchestrator;
}

/**
 * Create a mock VirtualThreads connector that always fails
 */
function createMockVirtualThreadsConnector() {
  return {
    generateMockup: async (options) => {
      console.log('[MOCK] VirtualThreads generateMockup called with:', options);
      console.log('[MOCK] VirtualThreads is simulating a failure');
      
      // Always throw an error to simulate failure
      throw new Error('Simulated VirtualThreads API failure');
    },
    
    checkHealth: async () => {
      return {
        status: 'unhealthy',
        error: 'Simulated unhealthy state',
        timestamp: new Date().toISOString()
      };
    }
  };
}

/**
 * Create a mock Mockey connector
 */
function createMockMockeyConnector() {
  return {
    generateMockup: async (options) => {
      console.log('[MOCK] Mockey generateMockup called with:', options);
      console.log('[MOCK] Mockey is generating a mockup (fallback)');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return {
        success: true,
        mockupUrl: `https://cdn.mockey.ai/mockups/${options.productType}_${options.colorVariant}.png`,
        productType: options.productType,
        colorVariant: options.colorVariant,
        usedFallback: true
      };
    },
    
    generateProductMockup: async (productType, colorVariant) => {
      console.log(`[MOCK] Mockey generateProductMockup called for ${productType} in ${colorVariant}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return {
        success: true,
        mockupUrl: `https://cdn.mockey.ai/mockups/${productType}_${colorVariant}.png`,
        productType,
        colorVariant
      };
    },
    
    checkHealth: async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    }
  };
}

/**
 * Create a mock CGTrader connector
 */
function createMockCGTraderConnector() {
  return {
    getModel: async (productType) => {
      console.log(`[MOCK] CGTrader getModel called for ${productType}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        productType,
        filePath: `/home/ubuntu/wanderwoll-project/external-integrations/cgtrader-assets/models/${productType.toLowerCase()}.glb`,
        format: 'glb'
      };
    },
    
    getFallbackModel: async (productType, colorVariant) => {
      console.log(`[MOCK] CGTrader getFallbackModel called for ${productType} in ${colorVariant}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        productType,
        colorVariant,
        filePath: `/home/ubuntu/wanderwoll-project/external-integrations/cgtrader-assets/models/${productType.toLowerCase()}_${colorVariant}.glb`,
        format: 'glb'
      };
    },
    
    checkHealth: async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    }
  };
}

/**
 * Create a mock Blender connector
 */
function createMockBlenderConnector() {
  return {
    processModel: async (options) => {
      console.log('[MOCK] Blender processModel called with:', options);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        inputFile: options.inputFile,
        outputFile: options.inputFile.replace('.glb', `_processed_${options.colorVariant}.glb`),
        colorVariant: options.colorVariant,
        mode: options.mode
      };
    },
    
    checkHealth: async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    }
  };
}

/**
 * Create a mock Shopify connector
 */
function createMockShopifyConnector() {
  return {
    updateProductMetafields: async (productId, metafields) => {
      console.log(`[MOCK] Shopify updateProductMetafields called for ${productId}:`, metafields);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const results = {};
      
      for (const [key, value] of Object.entries(metafields)) {
        results[key] = {
          success: true,
          data: {
            id: `metafield_${Date.now()}_${key}`,
            namespace: 'wanderwoll',
            key,
            value
          }
        };
      }
      
      return results;
    },
    
    uploadProductImage: async (productId, imageUrl, altText) => {
      console.log(`[MOCK] Shopify uploadProductImage called for ${productId}: ${imageUrl}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        image: {
          id: `image_${Date.now()}`,
          src: imageUrl,
          alt: altText
        }
      };
    },
    
    checkHealth: async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    }
  };
}

/**
 * Test fallback mechanism
 */
async function testFallback() {
  console.log('Testing fallback mechanism with forced VirtualThreads failure');
  
  // Set up pipeline
  const orchestrator = setupPipeline();
  
  try {
    // Process a design upload, which should fall back to Mockey
    const result = await orchestrator.processDesignUpload({
      designFile: 'https://example.com/test-design.png',
      productType: 'tshirt',
      colorVariant: 'forest-green'
    });
    
    console.log('Design upload result:', JSON.stringify(result, null, 2));
    
    // Check if fallback was used
    if (result.usedFallback) {
      console.log('SUCCESS: Fallback mechanism worked correctly');
      return {
        success: true,
        result,
        message: 'Fallback mechanism worked correctly'
      };
    } else {
      console.log('FAILURE: Fallback was not triggered');
      return {
        success: false,
        result,
        message: 'Fallback was not triggered'
      };
    }
  } catch (error) {
    console.error(`Error testing fallback: ${error.message}`);
    return {
      success: false,
      error: error.message,
      message: 'Error occurred during fallback test'
    };
  }
}

/**
 * Fix the fallback mechanism in the orchestrator
 */
function fixFallbackMechanism() {
  console.log('Fixing fallback mechanism in orchestrator.js');
  
  const orchestratorPath = path.resolve(__dirname, './orchestrator.js');
  let content = fs.readFileSync(orchestratorPath, 'utf8');
  
  // Find the processDesignUpload method
  const methodRegex = /(async processDesignUpload\(options\) {[\s\S]*?})\s*catch\s*\(error\)\s*{[\s\S]*?}\s*}/;
  const fallbackFixRegex = /return {\s*\.\.\.fallbackResult,\s*usedFallback: true\s*};/;
  
  if (methodRegex.test(content) && !fallbackFixRegex.test(content)) {
    // Replace the catch block to ensure usedFallback is set
    const fixedContent = content.replace(
      methodRegex,
      `$1 catch (error) {
      this.logger.error(\`Error processing design upload: \${error.message}\`);
      
      // Try fallback if enabled
      if (this.config.fallbackEnabled) {
        try {
          this.logger.info('Attempting fallback to Mockey.ai');
          
          const mockeyConnector = this.getConnector('mockey');
          
          const fallbackResult = await mockeyConnector.generateMockup({
            designFile: options.designFile,
            productType: options.productType,
            colorVariant: options.colorVariant,
            ...options.customOptions
          });
          
          return {
            ...fallbackResult,
            usedFallback: true
          };
        } catch (fallbackError) {
          this.logger.error(\`Fallback also failed: \${fallbackError.message}\`);
          throw new Error(\`Failed to process design upload: \${error.message}\`);
        }
      } else {
        throw error;
      }
    }`
    );
    
    // Write the fixed content back to the file
    fs.writeFileSync(orchestratorPath, fixedContent);
    console.log('Fallback mechanism fixed in orchestrator.js');
    return true;
  } else if (fallbackFixRegex.test(content)) {
    console.log('Fallback mechanism already fixed in orchestrator.js');
    return true;
  } else {
    console.error('Could not find processDesignUpload method in orchestrator.js');
    return false;
  }
}

/**
 * Verify the fix
 */
async function verifyFix() {
  console.log('Verifying fallback mechanism fix');
  
  // Test fallback again
  const result = await testFallback();
  
  // Save result to file
  const resultPath = path.join(CONFIG.outputDir, `fallback-test-result-${Date.now()}.json`);
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(`Test result saved to ${resultPath}`);
  
  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting fallback mechanism debugging');
  
  // Test current fallback
  const initialResult = await testFallback();
  
  if (initialResult.success) {
    console.log('Fallback mechanism is already working correctly');
    return initialResult;
  }
  
  // Fix fallback mechanism
  const fixed = fixFallbackMechanism();
  
  if (!fixed) {
    console.error('Failed to fix fallback mechanism');
    return {
      success: false,
      message: 'Failed to fix fallback mechanism'
    };
  }
  
  // Verify fix
  const verificationResult = await verifyFix();
  
  if (verificationResult.success) {
    console.log('Fallback mechanism has been successfully fixed and verified');
  } else {
    console.error('Fallback mechanism fix could not be verified');
  }
  
  return verificationResult;
}

// Run the script if called directly
if (require.main === module) {
  main().then(result => {
    console.log('Fallback debugging complete');
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message}`);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testFallback,
  fixFallbackMechanism,
  verifyFix
};
