/**
 * Account Information Example
 * ADCB & Nebras UAE Open Finance Hackathon
 *
 * This example demonstrates how to fetch account information,
 * balances, and transactions using the Open Finance APIs.
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const { getAccessToken } = require('./auth');

// Load TPP certificates
const httpsAgent = new https.Agent({
  cert: fs.readFileSync(process.env.TRANSPORT_CERT_PATH),
  key: fs.readFileSync(process.env.TRANSPORT_KEY_PATH),
  rejectUnauthorized: false // Sandbox only
});

/**
 * Fetch all accounts for the authenticated user
 * @param {string} token - Access token
 * @returns {Promise<Array>} List of accounts
 */
async function getAccounts(token) {
  try {
    console.log('📊 Fetching accounts...');

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

    const accounts = response.data.data || [];
    console.log(`✅ Found ${accounts.length} account(s)`);

    accounts.forEach((account, index) => {
      console.log(`\n   Account ${index + 1}:`);
      console.log(`   - ID: ${account.account_id}`);
      console.log(`   - Type: ${account.account_type}`);
      console.log(`   - Currency: ${account.currency}`);
      console.log(`   - Status: ${account.status}`);
    });

    return accounts;
  } catch (error) {
    console.error('❌ Failed to fetch accounts:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get account balance
 * @param {string} token - Access token
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} Account balance
 */
async function getAccountBalance(token, accountId) {
  try {
    console.log(`\n💰 Fetching balance for account ${accountId}...`);

    const response = await axios.get(
      `${process.env.OPENFINANCE_BASE_URL}/accounts/${accountId}/balances`,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    const balance = response.data.data;
    console.log('✅ Balance retrieved:');
    console.log(`   - Available: ${balance.amount} ${balance.currency}`);
    console.log(`   - Current: ${balance.current_balance} ${balance.currency}`);
    console.log(`   - Pending: ${balance.pending_balance} ${balance.currency}`);

    return balance;
  } catch (error) {
    console.error('❌ Failed to fetch balance:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get account transactions
 * @param {string} token - Access token
 * @param {string} accountId - Account ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of transactions
 */
async function getAccountTransactions(token, accountId, options = {}) {
  try {
    console.log(`\n📜 Fetching transactions for account ${accountId}...`);

    const params = {
      limit: options.limit || 10,
      offset: options.offset || 0,
      from_date: options.fromDate,
      to_date: options.toDate,
      sort: options.sort || 'desc'
    };

    const response = await axios.get(
      `${process.env.OPENFINANCE_BASE_URL}/accounts/${accountId}/transactions`,
      {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params
      }
    );

    const transactions = response.data.data || [];
    console.log(`✅ Found ${transactions.length} transaction(s)`);

    transactions.forEach((txn, index) => {
      console.log(`\n   Transaction ${index + 1}:`);
      console.log(`   - ID: ${txn.transaction_id}`);
      console.log(`   - Date: ${txn.date}`);
      console.log(`   - Amount: ${txn.amount} ${txn.currency}`);
      console.log(`   - Type: ${txn.type}`);
      console.log(`   - Description: ${txn.description}`);
      console.log(`   - Balance After: ${txn.balance_after}`);
    });

    return transactions;
  } catch (error) {
    console.error('❌ Failed to fetch transactions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get complete financial snapshot for a user
 * @param {string} token - Access token
 * @returns {Promise<Object>} Financial snapshot
 */
async function getFinancialSnapshot(token) {
  try {
    console.log('\n📸 Creating financial snapshot...');

    // Get all accounts
    const accounts = await getAccounts(token);

    // Get balances and recent transactions for each account
    const accountDetails = await Promise.all(
      accounts.map(async (account) => {
        const [balance, transactions] = await Promise.all([
          getAccountBalance(token, account.account_id),
          getAccountTransactions(token, account.account_id, { limit: 5 })
        ]);

        return {
          ...account,
          balance,
          recentTransactions: transactions
        };
      })
    );

    // Calculate totals
    const totalBalance = accountDetails.reduce((sum, acc) => {
      return sum + parseFloat(acc.balance.amount || 0);
    }, 0);

    const snapshot = {
      timestamp: new Date().toISOString(),
      accountCount: accounts.length,
      totalBalance,
      accounts: accountDetails
    };

    console.log('\n✅ Financial snapshot complete!');
    console.log(`   - Accounts: ${snapshot.accountCount}`);
    console.log(`   - Total Balance: ${snapshot.totalBalance.toFixed(2)} AED`);

    return snapshot;
  } catch (error) {
    console.error('❌ Failed to create snapshot:', error.message);
    throw error;
  }
}

/**
 * Search transactions across all accounts
 * @param {string} token - Access token
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching transactions
 */
async function searchTransactions(token, searchTerm) {
  try {
    console.log(`\n🔍 Searching for transactions matching "${searchTerm}"...`);

    // Get all accounts
    const accounts = await getAccounts(token);

    // Search transactions in each account
    const allTransactions = await Promise.all(
      accounts.map(async (account) => {
        const transactions = await getAccountTransactions(token, account.account_id, {
          limit: 100
        });

        return transactions
          .filter(txn =>
            txn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            txn.merchant?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(txn => ({
            ...txn,
            account_id: account.account_id,
            account_type: account.account_type
          }));
      })
    );

    // Flatten and sort by date
    const matches = allTransactions
      .flat()
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`✅ Found ${matches.length} matching transaction(s)`);

    return matches;
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('════════════════════════════════════════════');
  console.log(' ADCB & Nebras Account Information Example');
  console.log('════════════════════════════════════════════\n');

  try {
    // Get access token
    const { token } = await getAccessToken();

    // Get all accounts
    const accounts = await getAccounts(token);

    if (accounts.length > 0) {
      // Get balance for first account
      await getAccountBalance(token, accounts[0].account_id);

      // Get transactions for first account
      await getAccountTransactions(token, accounts[0].account_id, {
        limit: 5
      });

      // Get complete snapshot
      const snapshot = await getFinancialSnapshot(token);

      // Search for specific transactions
      const searchResults = await searchTransactions(token, 'grocery');

      console.log('\n✨ Account information example complete!');
    } else {
      console.log('\n⚠️ No accounts found for this user.');
    }

  } catch (error) {
    console.error('\n💥 Account example failed!');
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  getAccounts,
  getAccountBalance,
  getAccountTransactions,
  getFinancialSnapshot,
  searchTransactions
};

// Run if executed directly
if (require.main === module) {
  main();
}