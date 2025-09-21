/**
 * Authentication Example
 * ADCB & Nebras UAE Open Finance Hackathon
 *
 * This example demonstrates how to authenticate with the Open Finance API
 * using OAuth 2.0 client credentials flow with TPP certificates.
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');
const fs = require('fs');

// Load TPP certificates for mTLS
const httpsAgent = new https.Agent({
  cert: fs.readFileSync(process.env.TRANSPORT_CERT_PATH),
  key: fs.readFileSync(process.env.TRANSPORT_KEY_PATH),
  rejectUnauthorized: false // Only for sandbox environment
});

/**
 * Get OAuth access token using client credentials
 * @returns {Promise<{token: string, expiresIn: number}>}
 */
async function getAccessToken() {
  try {
    console.log('🔐 Authenticating with Open Finance API...');

    const response = await axios.post(
      `${process.env.OPENFINANCE_BASE_URL}/oauth/token`,
      new URLSearchParams({
        client_id: process.env.OPENFINANCE_CLIENT_ID,
        client_secret: process.env.OPENFINANCE_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: process.env.OAUTH_SCOPE || 'accounts payments insurance'
      }),
      {
        httpsAgent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const { access_token, expires_in, token_type, scope } = response.data;

    console.log('✅ Authentication successful!');
    console.log(`   Token Type: ${token_type}`);
    console.log(`   Scope: ${scope}`);
    console.log(`   Expires In: ${expires_in} seconds`);
    console.log(`   Token: ${access_token.substring(0, 20)}...`);

    return {
      token: access_token,
      expiresIn: expires_in,
      tokenType: token_type,
      scope: scope
    };
  } catch (error) {
    console.error('❌ Authentication failed!');

    if (error.response) {
      // API returned an error response
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.error || error.response.data.message}`);
      console.error(`   Details:`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('   No response from server. Check your network connection.');
    } else {
      // Error in request setup
      console.error(`   Error: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Refresh token before expiry
 * @param {number} expiresIn - Token expiry time in seconds
 * @returns {NodeJS.Timeout} Timer reference
 */
function setupTokenRefresh(expiresIn) {
  // Refresh token 5 minutes before expiry
  const refreshTime = (expiresIn - 300) * 1000;

  console.log(`⏰ Token refresh scheduled in ${refreshTime / 1000} seconds`);

  return setTimeout(async () => {
    console.log('🔄 Refreshing access token...');
    try {
      const { token, expiresIn: newExpiresIn } = await getAccessToken();
      global.accessToken = token;
      setupTokenRefresh(newExpiresIn);
    } catch (error) {
      console.error('Failed to refresh token:', error.message);
    }
  }, refreshTime);
}

/**
 * Test authenticated API call
 * @param {string} token - Access token
 */
async function testAuthenticatedCall(token) {
  try {
    console.log('\n🧪 Testing authenticated API call...');

    const response = await axios.get(
      `${process.env.OPENFINANCE_BASE_URL}/accounts`,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Authenticated call successful!');
    console.log(`   Found ${response.data.data?.length || 0} accounts`);

    return response.data;
  } catch (error) {
    console.error('❌ Authenticated call failed!');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Message: ${error.response?.data?.message}`);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log(' ADCB & Nebras Open Finance Authentication');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Step 1: Get access token
    const { token, expiresIn } = await getAccessToken();

    // Store token globally (in production, use proper state management)
    global.accessToken = token;

    // Step 2: Test authenticated call
    await testAuthenticatedCall(token);

    // Step 3: Setup automatic token refresh
    const refreshTimer = setupTokenRefresh(expiresIn);

    console.log('\n✨ Authentication flow complete!');
    console.log('You can now use the token for API calls.');

    // Clean up timer on exit (in production app)
    process.on('SIGINT', () => {
      clearTimeout(refreshTimer);
      console.log('\nShutting down...');
      process.exit(0);
    });

  } catch (error) {
    console.error('\n💥 Authentication example failed!');
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  getAccessToken,
  setupTokenRefresh,
  testAuthenticatedCall
};

// Run if executed directly
if (require.main === module) {
  main();
}