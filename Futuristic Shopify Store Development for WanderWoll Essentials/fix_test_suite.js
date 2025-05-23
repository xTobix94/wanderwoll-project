/**
 * WanderWoll essentials - Test Suite Fix
 * 
 * This script fixes the test suite to properly validate fallback mechanisms
 * by ensuring cache is cleared before testing fallbacks.
 */

const fs = require('fs');
const path = require('path');

// Path to test suite file
const testSuitePath = path.resolve(__dirname, './test_suite.js');

// Read the test suite file
console.log(`Reading test suite file: ${testSuitePath}`);
let content = fs.readFileSync(testSuitePath, 'utf8');

// Find the testFallbackMechanisms method
const methodRegex = /(async testFallbackMechanisms\(orchestrator\) {[\s\S]*?try {)/;

// Check if the method exists
if (!methodRegex.test(content)) {
  console.error('Could not find testFallbackMechanisms method in test_suite.js');
  process.exit(1);
}

// Add cache clearing before testing fallback
const fixedContent = content.replace(
  methodRegex,
  '$1\n      // Clear cache to ensure fallback is actually tested\n      orchestrator.clearCache();\n      \n      // Use a unique parameter to bypass cache\n      const uniqueDesignFile = `https://example.com/test-design.png?nocache=${Date.now()}`;\n      \n'
);

// Update the design file parameter in the test
const paramRegex = /(designFile: )'https:\/\/example\.com\/test-design\.png'/;
const fixedParams = fixedContent.replace(
  paramRegex,
  '$1uniqueDesignFile'
);

// Write the fixed content back to the file
fs.writeFileSync(testSuitePath, fixedParams);
console.log('Test suite updated to clear cache before fallback test');

// Also update the runAllTests method to run fallback test first
const runAllTestsRegex = /(async runAllTests\(useMocks = true\) {[\s\S]*?const results = {[\s\S]*?tests: {}\s*};[\s\S]*?\/\/ Run individual tests\s*)(results\.tests\.healthCheck = await this\.testHealthCheck\(orchestrator\);)/;

if (runAllTestsRegex.test(fixedParams)) {
  const reorderedTests = fixedParams.replace(
    runAllTestsRegex,
    '$1// Run fallback test first to avoid cache interference\nresults.tests.fallbackMechanisms = await this.testFallbackMechanisms(orchestrator);\n\n    // Run remaining tests\n    $2'
  );
  
  fs.writeFileSync(testSuitePath, reorderedTests);
  console.log('Test execution order updated to run fallback test first');
} else {
  console.warn('Could not update test execution order');
}

console.log('Test suite fixes complete');
