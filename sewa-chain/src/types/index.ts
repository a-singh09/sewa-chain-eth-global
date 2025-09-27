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

// Smart Contract types
export interface ContractConfig {
  rpcUrl: string;
  privateKey?: string;
  contractAddresses: {
    uridRegistry: string;
    distributionTracker: string;
  };
  gasSettings: {
    gasLimit: number;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
  chainId: number;
}

export interface Family {
  uridHash: string;
  familySize: number;
  registrationTime: number;
  registeredBy: string;
  isActive: boolean;
  exists: boolean;
}

export interface ContractDistribution {
  uridHash: string;
  volunteerNullifier: string;
  aidType: AidType;
  timestamp: number;
  quantity: number;
  location: string;
  confirmed: boolean;
  exists: boolean;
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  receipt?: any;
}

export interface EligibilityResult {
  eligible: boolean;
  timeUntilEligible: number;
  lastDistribution?: {
    timestamp: number;
    quantity: number;
    location: string;
  };
}

export interface ContractStats {
  totalFamilies: number;
  activeFamilies: number;
  contractBalance: string;
}

export interface VolunteerStats {
  distributionCount: number;
  lastDistribution?: number;
  verificationLevel: VerificationLevel;
}

export enum ContractErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  CONTRACT_REVERT = 'CONTRACT_REVERT',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

export interface ContractError {
  type: ContractErrorType;
  message: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  originalError?: any;
}

// Contract Service Interface
export interface IContractService {
  // URID Registry Operations
  registerFamily(uridHash: string, familySize: number): Promise<TransactionResult>;
  validateFamily(uridHash: string): Promise<boolean>;
  getFamilyInfo(uridHash: string): Promise<Family | null>;
  
  // Distribution Tracker Operations
  recordDistribution(params: DistributionParams): Promise<TransactionResult>;
  checkEligibility(uridHash: string, aidType: AidType): Promise<EligibilityResult>;
  getDistributionHistory(uridHash: string): Promise<ContractDistribution[]>;
  
  // Analytics & Statistics
  getContractStats(): Promise<ContractStats>;
  getVolunteerStats(nullifier: string): Promise<VolunteerStats>;
}

export interface DistributionParams {
  uridHash: string;
  volunteerNullifier: string;
  aidType: AidType;
  quantity: number;
  location: string;
}

// Contract Provider Context
export interface ContractContextType {
  isConnected: boolean;
  networkId: number;
  contractAddresses: ContractConfig['contractAddresses'];
  blockNumber: number;
  gasPrice: bigint;
  
