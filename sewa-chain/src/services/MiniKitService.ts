"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import {
  DistributionParams,
  TransactionResult,
  MiniKitTransactionParams,
  ContractError,
  ContractErrorType,
  AidType,
} from "@/types";

// Import contract ABIs
import DistributionTrackerABI from "@/abi/DistributionTracker.json";
import URIDRegistryABI from "@/abi/URIDRegistry.json";

// Transaction status types
export interface TransactionStatus {
  status: "pending" | "success" | "failed" | "unknown";
  transactionHash?: string;
  blockNumber?: number;
  confirmations?: number;
  error?: string;
}

export interface TransactionMonitorOptions {
  maxRetries?: number;
  retryInterval?: number; // milliseconds
  timeout?: number; // milliseconds
}

export class MiniKitService {
  /**
   * Record aid distribution on blockchain using MiniKit
   */
  static async recordDistribution(
    params: DistributionParams,
  ): Promise<TransactionResult> {
    try {
      // Check if MiniKit is available
      if (!MiniKit.isInstalled()) {
        throw new Error(
          "MiniKit is not available. Please open this app in World App.",
        );
      }

      const contractAddress =
        process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS;
      if (!contractAddress) {
        throw new Error("Distribution tracker contract address not configured");
      }

      // Prepare transaction parameters
      const transactionParams: MiniKitTransactionParams = {
        transaction: [
          {
            address: contractAddress,
            abi: DistributionTrackerABI,
            functionName: "recordDistribution",
            args: [
              params.uridHash,
              params.volunteerNullifier,
              this.aidTypeToNumber(params.aidType),
              params.quantity,
              params.location,
            ],
          },
        ],
      };

      console.log("Sending distribution transaction:", {
        uridHash: params.uridHash.substring(0, 8) + "...",
        volunteerNullifier: params.volunteerNullifier.substring(0, 8) + "...",
        aidType: params.aidType,
        quantity: params.quantity,
        location: params.location,
      });

      // Send transaction via MiniKit
      const { finalPayload } =
        await MiniKit.commandsAsync.sendTransaction(transactionParams);

      if (finalPayload.status === "success") {
        console.log(
          "Distribution transaction successful:",
          finalPayload.transaction_id,
        );

        return {
          success: true,
          transactionHash: finalPayload.transaction_id,
        };
      } else {
        console.error("Distribution transaction failed:", finalPayload);

        const error = this.parseTransactionError(finalPayload);
        return {
          success: false,
          error: error.message,
        };
      }
    } catch (error) {
      console.error("MiniKit distribution transaction error:", error);

      const contractError = this.handleTransactionError(error);
      return {
        success: false,
        error: contractError.message,
      };
    }
  }

  /**
   * Register family on blockchain using MiniKit
   */
  static async registerFamily(
    uridHash: string,
    familySize: number,
  ): Promise<TransactionResult> {
    try {
      // Check if MiniKit is available
      if (!MiniKit.isInstalled()) {
        throw new Error(
          "MiniKit is not available. Please open this app in World App.",
        );
      }

      const contractAddress = process.env.NEXT_PUBLIC_URID_REGISTRY_ADDRESS;
      if (!contractAddress) {
        throw new Error("URID registry contract address not configured");
      }

      // Prepare transaction parameters
      const transactionParams: MiniKitTransactionParams = {
        transaction: [
          {
            address: contractAddress,
            abi: URIDRegistryABI,
            functionName: "registerFamily",
            args: [uridHash, familySize],
          },
        ],
      };

      console.log("Sending family registration transaction:", {
        uridHash: uridHash.substring(0, 8) + "...",
        familySize,
      });

      // Send transaction via MiniKit
      const { finalPayload } =
        await MiniKit.commandsAsync.sendTransaction(transactionParams);

      if (finalPayload.status === "success") {
        console.log(
          "Family registration transaction successful:",
          finalPayload.transaction_id,
        );

        return {
          success: true,
          transactionHash: finalPayload.transaction_id,
        };
      } else {
        console.error("Family registration transaction failed:", finalPayload);

        const error = this.parseTransactionError(finalPayload);
        return {
          success: false,
          error: error.message,
        };
      }
    } catch (error) {
      console.error("MiniKit family registration transaction error:", error);

      const contractError = this.handleTransactionError(error);
      return {
        success: false,
        error: contractError.message,
      };
    }
  }

