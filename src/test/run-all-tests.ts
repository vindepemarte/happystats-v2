/**
 * Comprehensive Test Runner
 * Runs all test suites and generates reports
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  duration: number;
  coverage?: number;
}

async function runTestSuite(command: string, suiteName: string): Promise<TestResult> {
  console.log(`\n🧪 Running ${suiteName}...`);
  const startTime = Date.now();
  
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    const duration = Date.now() - startTime;
    
    // Parse test results (simplified - would need actual parsing logic)
    const passed = (output.match(/✓/g) || []).length;
    const failed = (output.match(/✗/g) || []).length;
    
    console.log(`✅ ${suiteName} completed: ${passed} passed, ${failed} failed (${duration}ms)`);
    
    return {
      suite: suiteName,
      passed,
      failed,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${suiteName} failed:`, error);
    
    return {
      suite: suiteName,
      passed: 0,
      failed: 1,
      duration,
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...\n');
  
  const testSuites = [
    {
      command: 'npx vitest run src/lib/__tests__',
      name: 'Unit Tests - Utilities',
    },
    {
      command: 'npx vitest run src/components/__tests__',
      name: 'Component Tests',
    },
    {
      command: 'npx vitest run src/app/api/__tests__',
      name: 'API Tests',
    },
    {
      command: 'npx vitest run src/test/integration',
      name: 'Integration Tests',
    },
    {
      command: 'npx vitest run src/test/mobile',
      name: 'Mobile Responsiveness Tests',
    },
  ];
  
  const results: TestResult[] = [];
  
  for (const suite of testSuites) {
    const result = await runTestSuite(suite.command, suite.name);
    results.push(result);
  }
  
  // Generate coverage report
  console.log('\n📊 Generating coverage report...');
  try {
    execSync('npx vitest run --coverage', { stdio: 'inherit' });
  } catch (error) {
    console.error('Coverage generation failed:', error);
  }
  
  // Generate summary report
  generateSummaryReport(results);
  
  // Check if all tests passed
  const totalFailed = results.reduce((sum, result) => sum + result.failed, 0);
  const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
  
  console.log('\n📋 Test Summary:');
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  
  if (totalFailed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed.');
    process.exit(1);
  }
}

function generateSummaryReport(results: TestResult[]) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSuites: results.length,
      totalPassed: results.reduce((sum, r) => sum + r.passed, 0),
      totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    },
    suites: results,
  };
  
  writeFileSync('test-results.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Test report saved to test-results.json');
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };