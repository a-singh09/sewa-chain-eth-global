# SewaChain - ETHGlobal Hackathon Tasks
## Detailed Implementation Tasks for Cursor AI

This document breaks down the SewaChain flood relief coordination system into independent, actionable tasks that can be performed one by one. Each task includes clear acceptance criteria and implementation details based on the spec and World/Self documentation.

---

## Current State Analysis

**✅ COMPLETED:**
- ✅ Next.js 15 project setup with TypeScript using `npx @worldcoin/create-mini-app@latest`
- ✅ All required dependencies installed (@selfxyz/qrcode, @selfxyz/core, @worldcoin/minikit-js, ethers)
- ✅ MiniKit provider setup with proper World App integration
- ✅ Environment configuration template
- ✅ Basic World ID authentication flow
- ✅ NextAuth integration with wallet auth
- ✅ Basic component structure (AuthButton, Verify, Pay, Transaction, etc.)
- ✅ World App Mini Apps UI Kit ready for installation

**🔄 NEEDS MODIFICATION:**
- 🔄 Current app is generic World template - needs SewaChain-specific adaptation
- 🔄 Authentication flow needs volunteer-specific World ID verification
- 🔄 No Self Protocol integration for Aadhaar verification
- 🔄 No URID generation system
- 🔄 No smart contracts for distribution tracking
- 🔄 No flood relief specific UI/UX

---

## Task Breakdown by Phase

### Phase 1: Core Identity Infrastructure

#### Task 1.1: Implement SewaChain Branding & Landing Page
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Requirements:**
- Update app metadata for SewaChain using MiniKit guidelines
- Create mobile-first flood relief themed landing page
- Add SewaChain logo and branding (avoid using "World" in name per guidelines)
- Update navigation for flood relief context
- Ensure mobile-first design as per World App guidelines

**Acceptance Criteria:**
- [ ] App title updated to "SewaChain - Flood Relief Coordination" (following naming guidelines)
- [ ] Landing page explains flood relief use case with clear, approachable language
- [ ] Logo and branding reflect disaster relief theme
- [ ] Mobile-first responsive design implemented
- [ ] Clear call-to-action buttons for volunteers and beneficiaries
- [ ] UI Kit components used where applicable

**Files to modify:**
- `src/app/layout.tsx` - Update metadata
- `src/app/page.tsx` - Create SewaChain landing page
- `src/app/globals.css` - Add SewaChain styling
- Install `@worldcoin/mini-apps-ui-kit-react` for consistent UI

#### Task 1.2: Create Volunteer World ID Verification Component
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.1

**Requirements:**
- Modify existing Verify component for volunteer-specific verification
- Create incognito action "verify-volunteer" in World Developer Portal
- Implement verification with ORB-level requirement for highest security
- Handle volunteer session creation using MiniKit async commands
- Follow MiniKit security guidelines for backend verification

**Acceptance Criteria:**
- [ ] `VolunteerVerification` component created using MiniKit async handlers
- [ ] Uses VerificationLevel.Orb for high security (as per docs recommendation)
- [ ] Action "verify-volunteer" configured in World Developer Portal
- [ ] Backend verification using `verifyCloudProof` from MiniKit
- [ ] Successful verification creates volunteer session token
- [ ] Volunteer nullifier stored for distribution tracking
- [ ] Proper error handling for verification failures

**MiniKit Implementation:**
```typescript
// Uses MiniKit async commands as recommended
const { finalPayload } = await MiniKit.commandsAsync.verify({
  action: 'verify-volunteer',
  verification_level: VerificationLevel.Orb
});
```

**Implementation:**
```typescript
// Component: src/components/VolunteerVerification/index.tsx
interface VolunteerVerificationProps {
  onVerified: (volunteerData: VolunteerSession) => void;
}

// API: src/app/api/verify-volunteer/route.ts
interface VolunteerSession {
  nullifierHash: string;
  sessionToken: string;
  verificationLevel: VerificationLevel;
  timestamp: number;
}
```

#### Task 1.3: Integrate Self Protocol for Aadhaar Verification
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.2

