// Shared registry for hackathon demo
// In production, this would be a database

export interface FamilyRecord {
  uuid: string;
  aadhaarHash: string;
  uridHash: string;
  familySize: number;
  location: string;
  transactionHash: string;
  registrationTime: number;
  isActive: boolean;
}

export interface DistributionRecord {
  distributionId: string;
  familyUuid: string;
  volunteerNullifier: string;
  aidType: number;
  quantity: number;
  location: string;
  transactionHash: string;
  timestamp: number;
}

// Global registries for the hackathon demo
declare global {
  var familyRegistry: Map<string, FamilyRecord> | undefined;
  var distributionRegistry: Map<string, DistributionRecord> | undefined;
}

export const familyRegistry =
  globalThis.familyRegistry ?? new Map<string, FamilyRecord>();
globalThis.familyRegistry = familyRegistry;

export const distributionRegistry =
  globalThis.distributionRegistry ?? new Map<string, DistributionRecord>();
globalThis.distributionRegistry = distributionRegistry;
