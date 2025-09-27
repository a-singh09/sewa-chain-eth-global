"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import {
  AidType,
  TransactionResult,
  Family,
  ContractDistribution,
  EligibilityResult,
} from "@/types";
import URIDRegistryABI from "@/abi/URIDRegistry.json";
import DistributionTrackerABI from "@/abi/DistributionTracker.json";

/**
 * World Chain Contract Service using MiniKit for transactions
 * This service integrates with World Chain smart contracts through World App
 * Uses MiniKit's sendTransaction command for blockchain interactions
 */
export class WorldChainContractService {
  private static readonly URID_REGISTRY_ADDRESS =
    process.env.NEXT_PUBLIC_URID_REGISTRY_ADDRESS;
  private static readonly DISTRIBUTION_TRACKER_ADDRESS =
    process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS;
  private static readonly WORLD_CHAIN_RPC =
    process.env.NEXT_PUBLIC_WORLD_CHAIN_RPC ||
    "https://worldchain-sepolia.g.alchemy.com/public";

  /**
   * Register a family on the blockchain using World App
   */
  async registerFamily(
    uridHash: string,
    familySize: number,
  ): Promise<TransactionResult> {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("World App is required for blockchain transactions");
      }

      // Validate inputs
      if (!uridHash || uridHash === "0x" || uridHash.length !== 66) {
        throw new Error("Invalid URID hash format");
      }

      if (familySize < 1 || familySize > 20) {
        throw new Error("Family size must be between 1 and 20");
      }

      // Check if family already exists using World Chain API
      const exists = await this.isURIDRegistered(uridHash);
      if (exists) {
        throw new Error("Family with this URID is already registered");
      }