**Requirements:**
- Install and configure Self Protocol SDK
- Create Aadhaar verification QR code component
- Implement backend verification endpoint
- Handle Aadhaar proof verification

**Acceptance Criteria:**
- [ ] `@selfxyz/qrcode` and `@selfxyz/core` properly configured
- [ ] `AadhaarVerification` component displays QR code
- [ ] Backend verification endpoint validates Aadhaar proofs
- [ ] Privacy-preserving proof generation (no raw Aadhaar data stored)
- [ ] Generates hashed family identifier

**Environment Variables:**
```bash
NEXT_PUBLIC_SELF_APP_NAME="SewaChain Aadhaar Verification"
NEXT_PUBLIC_SELF_SCOPE="sewachain-aadhaar"
NEXT_PUBLIC_SELF_ENDPOINT="https://your-ngrok-url.com/api/verify-aadhaar"
```

**Implementation:**
```typescript
// Component: src/components/AadhaarVerification/index.tsx
// API: src/app/api/verify-aadhaar/route.ts
// Service: src/services/selfProtocol.ts
```

#### Task 1.4: Implement URID Generation System
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.3

**Requirements:**
- Create URID generation service
- Generate unique family identifiers
- Create QR codes for URID display
- Implement URID validation

**Acceptance Criteria:**
- [ ] `URIDService` class created with generation logic
- [ ] URID format: 16-character hex from hashed Aadhaar + location + family size
- [ ] QR code generation for URID display
- [ ] URID validation and duplicate prevention
- [ ] Database storage of URID mappings

**Implementation:**
```typescript
// Service: src/services/urid.ts
export class URIDService {
  static generateURID(hashedAadhaar: string, location: string, familySize: number): string
  static generateQRCode(urid: string): Promise<string>
  static validateURID(urid: string): boolean
  static hashURID(urid: string): string
}
```

### Phase 2: Smart Contract Development

#### Task 2.1: Deploy URID Registry Smart Contract
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.4

**Requirements:**
- Create Solidity contract for URID registration
- Deploy to World Chain testnet
- Implement family registration function
- Add URID validation logic

**Acceptance Criteria:**
- [ ] `URIDRegistry.sol` contract created
- [ ] Family registration with URID hash storage
- [ ] Registration event emission
- [ ] URID existence validation
- [ ] Deployed to World Chain with verified contract

**Smart Contract:**
```solidity
// contracts/URIDRegistry.sol
contract URIDRegistry {
    struct Family {
        bytes32 uridHash;
        uint256 familySize;
        uint256 registrationTime;
        bool isActive;
    }
    
    mapping(bytes32 => Family) public families;
    event FamilyRegistered(bytes32 indexed uridHash, uint256 familySize);
    
    function registerFamily(bytes32 _uridHash, uint256 _familySize) external;
    function isValidFamily(bytes32 _uridHash) external view returns (bool);
}
```

#### Task 2.2: Deploy Distribution Tracker Smart Contract
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 2.1

**Requirements:**
- Create contract for aid distribution tracking
- Implement duplicate prevention (24-hour cooldown)
- Record volunteer nullifier and aid type
- Add distribution history retrieval

**Acceptance Criteria:**
- [ ] `DistributionTracker.sol` contract created
- [ ] Aid type enum (FOOD, MEDICAL, SHELTER, CLOTHING)
- [ ] 24-hour duplicate prevention logic
- [ ] Volunteer nullifier tracking
- [ ] Distribution history functions

**Smart Contract:**
```solidity
// contracts/DistributionTracker.sol
contract DistributionTracker {
    enum AidType { FOOD, MEDICAL, SHELTER, CLOTHING }
    
    struct Distribution {
        bytes32 uridHash;
        bytes32 volunteerNullifier;
        AidType aidType;
        uint256 timestamp;
    }
    
    function recordDistribution(bytes32 _uridHash, bytes32 _volunteerNullifier, AidType _aidType) external;
    function getDistributionHistory(bytes32 _uridHash) external view returns (Distribution[] memory);
}
```

#### Task 2.3: Create Contract Integration Service
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Task 2.2

