# 🏆 ADCB & Nebras UAE Open Finance Hackathon Starter

**Fork this repository to jumpstart your hackathon project!**

This starter repository provides everything you need to build winning Open Finance applications for the ADCB & Nebras UAE hackathon.

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js v19+ installed
- Git installed
- Credentials from Nebras (provided at hackathon kickoff)

### Get Started

1. **Fork this repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork:
   git clone https://github.com/YOUR-USERNAME/open-finance-hackathon-starter.git
   cd open-finance-hackathon-starter
   ```

2. **Set up your environment**
   ```bash
   # Copy the environment template
   cp .env.example .env

   # Edit .env with your Nebras-provided credentials
   # Place your TPP certificates in the certs/ directory
   ```

3. **Install dependencies and test connection**
   ```bash
   # Install dependencies
   npm install

   # Test your sandbox connection
   npm run test:connection
   ```

4. **Choose your starter template**
   ```bash
   # Option 1: React/Next.js
   cd templates/react-nextjs && npm install

   # Option 2: Node.js/Express
   cd templates/nodejs-express && npm install

   # Option 3: Python/FastAPI
   cd templates/python-fastapi && pip install -r requirements.txt
   ```

5. **Start building!**
   ```bash
   npm run dev  # or python main.py for Python
   ```

## 📁 What's Included

### 🔧 Pre-configured Setup
- ✅ Environment configuration template (`.env.example`)
- ✅ Git ignore for sensitive files
- ✅ Certificate directory structure
- ✅ Claude Code Bedrock integration

### 💻 Working Code Examples (`/examples`)
- Authentication flow with OAuth 2.0
- Account information retrieval
- Payment initiation
- Insurance operations
- Transaction history
- Error handling patterns

### 🎯 Starter Templates (`/templates`)
- **React/Next.js**: Modern frontend with API integration
- **Node.js/Express**: Backend API server with middleware
- **Python/FastAPI**: ML-ready backend with async support

### 🛠 Helper Scripts (`/scripts`)
- `test-connection.js` - Verify sandbox connectivity
- `setup.sh` - One-command setup script
- `generate-types.js` - Generate TypeScript types from API

### 📚 Documentation (`/docs`)
- API quick reference
- Common troubleshooting solutions
- Submission guidelines
- Security best practices

### 🔌 Postman Collection (`/postman`)
- Pre-configured API requests
- Environment variables template
- Test scripts included

## 🔑 Credentials Setup

Your Nebras-provided package includes:

1. **TPP Application Credentials**
   ```env
   OPENFINANCE_CLIENT_ID=your_provided_client_id
   OPENFINANCE_CLIENT_SECRET=your_provided_client_secret
   ```

2. **TPP Certificates** (place in `/certs`)
   - `transport.pem` - Transport certificate
   - `transport.key` - Transport private key
   - `signing.pem` - Signing certificate
   - `signing.key` - Signing private key

3. **Claude Code Bedrock Access**
   ```env
   AWS_BEARER_TOKEN_BEDROCK=your_bedrock_key
   CLAUDE_CODE_USE_BEDROCK=1
   ```

## 🏗 Project Structure

```
your-project/
├── src/                    # Your application code
├── certs/                  # TPP certificates (git-ignored)
├── examples/               # Reference implementations
├── scripts/                # Utility scripts
├── postman/                # API testing collections
├── docs/                   # Quick reference guides
├── .env                    # Your credentials (git-ignored)
├── .env.example            # Template for credentials
├── .gitignore              # Pre-configured ignores
├── package.json            # Dependencies
└── README.md               # This file
```

## 🧪 Testing Your Setup

Run these commands to verify everything is working:

```bash
# Test API connectivity
npm run test:connection

# Run example authentication
npm run example:auth

# Test account data retrieval
npm run example:accounts
```

Expected output:
```
✅ Connection successful!
✅ Token obtained: eyJ...
✅ Account data retrieved: 3 accounts found
```

## 🚦 Available API Endpoints

### Core Banking APIs
- `GET /accounts` - List accounts
- `GET /accounts/{id}/balances` - Get balances
- `GET /accounts/{id}/transactions` - Get transactions
- `POST /payments` - Initiate payment
- `GET /payments/{id}` - Get payment status

### Insurance APIs
- `GET /insurance/policies` - List policies
- `POST /insurance/claims` - Submit claim
- `GET /insurance/quotes` - Get quotes

### Service APIs
- `POST /account-opening/applications` - Open account
- `POST /payee-verification` - Verify payee
- `GET /fx/quotes` - Get FX quotes

## 💡 Development Tips

### Use AI Assistance
```bash
# Claude Code is configured with Bedrock
# Use it for rapid development:
# - Generate API integration code
# - Debug authentication issues
# - Create data models
```

### Environment-Specific Config
```javascript
const config = {
  development: {
    baseUrl: 'https://sandbox.openfinance.ae/api/v1',
    debug: true
  },
  production: {
    baseUrl: process.env.PROD_URL,
    debug: false
  }
}
```

### Error Handling Pattern
```javascript
try {
  const response = await apiCall();
  return response.data;
} catch (error) {
  if (error.response?.status === 401) {
    // Refresh token
    const newToken = await refreshAuth();
    return retry(apiCall, newToken);
  }
  throw error;
}
```

## 🏁 Submission Checklist

Before submitting your hackathon project:

- [ ] Code pushed to GitHub repository
- [ ] README includes setup instructions
- [ ] Live demo URL provided (if applicable)
- [ ] API integration working with sandbox
- [ ] Presentation deck prepared (5-10 slides)
- [ ] Video demo recorded (2-3 minutes)
- [ ] Team information updated

## 🆘 Getting Help

### Quick Links
- 📖 [Full Documentation](https://github.com/open-finance-os/docs)
- 💬 [GitHub Discussions](https://github.com/open-finance-os/docs/discussions)
- 🎯 [Hackathon Platform](https://preview--uae-open-finance-hackathon.lovable.app/)
- 🔧 [API Sandbox](https://sandbox.openfinance.ae)

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check CLIENT_ID and CLIENT_SECRET |
| Certificate error | Ensure .pem files are in `/certs` |
| CORS error | Use backend proxy, not direct browser calls |
| Rate limiting | Implement exponential backoff |

### Support Channels
1. **GitHub Discussions** - Technical questions
2. **Hackathon Slack** - Real-time chat
3. **Mentor Sessions** - Scheduled during event

## 📜 License

This starter repository is provided for the ADCB & Nebras UAE Open Finance Hackathon. You're free to use, modify, and build upon it for your hackathon submission.

---

**🎯 Ready to build?** Fork this repo and start creating your innovative Open Finance solution!

**Need the full guide?** Visit [docs.openfinance.ae](https://docs.openfinance.ae)