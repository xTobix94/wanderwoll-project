/**
 * WanderWoll essentials - Complete Test Suite Rewrite
 * 
 * This is a complete rewrite of the test suite to ensure all tests
 * work correctly and independently.
 */

const PipelineOrchestrator = require('./orchestrator');
const ConnectorFactory = require('./connector_factory');
const fs = require('fs');
const path = require('path');

class PipelineTestSuite {
  /**
   * Initialize the test suite
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      logLevel: config.logLevel || 'info',
      outputDir: config.outputDir || path.resolve(__dirname, '../test-results'),
      ...config
    };
    
    // Initialize logger
    this.logger = this._createLogger();
    
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
    
    this.logger.info('Pipeline test suite initialized');
  }
  
  /**
   * Set up the pipeline for testing
   * @param {boolean} useMocks - Whether to use mock connectors
   * @returns {Object} - Pipeline orchestrator
   */
  setupPipeline(useMocks = true) {
    this.logger.info(`Setting up pipeline with mock connectors`);
    
    // Create orchestrator
    const orchestrator = new PipelineOrchestrator({
      logLevel: this.config.logLevel,
      cacheEnabled: true,
      fallbackEnabled: true
    });
    
    // Create connector factory
    const factory = new ConnectorFactory({
      logLevel: this.config.logLevel
    });
    
    if (useMocks) {
      // Register mock connectors
      orchestrator.registerConnector('virtualthreads', this._createMockVirtualThreadsConnector());
      orchestrator.registerConnector('mockey', this._createMockMockeyConnector());
      orchestrator.registerConnector('cgtrader', this._createMockCGTraderConnector());
      orchestrator.registerConnector('blender', this._createMockBlenderConnector());
      orchestrator.registerConnector('shopify', this._createMockShopifyConnector());
    } else {
      // Register real connectors
      // Note: This requires actual API keys and credentials
      try {
        const vtConnector = factory.createVirtualThreadsConnector();
        orchestrator.registerConnector('virtualthreads', vtConnector);
      } catch (error) {
        this.logger.error(`Failed to create VirtualThreads connector: ${error.message}`);
        orchestrator.registerConnector('virtualthreads', this._createMockVirtualThreadsConnector());
      }
      
      try {
        const mockeyConnector = factory.createMockeyConnector();
        orchestrator.registerConnector('mockey', mockeyConnector);
      } catch (error) {
        this.logger.error(`Failed to create Mockey connector: ${error.message}`);
        orchestrator.registerConnector('mockey', this._createMockMockeyConnector());
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
        this.logger.error(`Failed to create Shopify connector: ${error.message}`);
        orchestrator.registerConnector('shopify', this._createMockShopifyConnector());
      }
    }
    
    return orchestrator;
  }
  
  /**
   * Run all tests
   * @param {boolean} useMocks - Whether to use mock connectors
   * @returns {Object} - Test results
   */
  async runAllTests(useMocks = true) {
    this.logger.info('Running all pipeline tests');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // Clear cache before any tests
    const orchestrator = this.setupPipeline(useMocks);
    orchestrator.clearCache();
    
    // Run tests in specific order to avoid interference
    results.tests.healthCheck = await this.testHealthCheck(orchestrator);
    
    // Run fallback test with fresh orchestrator to avoid any cache issues
    const fallbackOrchestrator = this.setupPipeline(useMocks);
    results.tests.fallbackMechanisms = await this.testFallbackMechanisms(fallbackOrchestrator);
    
    // Continue with remaining tests on original orchestrator
    results.tests.designUpload = await this.testDesignUpload(orchestrator);
    results.tests.modelProcessing = await this.testModelProcessing(orchestrator);
    results.tests.productMockups = await this.testProductMockups(orchestrator);
    results.tests.shopifyIntegration = await this.testShopifyIntegration(orchestrator);
    results.tests.caching = await this.testCaching(orchestrator);
    
    // Calculate overall success
    let totalTests = 0;
    let passedTests = 0;
    
    for (const [testName, testResult] of Object.entries(results.tests)) {
      totalTests++;
      if (testResult && testResult.success) {
        passedTests++;
      }
    }
    
    results.summary = {
      totalTests,
      passedTests,
      success: passedTests === totalTests,
      successRate: `${Math.round((passedTests / totalTests) * 100)}%`
    };
    
    // Save results
    this._saveResults(results);
    
    return results;
  }
  