**Requirements:**
- Create service for smart contract interactions
- Implement ethers.js integration
- Add contract ABI imports
- Handle transaction submissions

**Acceptance Criteria:**
- [ ] `ContractService` class created
- [ ] World Chain RPC configuration
- [ ] Contract ABI files in `src/abi/`
- [ ] Family registration and distribution recording functions
- [ ] Error handling for contract interactions

**Implementation:**
```typescript
// Service: src/services/contractService.ts
export class ContractService {
  async registerFamily(uridHash: string, familySize: number): Promise<string>
  async recordDistribution(uridHash: string, volunteerNullifier: string, aidType: AidType): Promise<string>
  async validateFamily(uridHash: string): Promise<boolean>
  async getDistributionHistory(uridHash: string): Promise<Distribution[]>
}
```

### Phase 3: User Interface Implementation

#### Task 3.1: Create Family Registration Flow
**Priority:** High  
**Estimated Time:** 5 hours  
**Dependencies:** Task 1.3, Task 2.3

**Requirements:**
- Create multi-step family registration form
- Integrate Aadhaar verification
- Generate and display URID QR code
- Store registration data

**Acceptance Criteria:**
- [ ] `/register` page created with multi-step form
- [ ] Family details form (name, size, location, contact)
- [ ] Aadhaar verification integration
- [ ] URID generation and QR code display
- [ ] Success page with URID and instructions

**Page Structure:**
```typescript
// src/app/register/page.tsx
// Steps: Basic Info → Aadhaar Verification → URID Generation → Success
```

#### Task 3.2: Create QR Scanner Component
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Task 3.1

**Requirements:**
- Implement QR code scanning for URID using mobile-optimized approach
- Handle camera permissions following MiniKit guidelines
- Parse and validate scanned URID
- Integrate with distribution flow
- Ensure mobile-first experience as per World App standards

**Acceptance Criteria:**
- [ ] `QRScanner` component using html5-qrcode optimized for mobile
- [ ] Camera permission handling with proper error messages
- [ ] URID validation on scan with immediate feedback
- [ ] Error handling for invalid QR codes with retry options
- [ ] Success callback with parsed URID
- [ ] Mobile-responsive design with proper touch targets
- [ ] Loading states and visual feedback

**Implementation:**
```typescript
// Component: src/components/QRScanner/index.tsx
interface QRScannerProps {
  onScan: (urid: string) => void;
  onError: (error: string) => void;
}
// Mobile-optimized QR scanning with proper error handling
```

#### Task 3.3: Create Aid Distribution Interface
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 3.2, Task 2.3

**Requirements:**
- Create distribution recording interface
- Implement URID scanning
- Aid type selection
- Duplicate check and confirmation

**Acceptance Criteria:**
- [ ] `/distribute` page for volunteers
- [ ] QR scanner integration
- [ ] Aid type selection (Food, Medical, Shelter, Clothing)
- [ ] Duplicate distribution prevention
- [ ] Confirmation and blockchain recording

**Page Structure:**
```typescript
// src/app/distribute/page.tsx
// Flow: Scan URID → Validate → Select Aid Type → Confirm → Record
```

#### Task 3.4: Create Real-time Dashboard
**Priority:** Medium  
**Estimated Time:** 4 hours  
**Dependencies:** Task 3.3

**Requirements:**
- Display real-time distribution statistics
- Show recent distributions
- Volunteer activity metrics
- Family registration counts

**Acceptance Criteria:**
- [ ] Dashboard page with key metrics
- [ ] Real-time distribution feed
- [ ] Statistics cards (families registered, distributions made, active volunteers)
- [ ] Recent activity timeline
- [ ] Mobile-responsive design

**Implementation:**
```typescript
// src/app/dashboard/page.tsx
// API: src/app/api/dashboard/stats/route.ts
```

### Phase 4: Mobile Optimization & Testing

#### Task 4.1: Implement Mobile-First Design
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Task 3.4

**Requirements:**
- Optimize all interfaces for mobile
- Implement touch-friendly interactions
- Improve QR scanning on mobile
- Test across devices

