# SewaChain Aadhaar Verification & URID Generation System Design

## Overview

This design document outlines the implementation of Aadhaar verification using Self Protocol and URID generation system for the SewaChain Mini App. The system enables privacy-preserving identity verification for flood relief beneficiaries while maintaining duplicate aid prevention through unique family identifiers.

## Technology Stack & Dependencies

- **Frontend**: Next.js 15 with MiniKit SDK
- **Self Protocol SDK**: `@selfxyz/qrcode` v1.0.13, `@selfxyz/core` v1.1.0-beta.1
- **World Chain**: Smart contract deployment and blockchain interactions
- **Authentication**: World ID for volunteers, Self Protocol for beneficiaries
- **Database**: PostgreSQL for off-chain data storage

## Architecture

### Core Components

```mermaid
graph TB
    A[Volunteer Mobile App] --> B[Aadhaar Verification Component]
    B --> C[Self Protocol QR Code]
    C --> D[Backend Verification Endpoint]
    D --> E[URID Generation Service]
    E --> F[Smart Contract Registry]
    F --> G[World Chain]
    
    H[Beneficiary] --> C
    C --> I[Self Protocol Backend]
    I --> D
    
    D --> J[Database Storage]
    E --> K[QR Code Generator]
```

### Data Flow Architecture

1. **Aadhaar Verification Flow**
   - Volunteer initiates family registration
   - Beneficiary provides Aadhaar offline QR code
   - Self Protocol generates privacy-preserving proof
   - Backend validates proof without storing raw data
   - System generates hashed family identifier

2. **URID Generation Flow**
   - Combines hashed Aadhaar + location + family size
   - Creates 16-character hex identifier
   - Generates QR code for beneficiary
   - Stores URID mapping in database
   - Registers family on World Chain

## Component Architecture

### 1. Aadhaar Verification Component

```typescript
interface AadhaarVerificationProps {
  onVerificationComplete: (hashedId: string) => void;
  onError: (error: Error) => void;
}

interface SelfAppConfig {
  version: 2;
  appName: string;
  scope: string;
  endpoint: string;
  logoBase64: string;
  userId: string;
  endpointType: "staging_https";
  userIdType: "hex";
  userDefinedData: string;
  disclosures: {
    minimumAge: 18;
    nationality: true;
    gender: true;
  };
}
```

**Component Features:**
- Self Protocol QR code generation and display
- Real-time verification status updates
- Privacy-preserving proof handling
- Error boundary for failed verifications

### 2. URID Generation Service

```typescript
interface URIDService {
  generateURID(hashedAadhaar: string, location: string, familySize: number): string;
  generateQRCode(urid: string): Promise<string>;
  validateURID(urid: string): boolean;
  hashURID(urid: string): string;
  storeURIDMapping(urid: string, familyData: FamilyData): Promise<void>;
}

interface FamilyData {
  hashedAadhaar: string;
  location: string;
  familySize: number;
  contactInfo: string;
  registrationTimestamp: number;
}
```

**Service Capabilities:**
- Deterministic URID generation algorithm
- QR code generation with error correction
- URID format validation and checksum
- Database storage with encrypted family data

### 3. Backend Verification Architecture

```typescript
interface VerificationEndpoint {
  endpoint: "/api/verify-aadhaar";
  method: "POST";
  headers: {
    "Content-Type": "application/json";
    "Authorization": "Bearer [API_KEY]";
  };
}

interface VerificationRequest {
  attestationId: string;
  proof: object;
  publicSignals: string[];
  userContextData: object;
}

interface VerificationResponse {
  status: "success" | "error";
  result: boolean;
  hashedIdentifier?: string;
  credentialSubject?: object;
  message?: string;
}
```

## API Endpoints Reference

### POST /api/verify-aadhaar

**Purpose**: Validates Aadhaar proof from Self Protocol and generates hashed family identifier

**Request Schema**:
```json
{
  "attestationId": "1",
  "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...] },
  "publicSignals": ["18", "1", "..."],
  "userContextData": {
    "familySize": 4,
    "location": "Delhi",
    "contactInfo": "+91XXXXXXXX"
  }
}
```

