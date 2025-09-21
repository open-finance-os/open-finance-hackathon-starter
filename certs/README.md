# TPP Certificates Directory

## ⚠️ IMPORTANT SECURITY NOTICE

**NEVER commit certificate files to version control!**

This directory is for storing your TPP certificates provided by Nebras. The `.gitignore` file is configured to exclude all certificate files from being committed.

## Required Certificate Files

Place the following files in this directory (provided by Nebras at hackathon kickoff):

### 1. Transport Certificate & Key
- `transport.pem` - Transport certificate for mTLS
- `transport.key` - Transport private key

### 2. Signing Certificate & Key
- `signing.pem` - Signing certificate for request signatures
- `signing.key` - Signing private key

## File Structure

```
certs/
├── README.md          # This file (safe to commit)
├── transport.pem      # Transport certificate (DO NOT COMMIT)
├── transport.key      # Transport private key (DO NOT COMMIT)
├── signing.pem        # Signing certificate (DO NOT COMMIT)
└── signing.key        # Signing private key (DO NOT COMMIT)
```

## Usage Example

```javascript
const fs = require('fs');
const https = require('https');

// Load certificates for API calls
const httpsAgent = new https.Agent({
  cert: fs.readFileSync('./certs/transport.pem'),
  key: fs.readFileSync('./certs/transport.key'),
  rejectUnauthorized: false // Only for sandbox
});
```

## Security Best Practices

1. **File Permissions**: Set restrictive permissions on certificate files
   ```bash
   chmod 600 certs/*.pem certs/*.key
   ```

2. **Environment Variables**: Reference certificate paths in `.env`
   ```env
   TRANSPORT_CERT_PATH=./certs/transport.pem
   TRANSPORT_KEY_PATH=./certs/transport.key
   ```

3. **Verification**: Verify certificates are valid
   ```bash
   # Check certificate details
   openssl x509 -in transport.pem -text -noout

   # Verify certificate and key match
   openssl x509 -noout -modulus -in transport.pem | openssl md5
   openssl rsa -noout -modulus -in transport.key | openssl md5
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Certificate not found | Ensure files are in `/certs` directory |
| Permission denied | Check file permissions (chmod 600) |
| Invalid certificate | Verify file format is PEM |
| Key mismatch | Ensure cert and key are paired correctly |

## Certificate Formats

If your certificates are in different formats, convert them:

```bash
# Convert P12 to PEM
openssl pkcs12 -in certificate.p12 -out certificate.pem -nodes

# Extract key from P12
openssl pkcs12 -in certificate.p12 -nocerts -out key.pem -nodes

# Convert DER to PEM
openssl x509 -inform DER -in certificate.cer -out certificate.pem
```

## Support

If you have issues with certificates:
1. Verify with Nebras team that certificates are correct
2. Check certificate expiry dates
3. Ensure sandbox environment accepts the certificates
4. Ask in GitHub Discussions for help

---

**Remember**: These certificates are for sandbox/hackathon use only. Production environments will require different certificates and security measures.