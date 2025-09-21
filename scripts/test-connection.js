#!/usr/bin/env node

/**
 * Test Connection Script
 * ADCB & Nebras UAE Open Finance Hackathon
 *
 * This script tests your connection to the Open Finance Sandbox
 * and verifies that your credentials and certificates are correctly configured.
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');
const fs = require('fs');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(50)}`, 'cyan');
  log(` ${title}`, 'bright');
  log('='.repeat(50), 'cyan');
}

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

/**
 * Test environment variables
 */
async function testEnvironmentVariables() {
  logSection('Testing Environment Variables');

  const requiredVars = [
    'OPENFINANCE_CLIENT_ID',
    'OPENFINANCE_CLIENT_SECRET',
    'OPENFINANCE_BASE_URL',
    'TRANSPORT_CERT_PATH',
    'TRANSPORT_KEY_PATH'
  ];

  const optionalVars = [
    'SIGNING_CERT_PATH',
    'SIGNING_KEY_PATH',
    'AWS_BEARER_TOKEN_BEDROCK'
  ];

  // Check required variables
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`✅ ${varName}: Set`, 'green');
      results.passed.push(`${varName} configured`);
    } else {
      log(`❌ ${varName}: Missing`, 'red');
      results.failed.push(`${varName} not configured`);
    }
  }

  // Check optional variables
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      log(`✅ ${varName}: Set (optional)`, 'green');
    } else {
      log(`⚠️  ${varName}: Not set (optional)`, 'yellow');
      results.warnings.push(`${varName} not configured (optional)`);
    }
  }
}

/**
 * Test certificate files
 */
async function testCertificates() {
  logSection('Testing Certificates');

  const certFiles = [
    { path: process.env.TRANSPORT_CERT_PATH, name: 'Transport Certificate' },
    { path: process.env.TRANSPORT_KEY_PATH, name: 'Transport Key' }
  ];

  for (const cert of certFiles) {
    if (!cert.path) {
      log(`⚠️  ${cert.name}: Path not configured`, 'yellow');
      results.warnings.push(`${cert.name} path not configured`);
      continue;
    }

    try {
      if (fs.existsSync(cert.path)) {
        const stats = fs.statSync(cert.path);
        if (stats.size > 0) {
          log(`✅ ${cert.name}: Found (${stats.size} bytes)`, 'green');
          results.passed.push(`${cert.name} found`);
        } else {
          log(`❌ ${cert.name}: Empty file`, 'red');
          results.failed.push(`${cert.name} is empty`);
        }
      } else {
        log(`❌ ${cert.name}: File not found at ${cert.path}`, 'red');
        results.failed.push(`${cert.name} not found`);
      }
    } catch (error) {
      log(`❌ ${cert.name}: Error reading file - ${error.message}`, 'red');
      results.failed.push(`${cert.name} read error`);
    }
  }
}

/**
 * Test API connectivity
 */
