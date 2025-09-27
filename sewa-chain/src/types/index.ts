// Global type definitions for the Sewa project

// Self Protocol types
export interface SelfConfig {
  appName: string;
  scope: string;
  endpoint: string;
}

// World ID types
export interface WorldIdConfig {
  appId: string;
  devPortalApiKey: string;
}

// Authentication types
export interface AuthConfig {
  secret: string;
  hmacSecretKey: string;
  authUrl: string;
}

// Application configuration
export interface AppConfig {
  self: SelfConfig;
  worldId: WorldIdConfig;
  auth: AuthConfig;
}

// User authentication state
export interface UserSession {
  isAuthenticated: boolean;
  userId?: string;
  walletAddress?: string;
}

// Payment transaction types
export interface PaymentTransaction {
  id: string;
  amount: string;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
}

// Volunteer Verification types
export enum VerificationLevel {
  Device = 'device',
  Orb = 'orb'
}

export enum VolunteerPermission {
  DISTRIBUTE_AID = 'distribute_aid',
  VERIFY_BENEFICIARIES = 'verify_beneficiaries',
  VIEW_DISTRIBUTION_DATA = 'view_distribution_data',
  MANAGE_INVENTORY = 'manage_inventory'
}

export interface VolunteerSession {
  nullifierHash: string;
  sessionToken: string;
  verificationLevel: VerificationLevel;
  timestamp: number;
  volunteerId: string;
  permissions: VolunteerPermission[];
  expiresAt: number;
  organizationId?: string;
  verifiedAt: number;
}

export interface VerificationError {
  code: string;
  message: string;
  details?: any;
}

export enum VerificationErrorCode {
  MINIKIT_UNAVAILABLE = 'MINIKIT_UNAVAILABLE',
  USER_CANCELLED = 'USER_CANCELLED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  ALREADY_REGISTERED = 'ALREADY_REGISTERED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PROOF = 'INVALID_PROOF'
}

export interface VolunteerVerificationProps {
  onVerified: (volunteerData: VolunteerSession) => void;
  onError?: (error: VerificationError) => void;
  disabled?: boolean;
  className?: string;
}

export interface VerifyVolunteerRequest {
  payload: any; // ISuccessResult from MiniKit
  action: string;
  signal?: string;
}

export interface VerifyVolunteerResponse {
  success: boolean;
  volunteerSession?: VolunteerSession;
  error?: {
    code: string;
    message: string;
  };
}

export type VerificationState = 'idle' | 'pending' | 'success' | 'failed';

// Aadhaar Verification types
export interface AadhaarVerificationRequest {
  attestationId: string;
  proof: object;
  publicSignals: string[];
  userContextData: {
    familySize: number;
    location: string;
    contactInfo: string;
  };
}

export interface AadhaarVerificationResponse {
  status: 'success' | 'error';
  result: boolean;
  hashedIdentifier?: string;
  credentialSubject?: {
    nationality: string;
    gender: string;
    minimumAge: boolean;
  };
  message?: string;
}

// URID types
export interface FamilyData {
  hashedAadhaar: string;
  location: string;
  familySize: number;
  contactInfo: string;
  registrationTimestamp: number;
}

export interface URIDGenerationResult {
  urid: string;
  qrCodeDataURL: string;
  uridHash: string;
}

export interface GenerateURIDRequest {
  hashedAadhaar: string;
  location: string;
  familySize: number;
  contactInfo: string;
  volunteerSession?: string;
}

export interface GenerateURIDResponse {
  status: 'success' | 'error';
  urid?: string;
  qrCode?: string;
  uridHash?: string;
  contractTxHash?: string;
  message?: string;
}

// Aid Distribution types
export enum AidType {
  FOOD = 'FOOD',
  MEDICAL = 'MEDICAL',
  SHELTER = 'SHELTER',
  CLOTHING = 'CLOTHING',
  WATER = 'WATER',
  CASH = 'CASH'
}

export interface Distribution {
  id: string;
  uridHash: string;
  volunteerNullifier: string;
  aidType: AidType;
  quantity: number;
  location: string;
  timestamp: number;
  confirmed: boolean;
}

export interface DistributionRequest {
  urid: string;
  aidType: AidType;
  quantity: number;
  location: string;
  volunteerSession: string;
}

export interface DistributionResponse {
  success: boolean;
  distributionId?: string;
  transactionHash?: string;
  error?: {
    code: string;
    message: string;
  };
}

// Family Registration types
export interface FamilyRegistrationData {
  headOfFamily: string;
  familySize: number;
  location: string;
  contactNumber: string;
}

export interface RegistrationState {
  step: 'basic_info' | 'aadhaar_verification' | 'urid_generation' | 'complete';
  familyData: FamilyRegistrationData;
  hashedAadhaar?: string;
  credentialSubject?: any;
  urid?: string;
  qrCode?: string;
  error?: string;
  isLoading?: boolean;
}

// Dashboard types
export interface DashboardStats {
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