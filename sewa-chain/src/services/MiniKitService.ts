"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import {
  DistributionParams,
  TransactionResult,
  MiniKitTransactionParams,
  ContractError,
  ContractErrorType,
} from "@/types";

// Import contract ABIs (these would be generated from deployed contracts)
import DistributionTrackerABI from "@/abi/DistributionTracker.json";
import URIDRegistryABI from "@/abi/URIDRegistry.json";

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
   * Convert AidType enum to number for smart contract
   */
  private static aidTypeToNumber(aidType: string): number {
    const aidTypeMap: Record<string, number> = {
      FOOD: 0,
      MEDICAL: 1,
      SHELTER: 2,
      CLOTHING: 3,
      WATER: 4,
      CASH: 5,
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
}
