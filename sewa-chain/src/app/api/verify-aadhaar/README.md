# Aadhaar Verification API

This API endpoint handles privacy-preserving Aadhaar verification using Self Protocol offline SDK for the SewaChain hackathon demo.

## Overview

The `/api/verify-aadhaar` endpoint integrates with Self Protocol to verify Aadhaar credentials while maintaining privacy and generating deterministic hashed identifiers for family registration.

## Key Features

- **Privacy-Preserving**: No raw Aadhaar data is stored or transmitted
- **Deterministic Hashing**: Same inputs always produce the same hashed identifier
- **Self Protocol Integration**: Uses Self Protocol offline SDK for verification
- **Comprehensive Validation**: Validates all required fields and disclosures
- **Error Handling**: Provides specific error codes for different failure scenarios
- **Demo Mode**: Supports mock verification for hackathon demonstration

## API Endpoints

### GET /api/verify-aadhaar

Health check endpoint to verify the service is running.

**Response:**

```json
{
  "status": "success",
  "message": "Aadhaar verification endpoint is running",
  "timestamp": "2025-09-25T11:47:29.826Z"
}
```

### POST /api/verify-aadhaar

Verifies Aadhaar credentials and generates privacy-preserving hashed identifier.

**Request Body:**

```json
{
  "attestationId": "string",
  "proof": "object",
  "publicSignals": ["string"],
  "userContextData": {
    "familySize": "number",
    "location": "string",
    "contactInfo": "string"
  }
}
```

**Success Response:**

```json
{
  "status": "success",
  "result": true,
  "hashedIdentifier": "e78f0fa19061ef25",
  "credentialSubject": {
    "nationality": "IN",
    "gender": "F",
    "minimumAge": true
  }
}
```

**Error Response:**

```json
{
  "status": "error",
  "result": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

## Error Codes

- `MISSING_REQUIRED_FIELDS`: Required fields are missing from request
- `INVALID_REQUEST_DATA`: Request data format is invalid
- `CONFIGURATION_ERROR`: Self Protocol configuration is missing
- `PROOF_VERIFICATION_FAILED`: Self Protocol verification failed
- `INVALID_PROOF`: Verification proof is invalid
- `MISSING_DISCLOSURES`: Required Aadhaar disclosures not provided
- `NETWORK_ERROR`: Network error during verification
- `INTERNAL_SERVER_ERROR`: Internal server error

## Environment Variables

```bash
# Self Protocol Configuration
SELF_BACKEND_SCOPE="sewachain-aadhaar"
SELF_API_KEY="your_self_api_key"  # Use "your_self_api_key" for demo mode
```

## Demo Mode

When `SELF_API_KEY` is set to `"your_self_api_key"`, the API runs in demo mode with mock verification:

- Simulates successful Self Protocol verification
- Returns mock credential subject data
- Generates deterministic hashed identifiers
- Logs verification attempts for debugging

## Privacy-Preserving Identifier Generation

The hashed identifier is generated using:

1. **Primary Identifier**: First public signal (contains Aadhaar hash from Self Protocol)
2. **Salt Generation**: Deterministic salt from stable user data (location, family size, nationality, gender)
3. **HMAC Hashing**: SHA-256 hash with salt for additional security
4. **16-Character Output**: Truncated to 16 characters for URID compatibility

This ensures:

- **Deterministic**: Same inputs always produce same identifier
- **Privacy-Preserving**: No raw Aadhaar data used
- **Unique**: Different families get different identifiers
- **Collision-Resistant**: Cryptographically secure hashing

## Integration with SewaChain

This API is used by:

- Family registration flow (`/register-family`)
- URID generation service
- Blockchain family registration transactions
- Duplicate prevention system

## Testing

Run tests with:

```bash
npm test -- src/app/api/verify-aadhaar/__tests__/route.test.ts
```

## Production Deployment

For production deployment:

1. Configure actual Self Protocol API key
2. Set up proper Self Protocol backend verifier
3. Configure production environment variables
4. Enable proper logging and monitoring
5. Set up rate limiting and security measures

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **2.1**: Privacy-preserving Aadhaar verification using Self Protocol
- **2.2**: Proper Self Protocol backend configuration and initialization
- **2.3**: Aadhaar proof verification using Self Protocol offline SDK
- **7.1**: Privacy protection - no PII stored on blockchain or logs
- **7.2**: Cryptographic hashing for privacy-preserving identifiers
- **7.3**: Secure handling of verification data and session management
