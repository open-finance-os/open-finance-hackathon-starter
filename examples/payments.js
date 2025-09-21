/**
 * Payment Initiation Example
 * ADCB & Nebras UAE Open Finance Hackathon
 *
 * This example demonstrates how to initiate payments, verify payees,
 * and track payment status using the Open Finance APIs.
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { getAccessToken } = require('./auth');

// Load TPP certificates
const httpsAgent = new https.Agent({
  cert: fs.readFileSync(process.env.TRANSPORT_CERT_PATH),
  key: fs.readFileSync(process.env.TRANSPORT_KEY_PATH),
  rejectUnauthorized: false // Sandbox only
});

/**
 * Verify payee details before payment
 * @param {string} token - Access token
 * @param {Object} payeeDetails - Payee information
 * @returns {Promise<Object>} Verification result
 */
async function verifyPayee(token, payeeDetails) {
  try {
    console.log('🔍 Verifying payee...');
    console.log(`   Account: ${payeeDetails.accountNumber}`);
    console.log(`   Name: ${payeeDetails.name}`);

    const response = await axios.post(
      `${process.env.OPENFINANCE_BASE_URL}/payee-verification`,
      {
        account_number: payeeDetails.accountNumber,
        account_name: payeeDetails.name,
        bank_code: payeeDetails.bankCode || 'ADCB'
      },
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    const verification = response.data.data;
    console.log('✅ Payee verified:');
    console.log(`   - Match: ${verification.name_match ? 'Yes' : 'No'}`);
    console.log(`   - Confidence: ${verification.confidence}%`);
    console.log(`   - Status: ${verification.status}`);

    return verification;
  } catch (error) {
    console.error('❌ Payee verification failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a payment initiation request
 * @param {string} token - Access token
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Created payment
 */
async function initiatePayment(token, paymentData) {
  try {
    console.log('\n💸 Initiating payment...');
    console.log(`   Amount: ${paymentData.amount} ${paymentData.currency}`);
    console.log(`   To: ${paymentData.to.name}`);
    console.log(`   Reference: ${paymentData.reference}`);

    // Generate unique payment ID
    const paymentId = `PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const paymentRequest = {
      payment_id: paymentId,
      amount: {
        value: paymentData.amount,
        currency: paymentData.currency || 'AED'
      },
      from: {
        account_id: paymentData.from.accountId,
        account_type: paymentData.from.accountType || 'CURRENT'
      },
      to: {
        account_number: paymentData.to.accountNumber,
        account_name: paymentData.to.name,
        bank_code: paymentData.to.bankCode || 'ADCB',
        bank_name: paymentData.to.bankName
      },
      reference: paymentData.reference,
      description: paymentData.description,
      payment_type: paymentData.type || 'IMMEDIATE',
      execution_date: paymentData.executionDate || new Date().toISOString(),
      metadata: {
        source: 'hackathon_app',
        user_agent: 'Open Finance Hackathon Starter',
        ...paymentData.metadata
      }
    };

    const response = await axios.post(
      `${process.env.OPENFINANCE_BASE_URL}/payments`,
      paymentRequest,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Idempotency-Key': paymentId
        }
      }
    );

    const payment = response.data.data;
    console.log('✅ Payment initiated:');
    console.log(`   - Payment ID: ${payment.payment_id}`);
    console.log(`   - Status: ${payment.status}`);
    console.log(`   - Created: ${payment.created_at}`);

    return payment;
  } catch (error) {
    console.error('❌ Payment initiation failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get payment status
 * @param {string} token - Access token
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Payment status
 */
async function getPaymentStatus(token, paymentId) {
  try {
    console.log(`\n🔄 Checking payment status for ${paymentId}...`);

    const response = await axios.get(
      `${process.env.OPENFINANCE_BASE_URL}/payments/${paymentId}`,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    const payment = response.data.data;
    console.log('✅ Payment status:');
    console.log(`   - Status: ${payment.status}`);
    console.log(`   - Stage: ${payment.processing_stage}`);
    console.log(`   - Updated: ${payment.updated_at}`);

    if (payment.status === 'FAILED' || payment.status === 'REJECTED') {
      console.log(`   - Reason: ${payment.failure_reason}`);
    }

    return payment;
  } catch (error) {
    console.error('❌ Failed to get payment status:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Authorize a payment (for payments requiring authorization)
 * @param {string} token - Access token
 * @param {string} paymentId - Payment ID
 * @param {string} authCode - Authorization code (OTP)
 * @returns {Promise<Object>} Authorization result
 */
async function authorizePayment(token, paymentId, authCode) {
  try {
    console.log(`\n🔐 Authorizing payment ${paymentId}...`);

    const response = await axios.put(
      `${process.env.OPENFINANCE_BASE_URL}/payments/${paymentId}/authorize`,
      {
        authorization_code: authCode,
        authorization_method: 'OTP'
      },
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    const result = response.data.data;
    console.log('✅ Payment authorized:');
    console.log(`   - Status: ${result.status}`);
    console.log(`   - Authorized At: ${result.authorized_at}`);

    return result;
  } catch (error) {
    console.error('❌ Payment authorization failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Cancel a pending payment
 * @param {string} token - Access token
 * @param {string} paymentId - Payment ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancellation result
 */
async function cancelPayment(token, paymentId, reason) {
  try {
    console.log(`\n❌ Cancelling payment ${paymentId}...`);

    const response = await axios.delete(
      `${process.env.OPENFINANCE_BASE_URL}/payments/${paymentId}`,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Cancellation-Reason': reason
        }
      }
    );

    console.log('✅ Payment cancelled successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Payment cancellation failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get payment history
 * @param {string} token - Access token
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of payments
 */
async function getPaymentHistory(token, filters = {}) {
  try {
    console.log('\n📜 Fetching payment history...');

    const params = {
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      status: filters.status,
      from_date: filters.fromDate,
      to_date: filters.toDate,
      account_id: filters.accountId
    };

    const response = await axios.get(
      `${process.env.OPENFINANCE_BASE_URL}/payments`,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params
      }
    );

    const payments = response.data.data || [];
    console.log(`✅ Found ${payments.length} payment(s)`);

    payments.forEach((payment, index) => {
      console.log(`\n   Payment ${index + 1}:`);
      console.log(`   - ID: ${payment.payment_id}`);
      console.log(`   - Amount: ${payment.amount.value} ${payment.amount.currency}`);
      console.log(`   - Status: ${payment.status}`);
      console.log(`   - Date: ${payment.created_at}`);
      console.log(`   - Reference: ${payment.reference}`);
    });

    return payments;
  } catch (error) {
    console.error('❌ Failed to fetch payment history:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Complete payment flow with retry logic
 * @param {string} token - Access token
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Final payment status
 */
async function executePaymentFlow(token, paymentData) {
  try {
    console.log('\n🚀 Starting complete payment flow...');

    // Step 1: Verify payee
    const verification = await verifyPayee(token, paymentData.to);
    if (!verification.name_match) {
      console.warn('⚠️ Payee name does not match. Proceeding with caution...');
    }

    // Step 2: Initiate payment
    const payment = await initiatePayment(token, paymentData);

    // Step 3: If authorization required (sandbox returns OTP: 123456)
    if (payment.status === 'PENDING_AUTHORIZATION') {
      console.log('\n📱 Payment requires authorization (Use OTP: 123456 for sandbox)');
      await authorizePayment(token, payment.payment_id, '123456');
    }

    // Step 4: Monitor payment status
    let finalStatus;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      finalStatus = await getPaymentStatus(token, payment.payment_id);

      if (['COMPLETED', 'FAILED', 'REJECTED'].includes(finalStatus.status)) {
        break;
      }

      attempts++;
      console.log(`   Attempt ${attempts}/${maxAttempts}: Status = ${finalStatus.status}`);
    }

    console.log('\n✨ Payment flow complete!');
    console.log(`   Final Status: ${finalStatus.status}`);

    return finalStatus;
  } catch (error) {
    console.error('💥 Payment flow failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('════════════════════════════════════════');
  console.log(' ADCB & Nebras Payment Initiation Example');
  console.log('════════════════════════════════════════\n');

  try {
    // Get access token
    const { token } = await getAccessToken();

    // Example payment data
    const paymentData = {
      amount: 100.50,
      currency: 'AED',
      from: {
        accountId: 'ACC_001_SANDBOX',
        accountType: 'CURRENT'
      },
      to: {
        accountNumber: '1234567890',
        name: 'John Doe',
        bankCode: 'ADCB',
        bankName: 'Abu Dhabi Commercial Bank'
      },
      reference: 'HACKATHON_TEST_001',
      description: 'Test payment for hackathon',
      type: 'IMMEDIATE',
      metadata: {
        category: 'test',
        project: 'hackathon_demo'
      }
    };

    // Execute complete payment flow
    const result = await executePaymentFlow(token, paymentData);

    // Get payment history
    await getPaymentHistory(token, {
      limit: 5,
      status: 'COMPLETED'
    });

    console.log('\n✨ Payment example complete!');

  } catch (error) {
    console.error('\n💥 Payment example failed!');
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  verifyPayee,
  initiatePayment,
  getPaymentStatus,
  authorizePayment,
  cancelPayment,
  getPaymentHistory,
  executePaymentFlow
};

// Run if executed directly
if (require.main === module) {
  main();
}