**Acceptance Criteria:**
- [ ] All pages responsive on mobile devices
- [ ] Touch-friendly button sizes (minimum 44px)
- [ ] Optimized QR code sizes for mobile scanning
- [ ] Fast loading on mobile networks
- [ ] Proper viewport configuration

#### Task 4.2: Add Progressive Web App Features
**Priority:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Task 4.1

**Requirements:**
- Add PWA manifest
- Implement service worker
- Enable offline support
- Add install prompt

**Acceptance Criteria:**
- [ ] PWA manifest configured
- [ ] Service worker for offline support
- [ ] Install to home screen capability
- [ ] Offline handling for critical functions

#### Task 4.3: Implement Comprehensive Error Handling
**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Task 4.1

**Requirements:**
- Add error boundaries for React components
- Implement API error handling
- User-friendly error messages
- Retry mechanisms

**Acceptance Criteria:**
- [ ] React error boundaries implemented
- [ ] Graceful API error handling
- [ ] User-friendly error messages
- [ ] Retry buttons for failed operations
- [ ] Loading states for all async operations

### Phase 5: Integration & Deployment

#### Task 5.1: Environment Configuration & Deployment
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 4.3

**Requirements:**
- Configure production environment variables
- Set up Vercel deployment
- Configure custom domain
- Test production deployment

**Acceptance Criteria:**
- [ ] Production environment variables configured
- [ ] Vercel deployment successful
- [ ] Custom domain configured (if available)
- [ ] HTTPS properly configured
- [ ] Production testing completed

#### Task 5.2: World App Mini App Registration
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** Task 5.1

**Requirements:**
- Register app in World Developer Portal following approval guidelines
- Configure Mini App settings with proper metadata
- Set up incognito actions for verification
- Test in World App using MiniKit test tools
- Ensure compliance with World App guidelines

**Acceptance Criteria:**
- [ ] App registered in World Developer Portal with approval submission
- [ ] Mini App configuration completed with proper naming (no "World" in name)
- [ ] "verify-volunteer" incognito action created and configured
- [ ] App description follows guidelines (plain, approachable language)
- [ ] Testing in World App successful using QR code testing
- [ ] Deep linking working properly with universal links
- [ ] Metadata images configured for sharing
- [ ] Mobile-first design verified in World App

**Testing Process:**
- Use the QR code generator in Developer Portal for testing
- Test app_id format: `app_xxxxxxxxxx`
- Verify all MiniKit commands work properly in World App

#### Task 5.3: Create Demo Script & Documentation
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** Task 5.2

**Requirements:**
- Create 5-minute demo script
- Document setup instructions
- Create user guide
- Prepare presentation materials

**Acceptance Criteria:**
- [ ] 5-minute demo script created
- [ ] Setup documentation completed
- [ ] User guide for volunteers and beneficiaries
- [ ] Presentation slides prepared
- [ ] Demo video recorded (optional)

### Phase 6: Advanced Features (Optional)

#### Task 6.1: Implement Notification System
**Priority:** Low  
**Estimated Time:** 3 hours  
**Dependencies:** Task 5.2

**Requirements:**
- Request notification permissions using MiniKit Permission command
- Send distribution confirmations via World Developer Portal API
- Implement notification best practices for retention
- Follow World App notification guidelines for quality

**Acceptance Criteria:**
- [ ] Notification permission requests using MiniKit RequestPermission command
- [ ] Distribution confirmation notifications with proper copy
- [ ] Registration success notifications
- [ ] Volunteer activity updates
- [ ] Follow ≤1 notification/day guideline initially
- [ ] Use `${username}` personalization
- [ ] Target ≥15% open rate for home screen badge
- [ ] Proper deep linking with mini_app_path

**MiniKit Implementation:**
```typescript
// Use MiniKit Permission system
await MiniKit.commandsAsync.requestPermission({
  permission: Permission.Notifications
});

// Send via Developer Portal API
fetch('/api/v2/minikit/send-notification', {
  method: 'POST',
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: JSON.stringify({
    app_id: process.env.APP_ID,
    wallet_addresses: [userAddress],
    localisations: [{
      language: 'en',
      title: '🎉 Distribution Confirmed',
      message: 'Hey ${username}, aid distribution recorded successfully!'
    }]
  })
});
```