async function testAPIConnection() {
  logSection('Testing API Connection');

  if (!process.env.OPENFINANCE_BASE_URL) {
    log('❌ Cannot test API - BASE_URL not configured', 'red');
    results.failed.push('API test skipped - no BASE_URL');
    return;
  }

  try {
    log(`📡 Testing connection to ${process.env.OPENFINANCE_BASE_URL}...`, 'cyan');

    // Create HTTPS agent with certificates if available
    let httpsAgent;
    if (process.env.TRANSPORT_CERT_PATH && process.env.TRANSPORT_KEY_PATH) {
      try {
        httpsAgent = new https.Agent({
          cert: fs.readFileSync(process.env.TRANSPORT_CERT_PATH),
          key: fs.readFileSync(process.env.TRANSPORT_KEY_PATH),
          rejectUnauthorized: false // Sandbox only
        });
        log('🔐 Using TPP certificates for connection', 'cyan');
      } catch (error) {
        log('⚠️  Could not load certificates, trying without...', 'yellow');
      }
    }

    // Test OAuth endpoint
    const response = await axios.post(
      `${process.env.OPENFINANCE_BASE_URL}/oauth/token`,
      new URLSearchParams({
        client_id: process.env.OPENFINANCE_CLIENT_ID,
        client_secret: process.env.OPENFINANCE_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'accounts'
      }),
      {
        httpsAgent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );

    if (response.data.access_token) {
      log('✅ API Connection: Success', 'green');
      log(`✅ Access Token: ${response.data.access_token.substring(0, 20)}...`, 'green');
      log(`✅ Token Type: ${response.data.token_type}`, 'green');
      log(`✅ Expires In: ${response.data.expires_in} seconds`, 'green');
      results.passed.push('API connection successful');
      results.passed.push('OAuth authentication working');

      // Test authenticated endpoint
      await testAuthenticatedEndpoint(response.data.access_token, httpsAgent);
    }
  } catch (error) {
    if (error.response) {
      log(`❌ API Error: ${error.response.status} - ${error.response.statusText}`, 'red');
      log(`   Details: ${JSON.stringify(error.response.data)}`, 'red');
      results.failed.push(`API error: ${error.response.status}`);
    } else if (error.request) {
      log('❌ No response from API - Check network/URL', 'red');
      results.failed.push('No API response');
    } else {
      log(`❌ Connection Error: ${error.message}`, 'red');
      results.failed.push(`Connection error: ${error.message}`);
    }
  }
}

/**
 * Test authenticated endpoint
 */
async function testAuthenticatedEndpoint(token, httpsAgent) {
  try {
    log('\n📊 Testing authenticated endpoint...', 'cyan');

    const response = await axios.get(
      `${process.env.OPENFINANCE_BASE_URL}/accounts`,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.status === 200) {
      log('✅ Authenticated Call: Success', 'green');
      log(`✅ Response: ${response.data.data?.length || 0} accounts found`, 'green');
      results.passed.push('Authenticated API call successful');
    }
  } catch (error) {
    log(`⚠️  Authenticated call failed: ${error.response?.status || error.message}`, 'yellow');
    results.warnings.push('Authenticated call failed (may need consent)');
  }
}

/**
 * Generate summary report
 */
function generateReport() {
  logSection('Test Summary');

  const total = results.passed.length + results.failed.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(0) : 0;

  log(`\nTests Passed: ${results.passed.length}/${total} (${passRate}%)`, 'bright');

  if (results.passed.length > 0) {
    log('\n✅ Passed:', 'green');
    results.passed.forEach(item => log(`   - ${item}`, 'green'));
  }

  if (results.failed.length > 0) {
    log('\n❌ Failed:', 'red');
    results.failed.forEach(item => log(`   - ${item}`, 'red'));
  }

  if (results.warnings.length > 0) {
    log('\n⚠️  Warnings:', 'yellow');
    results.warnings.forEach(item => log(`   - ${item}`, 'yellow'));
  }

  logSection('Next Steps');

  if (results.failed.length === 0) {
    log('🎉 All tests passed! Your environment is ready.', 'green');
    log('\nYou can now:', 'bright');
    log('1. Run example scripts: npm run example:auth', 'cyan');
    log('2. Start building your application', 'cyan');
    log('3. Use the templates in /templates directory', 'cyan');
  } else {
    log('⚠️  Some tests failed. Please fix the issues above.', 'yellow');
    log('\nTo fix:', 'bright');
    log('1. Check your .env file has all required variables', 'cyan');
    log('2. Ensure certificates are in /certs directory', 'cyan');
    log('3. Verify credentials from Nebras are correct', 'cyan');
    log('4. Check network connectivity to sandbox', 'cyan');
  }
}

/**
 * Main execution
 */
async function main() {
  log('\n🏆 ADCB & Nebras Open Finance Hackathon', 'bright');
  log('Connection Test Tool v1.0.0', 'cyan');

  await testEnvironmentVariables();
  await testCertificates();
  await testAPIConnection();
  generateReport();

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run the test
main().catch(error => {
  log(`\n💥 Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});