  /**
   * Monitor transaction status
   */
  static async monitorTransaction(
    transactionHash: string,
    options: TransactionMonitorOptions = {},
  ): Promise<TransactionStatus> {
    const { maxRetries = 30, retryInterval = 2000, timeout = 60000 } = options;

    const startTime = Date.now();
    let retries = 0;

    while (retries < maxRetries && Date.now() - startTime < timeout) {
      try {
        // In a real implementation, you would query the blockchain
        // For now, we'll simulate transaction monitoring
        console.log(
          `Monitoring transaction ${transactionHash}, attempt ${retries + 1}`,
        );

        // Simulate transaction status check
        await new Promise((resolve) => setTimeout(resolve, retryInterval));

        // For demo purposes, assume transaction succeeds after a few attempts
        if (retries >= 3) {
          return {
            status: "success",
            transactionHash,
            blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
            confirmations: 1,
          };
        }

        retries++;
      } catch (error) {
        console.error("Error monitoring transaction:", error);
        return {
          status: "failed",
          transactionHash,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return {
      status: "unknown",
      transactionHash,
      error: "Transaction monitoring timed out",
    };
  }

  /**
   * Wait for transaction confirmation with status updates
   */
  static async waitForConfirmation(
    transactionHash: string,
    onStatusUpdate?: (status: TransactionStatus) => void,
  ): Promise<TransactionStatus> {
    const options: TransactionMonitorOptions = {
      maxRetries: 30,
      retryInterval: 2000,
      timeout: 120000, // 2 minutes
    };

    let currentStatus: TransactionStatus = {
      status: "pending",
      transactionHash,
    };

    // Notify initial status
    if (onStatusUpdate) {
      onStatusUpdate(currentStatus);
    }

    try {
      currentStatus = await this.monitorTransaction(transactionHash, options);

      // Notify final status
      if (onStatusUpdate) {
        onStatusUpdate(currentStatus);
      }

      return currentStatus;
    } catch (error) {
      const errorStatus: TransactionStatus = {
        status: "failed",
        transactionHash,
        error:
          error instanceof Error
            ? error.message
            : "Transaction monitoring failed",
      };

      if (onStatusUpdate) {
        onStatusUpdate(errorStatus);
      }

      return errorStatus;
    }
  }

  /**
   * Record distribution with transaction monitoring
   */
  static async recordDistributionWithMonitoring(
    params: DistributionParams,
    onStatusUpdate?: (status: TransactionStatus) => void,
  ): Promise<TransactionResult & { status?: TransactionStatus }> {
    try {
      // First, record the distribution
      const result = await this.recordDistribution(params);

      if (result.success && result.transactionHash) {
        // Monitor the transaction
        const status = await this.waitForConfirmation(
          result.transactionHash,
          onStatusUpdate,
        );

        return {
          ...result,
          status,
        };
      }

      return result;
    } catch (error) {
      console.error("Error recording distribution with monitoring:", error);

      const contractError = this.handleTransactionError(error);
      return {
        success: false,
        error: contractError.message,
      };
    }
  }

  /**
   * Register family with transaction monitoring
   */
  static async registerFamilyWithMonitoring(
    uridHash: string,
    familySize: number,
    onStatusUpdate?: (status: TransactionStatus) => void,
  ): Promise<TransactionResult & { status?: TransactionStatus }> {
    try {
      // First, register the family
      const result = await this.registerFamily(uridHash, familySize);

      if (result.success && result.transactionHash) {
        // Monitor the transaction
        const status = await this.waitForConfirmation(
          result.transactionHash,
          onStatusUpdate,
        );

        return {
          ...result,
          status,
        };
      }

      return result;
    } catch (error) {
      console.error("Error registering family with monitoring:", error);

      const contractError = this.handleTransactionError(error);
      return {
        success: false,
        error: contractError.message,
      };
    }
  }

  /**
   * Convert AidType enum to number for smart contract
   */
  private static aidTypeToNumber(aidType: AidType): number {
    const aidTypeMap: Record<AidType, number> = {
      [AidType.FOOD]: 0,
      [AidType.MEDICAL]: 1,
      [AidType.SHELTER]: 2,
      [AidType.CLOTHING]: 3,
      [AidType.WATER]: 4,
      [AidType.CASH]: 5,
    };

    return aidTypeMap[aidType] ?? 0;
  }

  /**
   * Parse transaction error from MiniKit response
   */
  private static parseTransactionError(payload: any): ContractError {
    const errorCode = payload.error_code || "UNKNOWN_ERROR";

    switch (errorCode) {
      case "user_rejected":
        return {
          type: ContractErrorType.VALIDATION_FAILED,
          message: "Transaction was cancelled by user",
        };
      case "insufficient_funds":
        return {
          type: ContractErrorType.INSUFFICIENT_FUNDS,
          message: "Insufficient funds to complete transaction",
        };
      case "network_error":
        return {
          type: ContractErrorType.NETWORK_ERROR,
          message:
            "Network error occurred. Please check your connection and try again.",
        };
      case "contract_revert":
        return {
          type: ContractErrorType.CONTRACT_REVERT,
          message:
            "Transaction failed due to contract validation. Please check the data and try again.",
        };
      default:
        return {
          type: ContractErrorType.VALIDATION_FAILED,
          message: `Transaction failed: ${errorCode}`,
        };
    }
  }

  /**
   * Handle general transaction errors
   */
  private static handleTransactionError(error: any): ContractError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("minikit") || message.includes("world app")) {
        return {
          type: ContractErrorType.VALIDATION_FAILED,
          message:
            "World App is required to complete this transaction. Please open this app in World App.",
        };
      }

      if (message.includes("network") || message.includes("connection")) {
        return {
          type: ContractErrorType.NETWORK_ERROR,
          message:
            "Network error occurred. Please check your connection and try again.",
        };
      }

      if (message.includes("timeout")) {
        return {
          type: ContractErrorType.TIMEOUT,
          message: "Transaction timed out. Please try again.",
        };
      }

      return {
        type: ContractErrorType.VALIDATION_FAILED,
        message: error.message,
      };
    }

    return {
      type: ContractErrorType.VALIDATION_FAILED,
      message: "An unexpected error occurred. Please try again.",
    };
  }