      // Prepare transaction for MiniKit
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: this.URID_REGISTRY_ADDRESS!,
            abi: URIDRegistryABI,
            functionName: "registerFamily",
            args: [uridHash, familySize],
          },
        ],
      });

      if (finalPayload.status === "error") {
        throw new Error(`Transaction failed: ${finalPayload.error_code}`);
      }

      return {
        success: true,
        transactionHash: finalPayload.transaction_id,
        message: "Family registration transaction submitted successfully",
      };
    } catch (error: any) {
      console.error("Error registering family:", error);
      return {
        success: false,
        error: error.message || "Failed to register family",
      };
    }
  }

  /**
   * Record aid distribution on the blockchain using World App
   */
  async recordDistribution(
    uridHash: string,
    volunteerNullifier: string,
    aidType: AidType,
    quantity: number,
    location: string,
  ): Promise<TransactionResult> {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("World App is required for blockchain transactions");
      }

      // Validate inputs
      if (!uridHash || uridHash === "0x" || uridHash.length !== 66) {
        throw new Error("Invalid URID hash format");
      }

      if (
        !volunteerNullifier ||
        volunteerNullifier === "0x" ||
        volunteerNullifier.length !== 66
      ) {
        throw new Error("Invalid volunteer nullifier format");
      }

      if (quantity <= 0 || quantity > 1000) {
        throw new Error("Quantity must be between 1 and 1000");
      }

      if (!location || location.trim().length === 0) {
        throw new Error("Location cannot be empty");
      }

      // Check family validity using World Chain API
      const isValid = await this.isValidFamily(uridHash);
      if (!isValid) {
        throw new Error("Family not found or inactive");
      }

      // Check eligibility using World Chain API
      const eligibility = await this.checkEligibility(uridHash, aidType);
      if (!eligibility.eligible) {
        const hoursRemaining = Math.ceil(eligibility.timeUntilEligible / 3600);
        throw new Error(
          `Family not eligible for ${aidType}. Please wait ${hoursRemaining} hours.`,
        );
      }

      // Convert aid type to enum value
      const aidTypeValue = this.getAidTypeValue(aidType);

      // Prepare transaction for MiniKit
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: this.DISTRIBUTION_TRACKER_ADDRESS!,
            abi: DistributionTrackerABI,
            functionName: "recordDistribution",
            args: [
              uridHash,
              volunteerNullifier,
              aidTypeValue,
              quantity,
              location,
            ],
          },
        ],
      });

      if (finalPayload.status === "error") {
        throw new Error(`Transaction failed: ${finalPayload.error_code}`);
      }

      return {
        success: true,
        transactionHash: finalPayload.transaction_id,
        message: "Distribution recorded successfully",
      };
    } catch (error: any) {
      console.error("Error recording distribution:", error);
      return {
        success: false,
        error: error.message || "Failed to record distribution",
      };
    }
  }

  /**
   * Check if URID is registered using World Chain RPC
   */
  async isURIDRegistered(uridHash: string): Promise<boolean> {
    try {
      // Use World Chain RPC to call contract view function
      const response = await fetch(this.WORLD_CHAIN_RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: this.URID_REGISTRY_ADDRESS,
              data: this.encodeContractCall(
                "isURIDRegistered",
                ["bytes32"],
                [uridHash],
              ),
            },
            "latest",
          ],
          id: 1,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Decode boolean result
      return (
        result.result !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    } catch (error) {
      console.error("Error checking URID registration:", error);
      return false;
    }
  }

  /**
   * Check if family is valid and active using World Chain RPC
   */
  async isValidFamily(uridHash: string): Promise<boolean> {
    try {
      const response = await fetch(this.WORLD_CHAIN_RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: this.URID_REGISTRY_ADDRESS,
              data: this.encodeContractCall(
                "isValidFamily",
                ["bytes32"],
                [uridHash],
              ),
            },
            "latest",
          ],
          id: 1,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      return (
        result.result !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    } catch (error) {
      console.error("Error validating family:", error);
      return false;
    }
  }

  /**
   * Get family information using World Chain RPC
   */
  async getFamilyInfo(uridHash: string): Promise<Family | null> {
    try {
      const response = await fetch(this.WORLD_CHAIN_RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: this.URID_REGISTRY_ADDRESS,
              data: this.encodeContractCall(
                "getFamilyInfo",
                ["bytes32"],
                [uridHash],
              ),
            },
            "latest",
          ],
          id: 1,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Decode the family struct from the result
      // This is a simplified version - in production you'd use proper ABI decoding
      const decoded = this.decodeFamilyStruct(result.result);
      return decoded;
    } catch (error) {
      console.error("Error getting family info:", error);
      return null;
    }
  }

  /**
   * Check eligibility for aid distribution using World Chain RPC
   */
  async checkEligibility(
    uridHash: string,
    aidType: AidType,
  ): Promise<EligibilityResult> {
    try {
      const aidTypeValue = this.getAidTypeValue(aidType);
      const response = await fetch(this.WORLD_CHAIN_RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: this.DISTRIBUTION_TRACKER_ADDRESS,
              data: this.encodeContractCall(
                "checkEligibility",
                ["bytes32", "uint8"],
                [uridHash, aidTypeValue],
              ),
            },
            "latest",
          ],
          id: 1,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Decode the eligibility result
      const decoded = this.decodeEligibilityResult(result.result);
      return decoded;
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return {
        eligible: false,
        timeUntilEligible: 0,
      };
    }
  }

  /**
   * Get distribution history for a family using World Chain RPC
   */
  async getDistributionHistory(
    uridHash: string,
  ): Promise<ContractDistribution[]> {
    try {
      const response = await fetch(this.WORLD_CHAIN_RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: this.DISTRIBUTION_TRACKER_ADDRESS,
              data: this.encodeContractCall(
                "getDistributionHistory",
                ["bytes32"],
                [uridHash],
              ),
            },
            "latest",
          ],
          id: 1,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Decode the distribution array
      const decoded = this.decodeDistributionArray(result.result);
      return decoded;
    } catch (error) {
      console.error("Error getting distribution history:", error);
      return [];
    }
  }

  /**
   * Get total families registered using World Chain RPC
   */
  async getTotalFamilies(): Promise<number> {
    try {
      const response = await fetch(this.WORLD_CHAIN_RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: this.URID_REGISTRY_ADDRESS,
              data: this.encodeContractCall("getTotalFamilies", [], []),
            },
            "latest",
          ],
          id: 1,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      return parseInt(result.result, 16);
    } catch (error) {
      console.error("Error getting total families:", error);
      return 0;
    }
  }

  /**
   * Get volunteer distribution count using World Chain RPC
   */
  async getVolunteerDistributionCount(
    volunteerNullifier: string,
  ): Promise<number> {
    try {
      const response = await fetch(this.WORLD_CHAIN_RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: this.DISTRIBUTION_TRACKER_ADDRESS,
              data: this.encodeContractCall(
                "getVolunteerDistributionCount",
                ["bytes32"],
                [volunteerNullifier],
              ),
            },
            "latest",
          ],
          id: 1,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      return parseInt(result.result, 16);
    } catch (error) {
      console.error("Error getting volunteer distribution count:", error);
      return 0;
    }
  }

  /**
   * Generate URID hash from Aadhaar number
   */
  static generateURIDHash(aadhaarNumber: string): string {
    // Simple hash function for demo - in production use proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < aadhaarNumber.length; i++) {
      const char = aadhaarNumber.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to bytes32 format
    const hashHex = Math.abs(hash).toString(16).padStart(64, "0");
    return "0x" + hashHex;
  }

  /**
   * Generate volunteer nullifier from World ID nullifier
   */
  static generateVolunteerNullifier(worldIdNullifier: string): string {
    // Use World ID nullifier as volunteer identifier
    return worldIdNullifier;
  }

  /**
   * Validate configuration
   */
  static validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.URID_REGISTRY_ADDRESS) {
      errors.push("URID Registry contract address not configured");
    }

    if (!this.DISTRIBUTION_TRACKER_ADDRESS) {
      errors.push("Distribution Tracker contract address not configured");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get contract addresses
   */
  static getContractAddresses() {
    return {
      uridRegistry: this.URID_REGISTRY_ADDRESS,
      distributionTracker: this.DISTRIBUTION_TRACKER_ADDRESS,
    };
  }

  /**
   * Get transaction URL for World Chain explorer
   */
  static getTransactionUrl(transactionHash: string): string {
    const network = process.env.NEXT_PUBLIC_NETWORK || "testnet";
    const baseUrl =
      network === "mainnet"
        ? "https://worldchain.blockscout.com"
        : "https://worldchain-sepolia.blockscout.com";

    return `${baseUrl}/tx/${transactionHash}`;
  }

  // Private utility methods
  private getAidTypeValue(aidType: AidType): number {
    const aidTypeMap = {
      [AidType.FOOD]: 0,
      [AidType.MEDICAL]: 1,
      [AidType.SHELTER]: 2,
      [AidType.CLOTHING]: 3,
      [AidType.WATER]: 4,
      [AidType.CASH]: 5,
    };
    return aidTypeMap[aidType] ?? 0;
  }

  private getAidTypeName(aidTypeValue: number): AidType {
    const aidTypeMap = {
      0: AidType.FOOD,
      1: AidType.MEDICAL,
      2: AidType.SHELTER,
      3: AidType.CLOTHING,
      4: AidType.WATER,
      5: AidType.CASH,
    };
    return aidTypeMap[aidTypeValue] ?? AidType.FOOD;
  }

  /**
   * Encode contract function call for RPC
   */
  private encodeContractCall(
    functionName: string,
    types: string[],
    values: any[],
  ): string {
    // Simple function selector generation - in production use proper ABI encoding
    const functionSignature = `${functionName}(${types.join(",")})`;
    let hash = 0;
    for (let i = 0; i < functionSignature.length; i++) {
      const char = functionSignature.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const selector = Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8);

    // Encode parameters (simplified)
    let encodedParams = "";
    for (let i = 0; i < values.length; i++) {
      if (types[i] === "bytes32") {
        encodedParams += values[i].slice(2).padStart(64, "0");
      } else if (types[i] === "uint8" || types[i] === "uint256") {
        encodedParams += values[i].toString(16).padStart(64, "0");
      }
    }

    return "0x" + selector + encodedParams;
  }

  /**
   * Decode family struct from RPC result
   */
  private decodeFamilyStruct(data: string): Family | null {
    try {
      // Simplified decoding - in production use proper ABI decoding
      if (data === "0x" || data.length < 66) return null;

      // Extract data (this is a simplified version)
      const uridHash = "0x" + data.slice(2, 66);
      const familySize = parseInt(data.slice(66, 130), 16);
      const registrationTime = parseInt(data.slice(130, 194), 16);
      const registeredBy = "0x" + data.slice(218, 258);
      const isActive = data.slice(258, 322) !== "0".repeat(64);
      const exists = data.slice(322, 386) !== "0".repeat(64);

      return {
        uridHash,
        familySize,
        registrationTime,
        registeredBy,
        isActive,
        exists,
      };
    } catch (error) {
      console.error("Error decoding family struct:", error);
      return null;
    }
  }

  /**
   * Decode eligibility result from RPC result
   */
  private decodeEligibilityResult(data: string): EligibilityResult {
    try {
      if (data === "0x" || data.length < 130) {
        return { eligible: false, timeUntilEligible: 0 };
      }

      const eligible = data.slice(2, 66) !== "0".repeat(64);
      const timeUntilEligible = parseInt(data.slice(66, 130), 16);

      return { eligible, timeUntilEligible };
    } catch (error) {
      console.error("Error decoding eligibility result:", error);
      return { eligible: false, timeUntilEligible: 0 };
    }
  }

  /**
   * Decode distribution array from RPC result
   */
  private decodeDistributionArray(data: string): ContractDistribution[] {
    try {
      // Simplified decoding - in production use proper ABI decoding
      if (data === "0x" || data.length < 66) return [];

      // This is a placeholder - proper array decoding would be more complex
      return [];
    } catch (error) {
      console.error("Error decoding distribution array:", error);
      return [];
    }
  }
}

// Singleton instance
let worldChainContractServiceInstance: WorldChainContractService | null = null;

export const getWorldChainContractService = (): WorldChainContractService => {
  if (!worldChainContractServiceInstance) {
    worldChainContractServiceInstance = new WorldChainContractService();
  }
  return worldChainContractServiceInstance;
};

export default WorldChainContractService;