#### Task 6.2: Add Analytics & Tracking
**Priority:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Task 6.1

**Requirements:**
- Implement basic event tracking
- Track user journeys
- Monitor conversion rates
- Dashboard analytics

**Acceptance Criteria:**
- [ ] Event tracking implemented
- [ ] User journey analytics
- [ ] Conversion rate monitoring
- [ ] Analytics dashboard

---

## Implementation Priority Order

**CRITICAL PATH (Must Complete for MVP):**
1. Task 1.1 → 1.2 → 1.3 → 1.4 (Identity Infrastructure)
2. Task 2.1 → 2.2 → 2.3 (Smart Contracts)
3. Task 3.1 → 3.2 → 3.3 (Core UI)
4. Task 5.1 → 5.2 (Deployment)

**IMPORTANT (For Demo):**
5. Task 3.4 (Dashboard)
6. Task 4.3 (Error Handling)
7. Task 5.3 (Demo Preparation)

**NICE TO HAVE (If Time Permits):**
8. Task 4.1 → 4.2 (Mobile Optimization)
9. Task 6.1 → 6.2 (Advanced Features)

---

## Environment Variables Required

```bash
# World ID Configuration
NEXT_PUBLIC_WORLD_APP_ID="app_staging_xxxxx"
APP_ID="app_staging_xxxxx"
DEV_PORTAL_API_KEY="your_world_dev_portal_key"

# Self Protocol Configuration
NEXT_PUBLIC_SELF_APP_NAME="SewaChain Aadhaar Verification"
NEXT_PUBLIC_SELF_SCOPE="sewachain-aadhaar"
NEXT_PUBLIC_SELF_ENDPOINT="https://your-ngrok-url.com/api/verify-aadhaar"

# World Chain Configuration
NEXT_PUBLIC_WORLD_CHAIN_RPC="https://worldchain-mainnet.g.alchemy.com/v2/your-key"
WORLD_CHAIN_PRIVATE_KEY="your_deployment_private_key"

# Contract Addresses (after deployment)
NEXT_PUBLIC_URID_REGISTRY_ADDRESS="0x..."
NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS="0x..."

# NextAuth Configuration
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="https://your-app-url.com"
```

---

## Testing Checklist

**Before Each Task Completion:**
- [ ] TypeScript compilation successful
- [ ] ESLint passes without errors
- [ ] Component renders without crashes
- [ ] API endpoints return expected responses
- [ ] Mobile responsiveness verified

**Integration Testing:**
- [ ] Full volunteer verification flow
- [ ] Complete family registration process
- [ ] End-to-end distribution recording
- [ ] Dashboard data accuracy
- [ ] World App Mini App functionality

**Production Readiness:**
- [ ] All environment variables configured
- [ ] Error handling implemented
- [ ] Loading states present
- [ ] User feedback mechanisms
- [ ] Performance optimization complete

---

## Key Implementation Notes (MiniKit-Specific)

1. **World ID Integration**: Use VerificationLevel.Orb for volunteers to ensure highest security as per MiniKit docs
2. **Self Protocol**: Keep frontend/backend configurations synchronized per Self docs
3. **Smart Contracts**: Deploy to World Chain testnet first, leveraging free gas for verified humans
4. **URID System**: Ensure privacy - never store raw Aadhaar data, following Self Protocol best practices
5. **Mobile First**: Design all interfaces for mobile-first experience as required by World App guidelines
6. **Error Handling**: Implement comprehensive error handling for all external API calls using MiniKit patterns
7. **Performance**: Optimize QR code generation and scanning for mobile devices using World App standards
8. **MiniKit Commands**: Use async command handlers (`MiniKit.commandsAsync`) for better UX
9. **Notifications**: Follow World App notification quality standards (≥15% open rate for badges)
10. **UI Kit**: Use `@worldcoin/mini-apps-ui-kit-react` components for consistency

This task breakdown provides a clear roadmap for implementing the complete SewaChain system according to the specifications and documentation provided.