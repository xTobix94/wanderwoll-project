/**
 * WanderWoll essentials - Test Suite Summary Fix
 * 
 * This script fixes the test summary logic in the test suite
 * to ensure proper reporting of test results.
 */

const fs = require('fs');
const path = require('path');

// Path to test suite file
const testSuitePath = path.resolve(__dirname, './test_suite.js');

// Read the test suite file
console.log(`Reading test suite file: ${testSuitePath}`);
let content = fs.readFileSync(testSuitePath, 'utf8');

// Fix the runAllTests method to ensure proper result summary
const runAllTestsRegex = /(async runAllTests\(useMocks = true\) {[\s\S]*?const results = {[\s\S]*?tests: {}\s*};[\s\S]*?\/\/ Run tests in specific order[\s\S]*?results\.tests\.caching[\s\S]*?)(return results;\s*})/;

if (runAllTestsRegex.test(content)) {
  content = content.replace(
    runAllTestsRegex,
    `$1
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
      successRate: \`\${Math.round((passedTests / totalTests) * 100)}%\`
    };
    
    // Save results
    this._saveResults(results);
    
    $2`
  );
  
  console.log('Test summary logic fixed');
} else {
  console.error('Could not update test summary logic');
  process.exit(1);
}

// Also fix the test result logging at the end of the file
const mainRegex = /(if \(require\.main === module\) {[\s\S]*?testSuite\.runAllTests\(\)\.then\(results => {[\s\S]*?console\.log\('Test Summary:'\);)([\s\S]*?)(\}\)\.catch\(error => {)/;

if (mainRegex.test(content)) {
  content = content.replace(
    mainRegex,
    `$1
    if (results && results.summary) {
      console.log(\`Total Tests: \${results.summary.totalTests}\`);
      console.log(\`Passed Tests: \${results.summary.passedTests}\`);
      console.log(\`Success Rate: \${results.summary.successRate}\`);
      console.log(\`Overall Success: \${results.summary.success ? 'YES' : 'NO'}\`);
    } else {
      console.log('Warning: Test results summary not available');
    }
    $3`
  );
  
  console.log('Test result logging fixed');
} else {
  console.error('Could not update test result logging');
  process.exit(1);
}

// Write the fixed content back to the file
fs.writeFileSync(testSuitePath, content);
console.log('Test suite summary fixes complete - results should now display correctly');