  /**
   * Test health check functionality
   * @param {Object} orchestrator - Pipeline orchestrator
   * @returns {Object} - Test result
   */
  async testHealthCheck(orchestrator) {
    this.logger.info('Testing health check');
    
    try {
      const health = await orchestrator.checkHealth();
      
      // Check if all connectors are healthy
      let allHealthy = true;
      const unhealthyConnectors = [];
      
      for (const [name, status] of Object.entries(health.connectors)) {
        if (status.status !== 'healthy') {
          allHealthy = false;
          unhealthyConnectors.push(name);
        }
      }
      
      return {
        success: allHealthy,
        health,
        message: allHealthy ? 'All connectors are healthy' : `Unhealthy connectors: ${unhealthyConnectors.join(', ')}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test fallback mechanisms
   * @param {Object} orchestrator - Pipeline orchestrator
   * @returns {Object} - Test result
   */
  async testFallbackMechanisms(orchestrator) {
    this.logger.info('Testing fallback mechanisms');
    
    try {
      // Ensure cache is cleared
      orchestrator.clearCache();
      
      // Get VirtualThreads connector and completely replace it with one that always fails
      orchestrator.registerConnector('virtualthreads', {
        generateMockup: async () => {
          this.logger.info('VirtualThreads connector is simulating a failure');
          throw new Error('Simulated VirtualThreads failure for fallback test');
        },
        checkHealth: async () => {
          return {
            status: 'unhealthy',
            error: 'Simulated unhealthy state for fallback test',
            timestamp: new Date().toISOString()
          };
        }
      });
      
      // Use a unique parameter to ensure no cache interference
      const testDesignFile = `https://example.com/test-design-fallback-${Date.now()}.png`;
      
      // Try to process a design upload, which should fall back to Mockey
      const result = await orchestrator.processDesignUpload({
        designFile: testDesignFile,
        productType: 'tshirt',
        colorVariant: 'forest-green'
      });
      
      this.logger.info(`Fallback test result: ${JSON.stringify(result)}`);
      
      // Check if fallback was used
      if (result.usedFallback === true) {
        return {
          success: true,
          result,
          message: 'Fallback mechanism worked correctly'
        };
      } else {
        return {
          success: false,
          result,
          message: 'Fallback was not triggered'
        };
      }
    } catch (error) {
      this.logger.error(`Error testing fallback: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Error occurred during fallback test: ${error.message}`
      };
    }
  }
  
  /**
   * Test design upload functionality
   * @param {Object} orchestrator - Pipeline orchestrator
   * @returns {Object} - Test result
   */
  async testDesignUpload(orchestrator) {
    this.logger.info('Testing design upload');
    
    try {
      // Use a standard test design file
      const testDesignFile = 'https://example.com/test-design.png';
      
      const result = await orchestrator.processDesignUpload({
        designFile: testDesignFile,
        productType: 'tshirt',
        colorVariant: 'forest-green'
      });
      
      return {
        success: result.success,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test 3D model processing
   * @param {Object} orchestrator - Pipeline orchestrator
   * @returns {Object} - Test result
   */
  async testModelProcessing(orchestrator) {
    this.logger.info('Testing 3D model processing');
    
    try {
      const result = await orchestrator.process3DModel({
        productType: 'tshirt',
        colorVariant: 'forest-green',
        processingMode: 'convert'
      });
      
      return {
        success: result.success,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test product mockup generation
   * @param {Object} orchestrator - Pipeline orchestrator
   * @returns {Object} - Test result
   */
  async testProductMockups(orchestrator) {
    this.logger.info('Testing product mockup generation');
    
    try {
      // Ensure variables are properly defined for this test
      const testDesignFile = 'https://example.com/test-design.png';
      
      const result = await orchestrator.generateProductMockups({
        productType: 'tshirt',
        designFile: testDesignFile,
        colorVariants: ['forest-green', 'beige', 'black']
      });
      
      // Check if all variants were successful
      let allSuccessful = true;
      const failedVariants = [];
      
      for (const [variant, variantResult] of Object.entries(result)) {
        if (!variantResult.success) {
          allSuccessful = false;
          failedVariants.push(variant);
        }
      }
      
      return {
        success: allSuccessful,
        result,
        message: allSuccessful ? 'All variants generated successfully' : `Failed variants: ${failedVariants.join(', ')}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test Shopify integration
   * @param {Object} orchestrator - Pipeline orchestrator
   * @returns {Object} - Test result
   */
  async testShopifyIntegration(orchestrator) {
    this.logger.info('Testing Shopify integration');
    
    try {
      const result = await orchestrator.processProductForShopify({
        productType: 'tshirt',
        colorVariants: ['forest-green', 'beige', 'black'],
        generateMockups: true
      });
      
      return {
        success: result.success,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test caching functionality
   * @param {Object} orchestrator - Pipeline orchestrator
   * @returns {Object} - Test result
   */
  async testCaching(orchestrator) {
    this.logger.info('Testing caching');
    
    try {
      // Clear cache
      orchestrator.clearCache();
      
      // Use a standard test design file
      const testDesignFile = 'https://example.com/test-design.png';
      
      // First call should not use cache
      const firstCallStart = Date.now();
      const firstResult = await orchestrator.processDesignUpload({
        designFile: testDesignFile,
        productType: 'tshirt',
        colorVariant: 'forest-green'
      });
      const firstCallDuration = Date.now() - firstCallStart;
      
      // Second call with same parameters should use cache
      const secondCallStart = Date.now();
      const secondResult = await orchestrator.processDesignUpload({
        designFile: testDesignFile,
        productType: 'tshirt',
        colorVariant: 'forest-green'
      });
      const secondCallDuration = Date.now() - secondCallStart;
      
      // Check if second call was faster (indicating cache use)
      const cachingWorked = secondCallDuration < firstCallDuration;
      
      return {
        success: cachingWorked,
        firstCallDuration,
        secondCallDuration,
        speedup: `${Math.round((1 - (secondCallDuration / firstCallDuration)) * 100)}%`,
        message: cachingWorked ? 'Caching is working correctly' : 'Caching does not appear to be working'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Save test results to file
   * @private
   */
  _saveResults(results) {
    const filePath = path.join(this.config.outputDir, `test-results-${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    this.logger.info(`Test results saved to ${filePath}`);
  }
  
  /**
   * Create a mock VirtualThreads connector
   * @private
   */
  _createMockVirtualThreadsConnector() {
    return {
      generateMockup: async (options) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          success: true,
          mockupId: `vt-mockup-${Date.now()}`,
          mockupUrl: `https://cdn.virtualthreads.io/mockups/${options.productType}_${options.colorVariant}.png`,
          productType: options.productType,
          colorVariant: options.colorVariant
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
   * Create a mock Mockey connector
   * @private
   */
  _createMockMockeyConnector() {
    return {
      generateMockup: async (options) => {
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
   * @private
   */
  _createMockCGTraderConnector() {
    return {
      getModel: async (productType) => {
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
        // Simulate API call
        await new P
(Content truncated due to size limit. Use line ranges to read in chunks)