**Response Schema**:
```json
{
  "status": "success",
  "result": true,
  "hashedIdentifier": "a1b2c3d4e5f6g7h8",
  "credentialSubject": {
    "nationality": "IN",
    "gender": "M",
    "minimumAge": true
  }
}
```

### POST /api/generate-urid

**Purpose**: Creates URID from verified Aadhaar data and registers family

**Request Schema**:
```json
{
  "hashedAadhaar": "a1b2c3d4e5f6g7h8",
  "location": "Delhi",
  "familySize": 4,
  "contactInfo": "+91XXXXXXXX"
}
```

**Response Schema**:
```json
{
  "status": "success",
  "urid": "F7A8B9C0D1E2F3G4",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAA...",
  "contractTxHash": "0xabc123..."
}
```

## Security & Privacy Model

### Privacy-Preserving Features

1. **Zero Raw Data Storage**
   - Aadhaar numbers never stored or transmitted
   - Only hashed identifiers used for URID generation
   - Self Protocol ensures zero-knowledge proof verification

2. **Hashing Strategy**
   ```typescript
   const hashedIdentifier = sha256(
     aadhaarNumber + 
     salt + 
     timestamp_day
   );
   ```

3. **URID Generation Algorithm**
   ```typescript
   const urid = sha256(
     hashedAadhaar + 
     normalizedLocation + 
     familySize.toString()
   ).substring(0, 16).toUpperCase();
   ```

### Access Control

- **Volunteer Authentication**: World ID verification required
- **Beneficiary Privacy**: No personal data exposed in URID
- **Database Encryption**: All stored family data encrypted at rest
- **API Rate Limiting**: Prevent abuse and spam registrations

## User Interface Design

### Mobile-First Components

1. **AadhaarVerification Component**
   - Full-screen QR code display
   - Clear instructions in local language
   - Real-time status indicators
   - Error handling with retry options

2. **URID Display Component**
   - Large, scannable QR code
   - URID text for manual entry
   - Save/share functionality
   - Print-friendly format

3. **Registration Flow**
   ```
   Step 1: Basic Family Info
   Step 2: Aadhaar Verification
   Step 3: URID Generation
   Step 4: Confirmation & QR Code
   ```

### Responsive Design Patterns

- **Touch-First Navigation**: Large buttons for elderly users
- **High Contrast**: Suitable for outdoor use
- **Offline Capability**: QR codes work without internet
- **Multi-Language Support**: Hindi, English, and regional languages

## Testing Strategy

### Unit Testing

```typescript
describe('URIDService', () => {
  test('generateURID creates valid 16-character hex', () => {
    const urid = URIDService.generateURID(
      'hashedAadhaar', 
      'Delhi', 
      4
    );
    expect(urid).toMatch(/^[A-F0-9]{16}$/);
  });

  test('validateURID rejects invalid formats', () => {
    expect(URIDService.validateURID('invalid')).toBe(false);
    expect(URIDService.validateURID('A1B2C3D4E5F6G7H8')).toBe(true);
  });
});
```

### Integration Testing

- **Self Protocol Integration**: Mock proof verification
- **Smart Contract Integration**: Test registration and validation
- **QR Code Generation**: Verify scannable output
- **Error Handling**: Test network failures and invalid data

### End-to-End Testing

- **Complete Registration Flow**: From Aadhaar scan to URID generation
- **Cross-Device Testing**: Ensure QR codes work across devices
- **Performance Testing**: Verify response times under load
- **Security Testing**: Attempt to bypass verification

## Configuration Management

### Environment Variables

```bash
# Self Protocol Configuration
NEXT_PUBLIC_SELF_APP_NAME="SewaChain Aadhaar Verification"
NEXT_PUBLIC_SELF_SCOPE="sewachain-aadhaar"
NEXT_PUBLIC_SELF_ENDPOINT="https://your-ngrok-url.com/api/verify-aadhaar"

# Backend Configuration
SELF_BACKEND_SCOPE="sewachain-aadhaar"
SELF_VERIFICATION_ENDPOINT="https://api.self.com/verify"
SELF_API_KEY="your_self_api_key"

# Database Configuration
DATABASE_URL="postgresql://user:pass@localhost:5432/sewachain"
ENCRYPTION_KEY="your_encryption_key"

# Smart Contract Configuration
WORLD_CHAIN_RPC_URL="https://worldchain-mainnet.g.alchemy.com/v2/your-api-key"
URID_REGISTRY_CONTRACT="0x..."
PRIVATE_KEY="your_private_key"
```

### Configuration Validation

```typescript
interface ConfigSchema {
  selfProtocol: {
    appName: string;
    scope: string;
    endpoint: string;
    apiKey: string;
  };
  blockchain: {
    rpcUrl: string;
    contractAddress: string;
    privateKey: string;
  };
  database: {
    url: string;
    encryptionKey: string;
  };
}
```

## Implementation Roadmap

### Phase 1: Self Protocol Integration (4 hours)

1. **Install Dependencies**
   ```bash
   npm install @selfxyz/qrcode @selfxyz/core ethers
   ```

2. **Create AadhaarVerification Component**
   - SelfQRcodeWrapper implementation
   - Error handling and retry logic
   - Success callback with hashed identifier

3. **Backend Verification Endpoint**
   - SelfBackendVerifier setup
   - Proof validation logic
   - Response formatting

### Phase 2: URID Generation System (3 hours)

1. **URIDService Implementation**
   - Hash-based URID generation
   - QR code generation with error correction
   - Database storage and retrieval

2. **Smart Contract Integration**
   - URIDRegistry contract interaction
   - Family registration on blockchain
   - Validation functions

### Phase 3: Integration & Testing (2 hours)

1. **Component Integration**
   - Connect verification to URID generation
   - Complete registration flow
   - Error handling and user feedback

2. **Testing & Validation**
   - Unit tests for core functions
   - Integration tests with mock data
   - End-to-end flow validation

## Error Handling Strategy

### Common Error Scenarios

1. **Self Protocol Verification Failures**
   - Invalid Aadhaar QR code
   - Network connectivity issues
   - Proof verification timeout
   - Duplicate verification attempts

2. **URID Generation Errors**
   - Duplicate URID collision
   - Database connection failures
   - Smart contract transaction failures
   - QR code generation errors

### Recovery Mechanisms

- **Retry Logic**: Automatic retries with exponential backoff
- **Fallback Options**: Alternative verification methods
- **User Guidance**: Clear error messages and next steps
- **Admin Alerts**: Monitoring for critical failures

## Performance Considerations

### Optimization Strategies

- **QR Code Caching**: Pre-generate common QR codes
- **Database Indexing**: Index on URID and hashed identifiers
- **API Rate Limiting**: Prevent abuse while maintaining usability
- **Image Optimization**: Compress QR code images for mobile

### Scalability Planning

- **Horizontal Scaling**: Support multiple backend instances
- **Database Sharding**: Partition by geographic regions
- **CDN Integration**: Cache static assets and QR codes
- **Load Balancing**: Distribute traffic across servers- Real-time verification status updates
- Privacy-preserving proof handling
- Error boundary for failed verifications

### 2. URID Generation Service

```typescript
interface URIDService {
  generateURID(hashedAadhaar: string, location: string, familySize: number): string;
  generateQRCode(urid: string): Promise<string>;
  validateURID(urid: string): boolean;
  hashURID(urid: string): string;
  storeURIDMapping(urid: string, familyData: FamilyData): Promise<void>;
}

interface FamilyData {
  hashedAadhaar: string;
  location: string;
  familySize: number;
  contactInfo: string;
  registrationTimestamp: number;
}
```

**Service Capabilities:**
- Deterministic URID generation algorithm
- QR code generation with error correction
- URID format validation and checksum
- Database storage with encrypted family data

### 3. Backend Verification Architecture

```typescript
interface VerificationEndpoint {
  endpoint: "/api/verify-aadhaar";
  method: "POST";
  headers: {
    "Content-Type": "application/json";
    "Authorization": "Bearer [API_KEY]";
  };
}

interface VerificationRequest {
  attestationId: string;
  proof: object;
  publicSignals: string[];
  userContextData: object;
}

interface VerificationResponse {
  status: "success" | "error";
  result: boolean;
  hashedIdentifier?: string;
  credentialSubject?: object;
  message?: string;
}
```

## API Endpoints Reference

### POST /api/verify-aadhaar

**Purpose**: Validates Aadhaar proof from Self Protocol and generates hashed family identifier

**Request Schema**:
```json
{
  "attestationId": "1",
  "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...] },
  "publicSignals": ["18", "1", "..."],
  "userContextData": {
    "familySize": 4,
    "location": "Delhi",
    "contactInfo": "+91XXXXXXXX"
  }
}
```

**Response Schema**:
```json
{
  "status": "success",
  "result": true,
  "hashedIdentifier": "a1b2c3d4e5f6g7h8",
  "credentialSubject": {
    "nationality": "IN",
    "gender": "M",
    "minimumAge": true
  }
}
```

### POST /api/generate-urid

**Purpose**: Creates URID from verified Aadhaar data and registers family

**Request Schema**:
```json
{
  "hashedAadhaar": "a1b2c3d4e5f6g7h8",
  "location": "Delhi",
  "familySize": 4,
  "contactInfo": "+91XXXXXXXX"
}
```

**Response Schema**:
```json
{
  "status": "success",
  "urid": "F7A8B9C0D1E2F3G4",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAA...",
  "contractTxHash": "0xabc123..."
}
```

## Security & Privacy Model

### Privacy-Preserving Features

1. **Zero Raw Data Storage**
   - Aadhaar numbers never stored or transmitted
   - Only hashed identifiers used for URID generation
   - Self Protocol ensures zero-knowledge proof verification

2. **Hashing Strategy**
   ```typescript
   const hashedIdentifier = sha256(
     aadhaarNumber + 
     salt + 
     timestamp_day
   );
   ```

3. **URID Generation Algorithm**
   ```typescript
   const urid = sha256(
     hashedAadhaar + 
     normalizedLocation + 
     familySize.toString()
   ).substring(0, 16).toUpperCase();
   ```

### Access Control

- **Volunteer Authentication**: World ID verification required
- **Beneficiary Privacy**: No personal data exposed in URID
- **Database Encryption**: All stored family data encrypted at rest
- **API Rate Limiting**: Prevent abuse and spam registrations

## User Interface Design

### Mobile-First Components

1. **AadhaarVerification Component**
   - Full-screen QR code display
   - Clear instructions in local language
   - Real-time status indicators
   - Error handling with retry options

2. **URID Display Component**
   - Large, scannable QR code
   - URID text for manual entry
   - Save/share functionality
   - Print-friendly format

3. **Registration Flow**
   ```
   Step 1: Basic Family Info
   Step 2: Aadhaar Verification
   Step 3: URID Generation
   Step 4: Confirmation & QR Code
   ```

### Responsive Design Patterns

- **Touch-First Navigation**: Large buttons for elderly users
- **High Contrast**: Suitable for outdoor use
- **Offline Capability**: QR codes work without internet
- **Multi-Language Support**: Hindi, English, and regional languages

## Testing Strategy

### Unit Testing

```typescript
describe('URIDService', () => {
  test('generateURID creates valid 16-character hex', () => {
    const urid = URIDService.generateURID(
      'hashedAadhaar', 
      'Delhi', 
      4
    );
    expect(urid).toMatch(/^[A-F0-9]{16}$/);
  });

  test('validateURID rejects invalid formats', () => {
    expect(URIDService.validateURID('invalid')).toBe(false);
    expect(URIDService.validateURID('A1B2C3D4E5F6G7H8')).toBe(true);
  });
});
```

### Integration Testing