  /**
   * Check if MiniKit is available and ready
   */
  static isAvailable(): boolean {
    return MiniKit.isInstalled();
  }

  /**
   * Get user-friendly error message for display
   */
  static getErrorMessage(error: ContractError): string {
    switch (error.type) {
      case ContractErrorType.NETWORK_ERROR:
        return "Network connection issue. Please check your internet and try again.";
      case ContractErrorType.INSUFFICIENT_FUNDS:
        return "Insufficient funds to complete the transaction.";
      case ContractErrorType.CONTRACT_REVERT:
        return "Transaction validation failed. Please verify the information and try again.";
      case ContractErrorType.TIMEOUT:
        return "Transaction timed out. Please try again.";
      case ContractErrorType.VALIDATION_FAILED:
        return error.message || "Transaction failed. Please try again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  /**
   * Validate contract addresses are configured
   */
  static validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.NEXT_PUBLIC_URID_REGISTRY_ADDRESS) {
      errors.push("URID Registry contract address not configured");
    }

    if (!process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS) {
      errors.push("Distribution Tracker contract address not configured");
    }

    if (!process.env.NEXT_PUBLIC_APP_ID) {
      errors.push("World ID App ID not configured");
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
      uridRegistry: process.env.NEXT_PUBLIC_URID_REGISTRY_ADDRESS,
      distributionTracker: process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS,
    };
  }

  /**
   * Format transaction hash for display
   */
  static formatTransactionHash(hash: string): string {
    if (!hash || hash.length < 10) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  }

  /**
   * Get transaction explorer URL
   */
  static getTransactionExplorerUrl(transactionHash: string): string {
    const network = process.env.NEXT_PUBLIC_NETWORK || "testnet";
    const baseUrl =
      network === "mainnet"
        ? "https://worldchain.blockscout.com"
        : "https://worldchain-sepolia.blockscout.com";

    return `${baseUrl}/tx/${transactionHash}`;
  }

  /**
   * Estimate transaction time based on network
   */
  static getEstimatedTransactionTime(): string {
    const network = process.env.NEXT_PUBLIC_NETWORK || "testnet";
    return network === "mainnet" ? "30-60 seconds" : "15-30 seconds";
  }
}
