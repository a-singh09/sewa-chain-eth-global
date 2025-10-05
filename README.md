# 🌊 SewaChain - Blockchain-Powered Disaster Relief System

**ETHGlobal New Delhi Hackathon Submission**

[![World Chain](https://img.shields.io/badge/World%20Chain-Mini%20App-blue?style=flat-square&logo=worldcoin)](https://world.org)
[![Self Protocol](https://img.shields.io/badge/Self%20Protocol-Identity%20Verification-green?style=flat-square)](https://self.xyz)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.3-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)

> **Data-driven disaster relief system eliminating duplicate aid distribution through blockchain transparency, real-time analytics, and precise tracking of aid gaps across regions.**

---

#### ETHGlobal Showcase: https://ethglobal.com/showcase/sewachain-k2pxr

---

## 🏆 Competition Tracks

### 📲 World Chain - Best Mini App ($10,000 Prize Pool)

- **Full MiniKit SDK Integration**: Leveraging World App's 23+ million user base
- **World Chain Deployment**: Smart contracts deployed on World Chain testnet
- **Instant Wallet Access**: Utilizing World App's integrated wallet with free transactions
- **Native World App Experience**: Built as a true Mini App for seamless user experience

### 🔐 Self Protocol - Best Offchain SDK Integration ($1,000 Prize)

- **Privacy-First Identity**: Zero-knowledge proof verification of Aadhaar documents
- **Sybil Resistance**: Preventing duplicate registrations without exposing personal data
- **Offline Capability**: QR code verification works without constant internet connectivity
- **Government-Grade Security**: Indian Aadhaar integration for authentic beneficiary verification

---

## 🚀 Project Overview

### The Problem

During natural disasters like floods, earthquakes, and cyclones, **duplicate aid distribution and poor resource allocation** are major challenges:

- Same families receive aid multiple times while others get nothing
- No coordination between different NGOs and relief organizations
- **Zero visibility into which regions are underserved or neglected**
- **No data-driven insights for optimal resource allocation**
- Lack of transparency in aid distribution records
- Fraudulent claims and identity verification issues

### Our Solution: SewaChain

A **blockchain-powered coordination system** that ensures:

- ✅ **Unique Family IDs (URID)** prevent duplicate distributions
- ✅ **World ID verification** for volunteer authentication
- ✅ **Aadhaar verification** via Self Protocol for beneficiary identity
- ✅ **Immutable distribution records** on World Chain
- ✅ **Real-time transparency** for all stakeholders
- ✅ **Data-driven insights** showing underserved regions and aid gaps
- ✅ **Regional analytics** helping NGOs optimize resource allocation

---

## 🛠️ Technical Architecture

### Core Technologies

```
🎯 Frontend: Next.js 15 + MiniKit SDK + Mini Apps UI Kit
🔗 Blockchain: World Chain (Superchain ecosystem)
🛡️ Identity: World ID + Self Protocol (Aadhaar verification)
⚡ Backend: Node.js API routes + PostgreSQL
📱 Mobile: World App Mini App (23M+ users)
🚀 Deployment: Vercel + Hardhat
```

### Smart Contracts (World Chain)

- **`URIDRegistry.sol`**: Manages unique family IDs and prevents duplicates
- **`DistributionTracker.sol`**: Records all aid distributions immutably

### Integration Highlights

- **MiniKit SDK Commands**: `sendTransaction()`, `walletAuth()`, `verify()`, `openUrl()`
- **Self Protocol SDK**: Offchain identity verification with ZK proofs
- **World Chain RPCs**: Seamless blockchain interactions with free gas

---

## ✨ Unique Innovation Points

### 1. **Dual-Track Integration Mastery**

- **World**: First Mini App to integrate disaster relief coordination
- **Self**: Novel use case for Aadhaar verification in humanitarian aid
- **Synergy**: World ID volunteers + Self-verified beneficiaries = complete trust system

### 2. **Offline-First Design**

- QR codes work without internet connectivity
- Self Protocol enables offline Aadhaar verification
- Data sync when connectivity is restored

### 3. **Privacy-Preserving Transparency**

- Zero personal data stored on-chain
- Public distribution records without identity exposure
- ZK proofs ensure authenticity without revealing details

### 4. **Scalable Architecture**

- Built for millions of World App users
- Multi-NGO coordination ready
- Government integration pathways

---

## 🎯 How It Benefits Both Technologies

### Benefits to World Chain Ecosystem

- **Real-World Impact**: Humanitarian use case showcasing blockchain's social good potential
- **User Acquisition**: Disaster relief brings new demographics to World App
- **Mini App Innovation**: Pioneering complex, multi-stakeholder applications
- **Network Effects**: NGOs, volunteers, and beneficiaries joining the ecosystem

### Benefits to Self Protocol

- **Government Integration**: Direct Aadhaar verification opens massive Indian market
- **Humanitarian Use Case**: Powerful demonstration of privacy-preserving identity
- **Offline Capabilities**: Showcases protocol's resilience in crisis situations
- **Scale Demonstration**: Millions of potential verifications during disasters

### Synergistic Benefits

- **Trust Layer**: World ID volunteers + Self-verified beneficiaries = complete trust
- **Privacy + Transparency**: Public aid records with private identity protection
- **Global + Local**: World's global reach with Self's government-grade local verification

---

## 🌊 User Journey

### For Beneficiaries (Disaster Victims)

1. **Registration**: Volunteer scans your Aadhaar using Self Protocol
2. **Verification**: Zero-knowledge proof generated, URID created
3. **QR Generation**: Receive unique QR code for aid collection
4. **Aid Collection**: Present QR at any relief center
5. **Transparency**: View your aid history anytime

### For Volunteers (World ID Verified)

1. **Authentication**: Login with World ID in World App
2. **Registration Mode**: Help families register using Aadhaar verification
3. **Distribution Mode**: Scan QR codes to distribute aid
4. **Blockchain Recording**: All distributions recorded on World Chain
5. **Real-time Dashboard**: Monitor distribution progress

### For NGOs & Organizations

1. **Volunteer Management**: Assign verified volunteers to areas
2. **Real-time Tracking**: Monitor aid distribution in real-time
3. **Duplicate Prevention**: System prevents double distribution automatically
4. **Transparency Reports**: Generate immutable distribution reports

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- World App (for testing Mini App)
- ngrok (for local development)
- Hardhat (for smart contract deployment)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/a-singh09/sewa-chain-eth-global.git
cd sewa-chain-eth-global/sewa-chain

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Fill in your World App credentials and Self Protocol API keys

# Generate auth secret
npx auth secret

# Start development server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Deploy smart contracts to World Chain testnet
npm run deploy:testnet

# Run tests
npm test
```

### Environment Variables Required

```env
# World App Configuration
WORLD_APP_ID=your_app_id
WORLD_APP_ACTION=your_action_id
NEXTAUTH_URL=your_ngrok_url
AUTH_SECRET=generated_secret

# Self Protocol Configuration
SELF_API_URL=https://api.self.xyz
SELF_API_KEY=your_api_key

# World Chain Configuration
WORLD_CHAIN_RPC_URL=https://worldchain-sepolia.rpc.url
PRIVATE_KEY=your_wallet_private_key
```

---

## 📱 Demo & Testing

### Live Demo

- **Mini App**: [Available in World App](https://world.org/mini-app?app_id=app_202ab423d14d43039ce04c0f9b81c0d9&draft_id=meta_555de2aab5ed98779ca8027b272e6585)
- **Web Version**: [https://sewa-chain-eth-global.vercel.app](https://sewa-chain-eth-global.vercel.app)
- **Smart Contracts**: Verified on World Chain testnet

### Test Flow

1. Download World App
2. Open SewaChain Mini App from the above link
3. Test volunteer registration with World ID
4. Test beneficiary registration (using your Aadhaar data or create a mock one using Self App)
5. Test aid distribution flow
6. View blockchain records

---

## 🏗️ Technical Implementation

### MiniKit SDK Integration

```typescript
// Wallet authentication
import { MiniKit } from "@worldcoin/minikit-js";

// Send transaction to World Chain
await MiniKit.sendTransaction({
  transaction: [
    {
      to: contractAddress,
      data: encodedTransactionData,
      value: "0",
    },
  ],
});
```

### Self Protocol Integration

```typescript
// Aadhaar verification
import { Self } from "@selfxyz/core";

// Generate zero-knowledge proof
const proof = await Self.verifyAadhaar({
  qrData: aadhaarQRData,
  proofType: "identity",
});
```

### Smart Contract Deployment

```bash
# Deploy to World Chain testnet
npm run deploy:testnet

# Verify contracts
npm run verify:testnet
```

---

## 🎖️ Competition Compliance

### World Chain Requirements ✅

- [x] Built as Mini App with MiniKit SDK
- [x] Integrated MiniKit SDK commands (`sendTransaction`, `walletAuth`, `verify`)
- [x] Deployed smart contracts to World Chain testnet
- [x] Not gambling or chance-based
- [x] Proof validation in smart contracts and backend

### Self Protocol Requirements ✅

- [x] Implemented Self offchain SDK
- [x] Working identity proofs (Aadhaar verification)
- [x] Privacy-preserving zero-knowledge proofs

---

## 🚧 Future Roadmap

### Phase 1: Post-Hackathon

- [ ] Multi-language support (Hindi, Bengali, Tamil)
- [ ] Enhanced mobile responsiveness
- [ ] Batch QR scanning for volunteers

### Phase 2: Scale & Integration

- [ ] Multi-NGO coordination dashboard
- [ ] Government partnership integration
- [ ] Advanced analytics and reporting
- [ ] IPFS integration for photo evidence

### Phase 3: Global Expansion

- [ ] Multi-country identity verification
- [ ] Cryptocurrency aid distribution
- [ ] AI-powered need assessment
- [ ] IoT sensors for real-time disaster monitoring

---

## 👥 Team

**Built for ETHGlobal New Delhi by:**

- **Anshdeep Singh** - Full Stack Developer & Blockchain Engineer
  - A newbie in Web3

---

## 📊 Impact Metrics

### Potential Scale

- **23+ Million** World App users can access immediately
- **1.4+ Billion** Aadhaar holders in India can be verified
- **100+ Million** people affected by natural disasters annually in India
- **Thousands** of NGOs working in disaster relief

### Demo Success Metrics

- ✅ World ID authentication working
- ✅ Aadhaar verification via Self Protocol
- ✅ Smart contracts deployed on World Chain
- ✅ End-to-end aid distribution flow
- ✅ Real-time transparency dashboard

---

## 🔗 Resources & Links

### Live Links

- **GitHub Repository**: [sewa-chain-eth-global](https://github.com/a-singh09/sewa-chain-eth-global)
- **Live Demo**: [SewaChain Mini App](https://sewa-chain-eth-global.vercel.app)
- **Contract Explorer**: [World Chain Testnet](https://worldchain-sepolia.explorer.thirdweb.com)

### Documentation

- **World Chain Docs**: [docs.worldcoin.org/mini-apps](https://docs.worldcoin.org/mini-apps)
- **Self Protocol Docs**: [docs.self.xyz](https://docs.self.xyz)
- **MiniKit SDK**: [github.com/worldcoin/minikit-js](https://github.com/worldcoin/minikit-js)

### Competition

- **ETHGlobal New Delhi**: [ethglobal.com/events/newdelhi](https://ethglobal.com/events/newdelhi)
- **Track: World Chain Mini Apps**: $10,000 prize pool
- **Track: Self Protocol Integration**: $1,000 prize

---

## 📄 License

MIT License - feel free to fork, contribute, and build upon this project for humanitarian causes.

---

**#ETHGlobalNewDelhi #WorldChain #SelfProtocol #BlockchainForGood #DisasterRelief #Humanitarian #Web3**

> _"Technology should serve humanity, especially in times of crisis."_
