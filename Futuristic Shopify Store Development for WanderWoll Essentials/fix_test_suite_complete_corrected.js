/**
 * WanderWoll essentials - Complete Test Suite Fix (Corrected)
 * 
 * This script completely refactors the test suite to ensure reliable validation
 * of all components, especially the fallback mechanism.
 */

const fs = require('fs');
const path = require('path');

// Path to test suite file
const testSuitePath = path.resolve(__dirname, './test_suite.js');

// Read the test suite file
console.log(`Reading test suite file: ${testSuitePath}`);
let content = fs.readFileSync(testSuitePath, 'utf8');

// Fix the runAllTests method to prevent duplicate test execution
// and ensure fallback test is only run once with proper cache clearing
const runAllTestsRegex = /(async runAllTests\(useMocks = true\) {[\s\S]*?const results = {[\s\S]*?tests: {}\s*};[\s\S]*?\/\/ Run individual tests\s*)([\s\S]*?)(return results;\s*})/;

if (runAllTestsRegex.test(content)) {
  content = content.replace(
    runAllTestsRegex,
    `$1
    // Clear cache before any tests
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
    
    $3`
  );
  
  console.log('Test execution order completely refactored');
} else {
  console.error('Could not update test execution order');
  process.exit(1);
}

// Completely rewrite the testFallbackMechanisms method to ensure it works reliably
const fallbackMethodRegex = /async testFallbackMechanisms\(orchestrator\) {[\s\S]*?}\s*}/;

if (fallbackMethodRegex.test(content)) {
  content = content.replace(
    fallbackMethodRegex,
    `async testFallbackMechanisms(orchestrator) {
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
      const uniqueDesignFile = \`https://example.com/test-design-fallback-\${Date.now()}.png\`;
      
      // Try to process a design upload, which should fall back to Mockey
      const result = await orchestrator.processDesignUpload({
        designFile: uniqueDesignFile,
        productType: 'tshirt',
        colorVariant: 'forest-green'
      });
      
      this.logger.info(\`Fallback test result: \${JSON.stringify(result)}\`);
      
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
      this.logger.error(\`Error testing fallback: \${error.message}\`);
      return {
        success: false,
        error: error.message,
        message: \`Error occurred during fallback test: \${error.message}\`
      };
    }
  }`
  );
  
  console.log('Fallback test method completely rewritten');
} else {
  console.error('Could not find fallback test method');
  process.exit(1);
}

// Write the fixed content back to the file
fs.writeFileSync(testSuitePath, content);
console.log('Test suite fixes complete - all tests should now pass reliably');
