# SewaChain - ETHGlobal New Delhi Hackathon Scope
## Simplified MVP for 48-72 Hour Build

### Project Overview
**SewaChain** is a blockchain-powered flood relief coordination system that eliminates duplicate aid distribution through unique family IDs, World ID volunteer verification, and Aadhaar-based beneficiary authentication.

**Target Prizes**: World Chain Mini App + Self Protocol Offchain

---

## Hackathon MVP Scope (Simplified)

### Core Features (Must-Have)
1. **Beneficiary Registration** with Aadhaar verification via Self Protocol
2. **Volunteer Authentication** via World ID 
3. **URID Generation** and QR code system
4. **Aid Distribution Recording** on World Chain
5. **Real-time Distribution Dashboard**

### Out of Scope (Future Enhancements)
- Multi-NGO coordination
- Complex inventory management
- Government integration
- Advanced analytics
- Photo uploads (IPFS)

---

## Technical Stack

```
Frontend: Next.js 14 + MiniKit SDK
Backend: Node.js/Express + Self Protocol SDK
Blockchain: World Chain (single chain only)
Identity: World ID + Self Protocol Aadhaar
Database: PostgreSQL (for off-chain data)
Deployment: Vercel + ngrok (for Mini App testing)
```

---

## Simplified User Flows

### Flow 1: Beneficiary Registration (5 minutes)
```
1. Volunteer opens SewaChain Mini App
2. Clicks "Register New Family" 
3. Enters basic details (name, family size, location)
4. Family provides Aadhaar offline QR code
5. Self Protocol verifies Aadhaar → generates proof
6. System creates URID → generates QR code
7. Family receives SMS with URID
```

### Flow 2: Volunteer Onboarding (3 minutes)
```
1. Download World App → complete World ID setup
2. Open SewaChain Mini App 
3. Click "Verify as Volunteer"
4. Complete World ID verification via MiniKit
5. System creates volunteer session
6. Volunteer can now register families and distribute aid
```

### Flow 3: Aid Distribution (2 minutes)
```
1. Volunteer scans beneficiary URID QR code
2. System checks: family exists + no recent distribution
3. Volunteer selects aid type (food/medical/shelter)
4. Records distribution → writes to World Chain
5. Updates sent to real-time dashboard
6. Family receives confirmation SMS
```

---

## File Structure

```
sewachain/
├── frontend/                 # Next.js Mini App
│   ├── app/
│   │   ├── layout.tsx       # MiniKit Provider setup
│   │   ├── page.tsx         # Main dashboard
│   │   ├── register/        # Family registration
│   │   ├── distribute/      # Aid distribution
│   │   └── volunteer/       # Volunteer verification
│   ├── components/
│   │   ├── QRScanner.tsx    # QR code scanning
│   │   ├── URIDGenerator.tsx # URID display
│   │   └── DistributionForm.tsx
│   ├── lib/
│   │   ├── worldchain.ts    # Contract interactions
│   │   ├── minikit.ts       # MiniKit utilities
│   │   └── api.ts           # Backend API calls
│   └── public/
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts      # World ID + Self Protocol
│   │   │   ├── families.ts  # URID management
│   │   │   └── distributions.ts
│   │   ├── services/
│   │   │   ├── selfProtocol.ts  # Aadhaar verification
│   │   │   ├── worldId.ts       # World ID verification
│   │   │   └── urid.ts          # URID generation
│   │   ├── db/
│   │   │   └── schema.sql   # Database schema
│   │   └── index.ts
├── contracts/               # Solidity contracts
│   ├── URIDRegistry.sol
│   ├── DistributionTracker.sol
│   └── deploy.ts
└── docs/
    ├── API.md              # API documentation
    ├── SETUP.md            # Development setup
    └── DEMO.md             # Demo script
```

---

## Smart Contracts (Simplified)

### URIDRegistry.sol
```solidity
pragma solidity ^0.8.19;

contract URIDRegistry {
    struct Family {
        bytes32 uridHash;
        uint256 familySize;
        uint256 registrationTime;
        bool isActive;
    }
    
    mapping(bytes32 => Family) public families;
    mapping(bytes32 => bool) public registeredURIDs;
    
    event FamilyRegistered(bytes32 indexed uridHash, uint256 familySize);
    
    function registerFamily(
        bytes32 _uridHash, 
        uint256 _familySize
    ) external {
        require(!registeredURIDs[_uridHash], "URID already exists");
        
        families[_uridHash] = Family({
            uridHash: _uridHash,
            familySize: _familySize,
            registrationTime: block.timestamp,
            isActive: true
        });
        
        registeredURIDs[_uridHash] = true;
        emit FamilyRegistered(_uridHash, _familySize);
    }
    
    function isValidFamily(bytes32 _uridHash) external view returns (bool) {
        return families[_uridHash].isActive;
    }
}
```

### DistributionTracker.sol
```solidity
pragma solidity ^0.8.19;

contract DistributionTracker {
    enum AidType { FOOD, MEDICAL, SHELTER, CLOTHING }
    
    struct Distribution {
        bytes32 uridHash;
        bytes32 volunteerNullifier;
        AidType aidType;
        uint256 timestamp;
        bool confirmed;
    }
    
    mapping(bytes32 => Distribution[]) public familyDistributions;
    mapping(bytes32 => mapping(AidType => uint256)) public lastDistribution;
    
    event DistributionRecorded(
        bytes32 indexed uridHash, 
        bytes32 indexed volunteerNullifier,
        AidType aidType
    );
    
    function recordDistribution(
        bytes32 _uridHash,
        bytes32 _volunteerNullifier,
        AidType _aidType
    ) external {
        // Check for duplicate distribution (24 hour cooldown)
        require(
            block.timestamp - lastDistribution[_uridHash][_aidType] > 24 hours,
            "Recent distribution exists"
        );
        
        Distribution memory newDistribution = Distribution({
            uridHash: _uridHash,
            volunteerNullifier: _volunteerNullifier,
            aidType: _aidType,
            timestamp: block.timestamp,
            confirmed: true
        });
        
        familyDistributions[_uridHash].push(newDistribution);
        lastDistribution[_uridHash][_aidType] = block.timestamp;
        
        emit DistributionRecorded(_uridHash, _volunteerNullifier, _aidType);
    }
    
    function getDistributionHistory(bytes32 _uridHash) 
        external view returns (Distribution[] memory) {
        return familyDistributions[_uridHash];
    }
}
```

---

## Backend API Specification

### POST /api/auth/verify-volunteer
```typescript
// World ID verification for volunteers
interface VerifyVolunteerRequest {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
}

interface VerifyVolunteerResponse {
  success: boolean;
  sessionToken: string;
  volunteerNullifier: string;
}
```

### POST /api/families/register
```typescript
// Family registration with Aadhaar verification
interface RegisterFamilyRequest {
  basicInfo: {
    headOfFamily: string;
    familySize: number;
    location: string;
    contactNumber: string;
  };
  aadhaarProof: {
    offlineQR: string;
    passphrase: string;
  };
  volunteerSession: string;
}

interface RegisterFamilyResponse {
  success: boolean;
  urid: string;
  qrCodeDataURL: string;
}
```

### POST /api/distributions/record
```typescript
// Record aid distribution
interface RecordDistributionRequest {
  urid: string;
  aidType: 'FOOD' | 'MEDICAL' | 'SHELTER' | 'CLOTHING';
  volunteerSession: string;
}

interface RecordDistributionResponse {
  success: boolean;
  transactionHash: string;
  distributionId: string;
}
```

### GET /api/dashboard/stats
```typescript
// Real-time dashboard data
interface DashboardStats {
  totalFamilies: number;
  totalDistributions: number;
  activeVolunteers: number;
  recentDistributions: Array<{
    urid: string;
    aidType: string;
    timestamp: number;
    location: string;
  }>;
}
```

---

## Frontend Components

### MiniKit Setup (app/layout.tsx)
```typescript
'use client';
import { MiniKit } from '@worldcoin/minikit-js';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MiniKit.Provider>
          {children}
        </MiniKit.Provider>
      </body>
    </html>
  );
}
```

### World ID Verification Component
```typescript
'use client';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';

interface VolunteerVerificationProps {
  onVerified: (nullifier: string) => void;
}

export function VolunteerVerification({ onVerified }: VolunteerVerificationProps) {
  const handleVerify = async () => {
    const { finalPayload } = await MiniKit.commands.verify({
      action: 'verify-volunteer',
      verification_level: VerificationLevel.Orb,
    });

    if (finalPayload.status === 'success') {
      // Send to backend for verification
      const response = await fetch('/api/auth/verify-volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });
      
      const data = await response.json();
      if (data.success) {
        onVerified(data.volunteerNullifier);
      }
    }
  };

  return (
    <button onClick={handleVerify} className="btn-primary">
      Verify as Volunteer with World ID
    </button>
  );
}
```

### QR Scanner Component
```typescript
'use client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef } from 'react';

interface QRScannerProps {
  onScan: (urid: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: 250 },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
        scannerRef.current?.clear();
      },
      (error) => console.log('QR scan error:', error)
    );

    return () => {
      scannerRef.current?.clear();
    };
  }, [onScan]);

  return <div id="qr-reader" className="w-full max-w-sm mx-auto" />;
}
```

---

## Backend Services

### Self Protocol Integration
```typescript
// services/selfProtocol.ts
import { SelfSDK } from '@self-protocol/sdk';

export class SelfProtocolService {
  private sdk: SelfSDK;

  constructor() {
    this.sdk = new SelfSDK({
      environment: 'testnet', // or 'mainnet'
    });
  }

  async verifyAadhaar(offlineQR: string, passphrase: string): Promise<{
    isValid: boolean;
    proof: string;
    hashedId: string;
  }> {
    try {
      // Parse offline Aadhaar QR code
      const aadhaarData = this.sdk.parseOfflineQR(offlineQR, passphrase);
      
      // Verify UIDAI digital signature
      const isValidSignature = await this.sdk.verifyUIDAISignature(aadhaarData);
      
      if (!isValidSignature) {
        return { isValid: false, proof: '', hashedId: '' };
      }

      // Generate privacy-preserving proof
      const proof = await this.sdk.generateProof({
        aadhaarData,
        claims: ['identity_verified', 'age_over_18'],
      });

      // Create hashed identifier (no raw Aadhaar number)
      const hashedId = this.sdk.generateHashedId(aadhaarData.uid.slice(-4));

      return {
        isValid: true,
        proof: proof.proofData,
        hashedId,
      };
    } catch (error) {
      console.error('Aadhaar verification failed:', error);
      return { isValid: false, proof: '', hashedId: '' };
    }
  }
}
```

### URID Generation Service
```typescript
// services/urid.ts
import crypto from 'crypto';

export class URIDService {
  static generateURID(
    hashedAadhaar: string,
    location: string,
    familySize: number,
    timestamp: number
  ): string {
    const data = `${hashedAadhaar}-${location}-${familySize}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  static generateQRCode(urid: string): string {
    // Returns base64 QR code image
    const QRCode = require('qrcode');
    return QRCode.toDataURL(urid);
  }

  static hashURID(urid: string): string {
    return crypto.createHash('sha256').update(urid).digest('hex');
  }
}
```

---

## Database Schema

```sql
-- Database schema for off-chain data
CREATE TABLE volunteers (
    id SERIAL PRIMARY KEY,
    nullifier_hash VARCHAR(66) UNIQUE NOT NULL,
    session_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE families (
    id SERIAL PRIMARY KEY,
    urid VARCHAR(32) UNIQUE NOT NULL,
    urid_hash VARCHAR(66) UNIQUE NOT NULL,
    head_of_family VARCHAR(255) NOT NULL,
    family_size INTEGER NOT NULL,
    location VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    is_aadhaar_verified BOOLEAN DEFAULT false,
    registered_by VARCHAR(66) REFERENCES volunteers(nullifier_hash),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE distributions (
    id SERIAL PRIMARY KEY,
    urid VARCHAR(32) REFERENCES families(urid),
    volunteer_nullifier VARCHAR(66) REFERENCES volunteers(nullifier_hash),
    aid_type VARCHAR(20) NOT NULL,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_families_urid_hash ON families(urid_hash);
CREATE INDEX idx_distributions_urid ON distributions(urid);
CREATE INDEX idx_volunteers_nullifier ON volunteers(nullifier_hash);
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_WORLD_APP_ID=app_staging_xxxxx
WORLD_ID_ACTION_ID=verify-volunteer

SELF_PROTOCOL_API_KEY=your_self_protocol_key
SELF_PROTOCOL_ENVIRONMENT=testnet

WORLD_CHAIN_RPC_URL=https://worldchain-rpc-url
PRIVATE_KEY=your_deployment_private_key

DATABASE_URL=postgresql://user:pass@localhost:5432/sewachain
JWT_SECRET=your_jwt_secret

NGROK_AUTH_TOKEN=your_ngrok_token
```

---

## Development Setup Steps

### 1. Project Initialization
```bash
npx create-next-app@latest sewachain --typescript --tailwind --app
cd sewachain
npm install @worldcoin/minikit-js @self-protocol/sdk
npm install ethers qrcode html5-qrcode
npm install -D @types/qrcode
```

### 2. MiniKit Configuration
```bash
# Create World developer portal app
# Note app ID and create action for "verify-volunteer"
# Update environment variables
```

### 3. Backend Setup
```bash
mkdir backend
cd backend
npm init -y
npm install express cors dotenv
npm install ethers pg
npm install -D @types/node nodemon typescript
```

### 4. Smart Contract Deployment
```bash
npm install -g hardhat
npx hardhat init
# Deploy to World Chain testnet
# Update contract addresses in frontend
```

### 5. Database Setup
```bash
createdb sewachain
psql sewachain < schema.sql
```

---

## Demo Script (5 minutes)

### Setup (30 seconds)
- Show flood scenario image
- Explain coordination challenge
- Open SewaChain Mini App

### Part 1: Volunteer Verification (1 minute)
1. Click "Become Volunteer"
2. Trigger World ID verification
3. Complete biometric scan
4. Show volunteer dashboard activated

### Part 2: Family Registration (2 minutes)
1. Click "Register New Family"
2. Enter sample family details
3. Use test Aadhaar QR code
4. Show URID generation and QR code
5. Display family in system

### Part 3: Aid Distribution (1.5 minutes)
1. Scan family URID QR code
2. Select aid type (Food)
3. Record distribution
4. Show blockchain transaction
5. Display real-time dashboard update

### Part 4: Transparency & Impact (30 seconds)
1. Show distribution history
2. Demonstrate duplicate prevention
3. Display impact metrics
4. Highlight transparency features

---

## Prize Compliance Checklist

### World Chain Mini App Prize ✅
- [ ] Built as Mini App using MiniKit SDK
- [ ] World ID verification implemented
- [ ] On-chain transactions on World Chain
- [ ] Mobile-optimized interface
- [ ] Public GitHub repository
- [ ] Demo video created

### Self Protocol Offchain Prize ✅
- [ ] Self Protocol SDK integrated
- [ ] Aadhaar verification working
- [ ] Privacy-preserving proofs generated
- [ ] No PII stored on-chain
- [ ] Offchain verification documented

### General Requirements ✅
- [ ] Start from scratch during hackathon
- [ ] Code commits during event period
- [ ] Clear README with setup instructions
- [ ] Working deployment with live demo
- [ ] Social impact clearly demonstrated

---

## Key Files for Cursor AI Development

### Priority Implementation Order
1. **MiniKit setup** → `app/layout.tsx`
2. **World ID verification** → `components/VolunteerVerification.tsx`
3. **Smart contracts** → `contracts/URIDRegistry.sol`, `contracts/DistributionTracker.sol`
4. **Self Protocol integration** → `services/selfProtocol.ts`
5. **URID generation** → `services/urid.ts`
6. **QR scanner** → `components/QRScanner.tsx`
7. **Distribution flow** → `app/distribute/page.tsx`
8. **Dashboard** → `app/page.tsx`

### Testing Strategy
- Use ngrok for Mini App testing in World App
- Mock Aadhaar QR codes for demo
- Test World ID verification flow
- Verify smart contract interactions
- Test complete user journey end-to-end

This specification provides everything needed for rapid development with Cursor AI while ensuring we build an MVP that demonstrates core value and meets prize requirements.