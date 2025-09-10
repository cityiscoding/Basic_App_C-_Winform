#!/usr/bin/env node

// Test script for HTTP version selection improvements
const { spawn } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing HTTP Version Selection Improvements\n');

// Create a test proxy file
const testProxy = '127.0.0.1:8080\n127.0.0.1:8081\n';
fs.writeFileSync('test_proxy.txt', testProxy);

// Test cases
const testCases = [
  {
    name: 'HTTP/1.1 Only',
    args: ['node', 'http_tool.js', 'GET', 'http://httpbin.org/get', '5', '1', '10', 'test_proxy.txt', '--http', '1', '--debug'],
    expected: 'HTTP/1.1 only'
  },
  {
    name: 'HTTP/2 Only',
    args: ['node', 'http_tool.js', 'GET', 'https://httpbin.org/get', '5', '1', '10', 'test_proxy.txt', '--http', '2', '--debug'],
    expected: 'HTTP/2 only'
  },
  {
    name: 'Mixed Mode',
    args: ['node', 'http_tool.js', 'GET', 'https://httpbin.org/get', '5', '1', '10', 'test_proxy.txt', '--http', 'mix', '--debug'],
    expected: 'Mixed (HTTP/1.1 + HTTP/2)'
  },
  {
    name: 'Adaptive Mode',
    args: ['node', 'http_tool.js', 'GET', 'https://httpbin.org/get', '5', '1', '10', 'test_proxy.txt', '--adaptive', '--debug'],
    expected: 'Adaptive selection'
  },
  {
    name: 'Performance High',
    args: ['node', 'http_tool.js', 'GET', 'https://httpbin.org/get', '5', '1', '10', 'test_proxy.txt', '--http', '2', '--performance', 'high', '--debug'],
    expected: 'High performance mode'
  }
];

// Function to test a single case
function testCase(testCase) {
  return new Promise((resolve) => {
    console.log(`📋 Testing: ${testCase.name}`);
    
    const child = spawn('node', testCase.args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      const success = output.includes(testCase.expected) || errorOutput.includes(testCase.expected);
      console.log(`   ${success ? '✅' : '❌'} ${testCase.name}: ${success ? 'PASSED' : 'FAILED'}`);
      if (!success) {
        console.log(`   Expected: ${testCase.expected}`);
        console.log(`   Output: ${output.substring(0, 200)}...`);
      }
      resolve(success);
    });
    
    // Kill after 3 seconds
    setTimeout(() => {
      child.kill();
      resolve(false);
    }, 3000);
  });
}

// Run all tests
async function runTests() {
  let passed = 0;
  let total = testCases.length;
  
  for (const testCaseItem of testCases) {
    const result = await testCase(testCaseItem);
    if (result) passed++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! HTTP version selection improvements are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
  
  // Cleanup
  try {
    fs.unlinkSync('test_proxy.txt');
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Run the tests
runTests().catch(console.error);