- **Self Protocol Integration**: Mock proof verification
- **Smart Contract Integration**: Test registration and validation
- **QR Code Generation**: Verify scannable output
- **Error Handling**: Test network failures and invalid data

### End-to-End Testing

- **Complete Registration Flow**: From Aadhaar scan to URID generation
- **Cross-Device Testing**: Ensure QR codes work across devices
- **Performance Testing**: Verify response times under load
- **Security Testing**: Attempt to bypass verification

## Configuration Management

### Environment Variables

```bash
# Self Protocol Configuration
NEXT_PUBLIC_SELF_APP_NAME="SewaChain Aadhaar Verification"
NEXT_PUBLIC_SELF_SCOPE="sewachain-aadhaar"
NEXT_PUBLIC_SELF_ENDPOINT="https://your-ngrok-url.com/api/verify-aadhaar"

# Backend Configuration
SELF_BACKEND_SCOPE="sewachain-aadhaar"
SELF_VERIFICATION_ENDPOINT="https://api.self.com/verify"
SELF_API_KEY="your_self_api_key"

# Database Configuration
DATABASE_URL="postgresql://user:pass@localhost:5432/sewachain"
ENCRYPTION_KEY="your_encryption_key"

# Smart Contract Configuration
WORLD_CHAIN_RPC_URL="https://worldchain-mainnet.g.alchemy.com/v2/your-api-key"
URID_REGISTRY_CONTRACT="0x..."
PRIVATE_KEY="your_private_key"
```

### Configuration Validation

```typescript
interface ConfigSchema {
  selfProtocol: {
    appName: string;
    scope: string;
    endpoint: string;
    apiKey: string;
  };
  blockchain: {
    rpcUrl: string;
    contractAddress: string;
    privateKey: string;
  };
  database: {
    url: string;
    encryptionKey: string;
  };
}
```

## Implementation Roadmap

### Phase 1: Self Protocol Integration (4 hours)

1. **Install Dependencies**
   ```bash
   npm install @selfxyz/qrcode @selfxyz/core ethers
   ```

2. **Create AadhaarVerification Component**
   - SelfQRcodeWrapper implementation
   - Error handling and retry logic
   - Success callback with hashed identifier

3. **Backend Verification Endpoint**
   - SelfBackendVerifier setup
   - Proof validation logic
   - Response formatting

### Phase 2: URID Generation System (3 hours)

1. **URIDService Implementation**
   - Hash-based URID generation
   - QR code generation with error correction
   - Database storage and retrieval

2. **Smart Contract Integration**
   - URIDRegistry contract interaction
   - Family registration on blockchain
   - Validation functions

### Phase 3: Integration & Testing (2 hours)

1. **Component Integration**
   - Connect verification to URID generation
   - Complete registration flow
   - Error handling and user feedback

2. **Testing & Validation**
   - Unit tests for core functions
   - Integration tests with mock data
   - End-to-end flow validation

## Error Handling Strategy

### Common Error Scenarios

1. **Self Protocol Verification Failures**
   - Invalid Aadhaar QR code
   - Network connectivity issues
   - Proof verification timeout
   - Duplicate verification attempts

2. **URID Generation Errors**
   - Duplicate URID collision
   - Database connection failures
   - Smart contract transaction failures
   - QR code generation errors

### Recovery Mechanisms

- **Retry Logic**: Automatic retries with exponential backoff
- **Fallback Options**: Alternative verification methods
- **User Guidance**: Clear error messages and next steps
- **Admin Alerts**: Monitoring for critical failures

## Performance Considerations

### Optimization Strategies

- **QR Code Caching**: Pre-generate common QR codes
- **Database Indexing**: Index on URID and hashed identifiers
- **API Rate Limiting**: Prevent abuse while maintaining usability
- **Image Optimization**: Compress QR code images for mobile

### Scalability Planning

- **Horizontal Scaling**: Support multiple backend instances
- **Database Sharding**: Partition by geographic regions
- **CDN Integration**: Cache static assets and QR codes
- **Load Balancing**: Distribute traffic across servers








































































































































































































































































































































































































































