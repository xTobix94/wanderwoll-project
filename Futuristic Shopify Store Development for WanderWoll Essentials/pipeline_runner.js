/**
 * WanderWoll essentials - Pipeline Runner
 * 
 * This script initializes and runs the 3D mockup pipeline for WanderWoll essentials.
 */

const PipelineOrchestrator = require('./orchestrator');
const ConnectorFactory = require('./connector_factory');
const PipelineTestSuite = require('./test_suite');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  logLevel: process.env.LOG_LEVEL || 'info',
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  fallbackEnabled: process.env.FALLBACK_ENABLED !== 'false',
  outputDir: path.resolve(__dirname, '../pipeline-output'),
  useMocks: process.env.USE_MOCKS !== 'false'
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Initialize the pipeline
 * @returns {Object} - Initialized pipeline orchestrator
 */
function initializePipeline() {
  console.log(`Initializing 3D mockup pipeline (using ${CONFIG.useMocks ? 'mock' : 'real'} connectors)`);
  
  // Create orchestrator
  const orchestrator = new PipelineOrchestrator({
    logLevel: CONFIG.logLevel,
    cacheEnabled: CONFIG.cacheEnabled,
    fallbackEnabled: CONFIG.fallbackEnabled
  });
  
  // Create connector factory
  const factory = new ConnectorFactory({
    logLevel: CONFIG.logLevel
  });
  
  if (CONFIG.useMocks) {
    // Use test suite to create mock connectors
    const testSuite = new PipelineTestSuite({
      logLevel: CONFIG.logLevel
    });
    
    // Register mock connectors
    orchestrator.registerConnector('virtualthreads', testSuite._createMockVirtualThreadsConnector());
    orchestrator.registerConnector('mockey', testSuite._createMockMockeyConnector());
    orchestrator.registerConnector('cgtrader', testSuite._createMockCGTraderConnector());
    orchestrator.registerConnector('blender', testSuite._createMockBlenderConnector());
    orchestrator.registerConnector('shopify', testSuite._createMockShopifyConnector());
  } else {
    // Register real connectors
    try {
      const vtConnector = factory.createVirtualThreadsConnector();
      orchestrator.registerConnector('virtualthreads', vtConnector);
    } catch (error) {
      console.error(`Failed to create VirtualThreads connector: ${error.message}`);
      process.exit(1);
    }
    
    try {
      const mockeyConnector = factory.createMockeyConnector();
      orchestrator.registerConnector('mockey', mockeyConnector);
    } catch (error) {
      console.error(`Failed to create Mockey connector: ${error.message}`);
      process.exit(1);
    }
    
    // These don't require API keys in our implementation
    const cgtraderConnector = factory.createCGTraderConnector();
    orchestrator.registerConnector('cgtrader', cgtraderConnector);
    
    const blenderConnector = factory.createBlenderConnector();
    orchestrator.registerConnector('blender', blenderConnector);
    
    try {
      const shopifyConnector = factory.createShopifyConnector();
      orchestrator.registerConnector('shopify', shopifyConnector);
    } catch (error) {
      console.error(`Failed to create Shopify connector: ${error.message}`);
      process.exit(1);
    }
  }
  
  return orchestrator;
}

/**
 * Run pipeline health check
 * @param {Object} orchestrator - Pipeline orchestrator
 */
async function runHealthCheck(orchestrator) {
  console.log('Running pipeline health check...');
  
  try {
    const health = await orchestrator.checkHealth();
    
    console.log('Pipeline Health:');
    console.log(`Orchestrator: ${health.orchestrator.status}`);
    
    for (const [name, status] of Object.entries(health.connectors)) {
      console.log(`${name}: ${status.status}`);
      if (status.status !== 'healthy') {
        console.log(`  Error: ${status.error || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error(`Health check failed: ${error.message}`);
  }
}

/**
 * Process a product for Shopify
 * @param {Object} orchestrator - Pipeline orchestrator
 * @param {string} productType - Product type
 */
async function processProduct(orchestrator, productType) {
  console.log(`Processing product: ${productType}`);
  
  try {
    const result = await orchestrator.processProductForShopify({
      productType,
      colorVariants: ['forest-green', 'beige', 'black'],
      generateMockups: true
    });
    
    console.log(`Product processing complete: ${productType}`);
    console.log(`Generated ${Object.keys(result.models).length} model variants`);
    console.log(`Generated ${Object.keys(result.mockups).length} mockup variants`);
    
    // Save result to file
    const resultPath = path.join(CONFIG.outputDir, `${productType}-result.json`);
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(`Results saved to ${resultPath}`);
    
    return result;
  } catch (error) {
    console.error(`Error processing product: ${error.message}`);
    return null;
  }
}

/**
 * Process a design upload
 * @param {Object} orchestrator - Pipeline orchestrator
 * @param {string} designUrl - Design URL
 * @param {string} productType - Product type
 */
async function processDesignUpload(orchestrator, designUrl, productType) {
  console.log(`Processing design upload for ${productType}: ${designUrl}`);
  
  try {
    const results = await orchestrator.generateProductMockups({
      productType,
      designFile: designUrl,
      colorVariants: ['forest-green', 'beige', 'black']
    });
    
    console.log(`Design upload processing complete: ${productType}`);
    console.log(`Generated ${Object.keys(results).length} mockup variants`);
    
    // Save result to file
    const resultPath = path.join(CONFIG.outputDir, `${productType}-design-result.json`);
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${resultPath}`);
    
    return results;
  } catch (error) {
    console.error(`Error processing design upload: ${error.message}`);
    return null;
  }
}

/**
 * Run pipeline tests
 */
async function runTests() {
  console.log('Running pipeline tests...');
  
  const testSuite = new PipelineTestSuite({
    logLevel: CONFIG.logLevel,
    outputDir: path.join(CONFIG.outputDir, 'test-results')
  });
  
  const results = await testSuite.runAllTests(true);
  
  console.log('Test Summary:');
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Passed Tests: ${results.summary.passedTests}`);
  console.log(`Success Rate: ${results.summary.successRate}`);
  console.log(`Overall Success: ${results.summary.success ? 'YES' : 'NO'}`);
  
  return results;
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2] || 'health';
  
  // Initialize pipeline
  const orchestrator = initializePipeline();
  
  switch (command) {
    case 'health':
      await runHealthCheck(orchestrator);
      break;
      
    case 'process':
      const productType = process.argv[3] || 'tshirt';
      await processProduct(orchestrator, productType);
      break;
      
    case 'design':
      const designUrl = process.argv[3] || 'https://example.com/test-design.png';
      const designProductType = process.argv[4] || 'tshirt';
      await processDesignUpload(orchestrator, designUrl, designProductType);
      break;
      
    case 'test':
      await runTests();
      break;
      
    case 'all':
      await runHealthCheck(orchestrator);
      await processProduct(orchestrator, 'tshirt');
      await processProduct(orchestrator, 'hoodie');
      await processDesignUpload(orchestrator, 'https://example.com/test-design.png', 'tshirt');
      await runTests();
      break;
      
    default:
      console.log(`
Usage:
  node pipeline_runner.js [command]

Commands:
  health              - Run pipeline health check
  process [product]   - Process a product (default: tshirt)
  design [url] [prod] - Process a design upload (default: example URL, tshirt)
  test                - Run pipeline tests
  all                 - Run all operations
      `);
      break;
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  initializePipeline,
  runHealthCheck,
  processProduct,
  processDesignUpload,
  runTests
};