  // Contract operations
  registerFamily: (params: { uridHash: string; familySize: number }) => Promise<TransactionResult>;
  recordDistribution: (params: DistributionParams) => Promise<TransactionResult>;
  validateFamily: (uridHash: string) => Promise<boolean>;
  checkEligibility: (uridHash: string, aidType: AidType) => Promise<EligibilityResult>;
}

// QR Scanner Component Types
export interface QRScannerProps {
  onScan: (urid: string) => void;
  onError: (error: string) => void;
  isActive: boolean;
  className?: string;
}

export type CameraPermissionStatus = 'checking' | 'granted' | 'denied';
export type ScanResult = 'success' | 'error' | 'idle';

// Family Registration Flow Types
export interface FamilyRegistrationProps {
  onComplete: (urid: string) => void;
  onError: (error: Error) => void;
}

export interface BasicInfoFormProps {
  onNext: (data: FamilyRegistrationData) => void;
  initialData?: Partial<FamilyRegistrationData>;
}

export interface AadhaarVerificationProps {
  familyData: FamilyRegistrationData;
  onVerified: (hashedAadhaar: string, credentialSubject: any) => void;
  onError: (error: string) => void;
}

export interface URIDDisplayProps {
  urid: string;
  qrCode: string;
  familyData: FamilyRegistrationData;
  onComplete: () => void;
}

// Aid Distribution Flow Types
export interface AidDistributionProps {
  volunteerSession: VolunteerSession;
  onDistributionComplete: (distribution: Distribution) => void;
}

export interface DistributionState {
  phase: 'scanning' | 'validating' | 'selecting' | 'confirming' | 'recording' | 'complete';
  scannedURID?: string;
  familyInfo?: Family;
  selectedAidType?: AidType;
  eligibilityChecks?: Array<{
    aidType: AidType;
    eligibility: EligibilityResult;
  }>;
  isProcessing: boolean;
  error?: string;
}

export interface AidTypeSelectorProps {
  eligibilityChecks: Array<{
    aidType: AidType;
    eligibility: EligibilityResult;
  }>;
  onSelect: (aidType: AidType) => void;
}

// Dashboard Component Types
export interface DashboardProps {
  userRole: 'volunteer' | 'admin';
  refreshInterval?: number;
}

export interface StatisticsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface ActivityTimelineProps {
  distributions: Distribution[];
  maxItems?: number;
}

export interface VolunteerMetricsProps {
  volunteerSession: VolunteerSession;
  stats: VolunteerStats;
}

// MiniKit Integration Types
export interface MiniKitWalletAuthParams {
  nonce: string;
  expirationTime: Date;
  notBefore: Date;
  statement: string;
}

export interface MiniKitVerifyParams {
  action: string;
  verification_level: VerificationLevel;
  signal?: string;
}

export interface MiniKitTransactionParams {
  transaction: Array<{
    address: string;
    abi: any[];
    functionName: string;
    args: any[];
  }>;
}

export interface MiniKitPaymentParams {
  reference: string;
  to: string;
  tokens: Array<{
    symbol: string;
    token_amount: string;
  }>;
  description: string;
}

// Error Handling Types
export interface LiveFeedbackProps {
  status: 'success' | 'error' | 'loading' | 'idle';
  message: string;
  className?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

// Form Validation Types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'tel' | 'email' | 'textarea';
  validation: ValidationRule;
  placeholder?: string;
  helpText?: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type NetworkStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

// Constants
export const COOLDOWN_PERIODS: Record<AidType, number> = {
  [AidType.FOOD]: 24 * 60 * 60 * 1000, // 24 hours
  [AidType.MEDICAL]: 12 * 60 * 60 * 1000, // 12 hours
  [AidType.SHELTER]: 7 * 24 * 60 * 60 * 1000, // 7 days
  [AidType.CLOTHING]: 30 * 24 * 60 * 60 * 1000, // 30 days
  [AidType.WATER]: 12 * 60 * 60 * 1000, // 12 hours
  [AidType.CASH]: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const ERROR_MESSAGES: Record<string, string> = {
  [VerificationErrorCode.MINIKIT_UNAVAILABLE]: 'World App is required to use this feature. Please open this app in World App.',
  [VerificationErrorCode.USER_CANCELLED]: 'Verification was cancelled. Please try again.',
  [VerificationErrorCode.VERIFICATION_FAILED]: 'Verification failed. Please ensure you have completed World ID verification.',
  [VerificationErrorCode.ALREADY_REGISTERED]: 'This volunteer is already registered in the system.',
  [VerificationErrorCode.NETWORK_ERROR]: 'Network error occurred. Please check your connection and try again.',
  [VerificationErrorCode.INVALID_PROOF]: 'Invalid verification proof. Please try verifying again.',
};

export const AID_TYPE_ICONS: Record<AidType, string> = {
  [AidType.FOOD]: '🍽️',
  [AidType.MEDICAL]: '🏥',
  [AidType.SHELTER]: '🏠',
  [AidType.CLOTHING]: '👕',
  [AidType.WATER]: '💧',
  [AidType.CASH]: '💰',
};

export const AID_TYPE_LABELS: Record<AidType, string> = {
  [AidType.FOOD]: 'Food Aid',
  [AidType.MEDICAL]: 'Medical Aid',
  [AidType.SHELTER]: 'Shelter',
  [AidType.CLOTHING]: 'Clothing',
  [AidType.WATER]: 'Water',
  [AidType.CASH]: 'Cash Aid',
};