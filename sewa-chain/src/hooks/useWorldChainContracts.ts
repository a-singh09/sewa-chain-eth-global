"use client";

import { useState, useCallback, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { useVolunteerSession } from "./useVolunteerSession";
import {
  WorldChainContractService,
  getWorldChainContractService,
} from "@/services/WorldChainContractService";
import { WorldChainService } from "@/services/WorldChainService";
import {
  AidType,
  TransactionResult,
  Family,
  ContractDistribution,
  EligibilityResult,
} from "@/types";

interface UseWorldChainContractsReturn {
  // Contract service instance
  contractService: WorldChainContractService;

  // State
  isLoading: boolean;
  error: string | null;

  // Family operations
  registerFamily: (
    aadhaarNumber: string,
    familySize: number,
  ) => Promise<TransactionResult>;
  validateFamily: (aadhaarNumber: string) => Promise<boolean>;
  getFamilyInfo: (aadhaarNumber: string) => Promise<Family | null>;

  // Distribution operations
  recordDistribution: (
    aadhaarNumber: string,
    aidType: AidType,
    quantity: number,
    location: string,
  ) => Promise<TransactionResult>;
  checkEligibility: (
    aadhaarNumber: string,
    aidType: AidType,
  ) => Promise<EligibilityResult>;
  getDistributionHistory: (
    aadhaarNumber: string,
  ) => Promise<ContractDistribution[]>;

  // Statistics
  getTotalFamilies: () => Promise<number>;
  getVolunteerStats: () => Promise<{ distributionCount: number }>;

  // Transaction monitoring
  monitorTransaction: (transactionId: string) => Promise<any>;

  // Configuration
  isConfigured: boolean;
  configErrors: string[];
}

/**
 * Hook for interacting with World Chain smart contracts
 * Integrates with volunteer session and provides transaction monitoring
 */
export function useWorldChainContracts(): UseWorldChainContractsReturn {
  const { session, isAuthenticated } = useVolunteerSession();
  const [contractService] = useState(() => getWorldChainContractService());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check configuration on mount
  const configValidation = WorldChainContractService.validateConfiguration();
  const isConfigured = configValidation.valid;
  const configErrors = configValidation.errors;

  // Clear error when session changes
  useEffect(() => {
    setError(null);
  }, [session]);

  /**
   * Register a family on the blockchain
   */
  const registerFamily = useCallback(
    async (
      aadhaarNumber: string,
      familySize: number,
    ): Promise<TransactionResult> => {
      if (!isAuthenticated || !session) {
        return {
          success: false,
          error: "Volunteer authentication required",
        };
      }

      if (!MiniKit.isInstalled()) {
        return {
          success: false,
          error: "World App is required for blockchain transactions",
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        // Generate URID hash from Aadhaar number
        const uridHash =
          WorldChainContractService.generateURIDHash(aadhaarNumber);

        // Register family on blockchain
        const result = await contractService.registerFamily(
          uridHash,
          familySize,
        );

        if (result.success) {
          // Send notification to volunteer
          try {
            await WorldChainService.notifyFamilyRegistered(
              session.walletAddress || "",
              aadhaarNumber.slice(-4), // Last 4 digits for privacy
            );
          } catch (notificationError) {
            console.warn("Failed to send notification:", notificationError);
            // Don't fail the whole operation for notification errors
          }

          // Monitor transaction
          if (result.transactionHash) {
            try {
              await WorldChainService.monitorTransactionWithWorldChain(
                result.transactionHash,
                (status) => {
                  console.log("Transaction status update:", status);
                },
              );
            } catch (monitorError) {
              console.warn("Transaction monitoring failed:", monitorError);
            }
          }
        }

        return result;
      } catch (error: any) {
        const errorMessage = error.message || "Failed to register family";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, session, contractService],
  );

  /**
   * Validate if a family exists and is active
   */
  const validateFamily = useCallback(
    async (aadhaarNumber: string): Promise<boolean> => {
      try {
        const uridHash =
          WorldChainContractService.generateURIDHash(aadhaarNumber);
        return await contractService.isValidFamily(uridHash);
      } catch (error) {
        console.error("Error validating family:", error);
        return false;
      }
    },
    [contractService],
  );

  /**
   * Get family information
   */
  const getFamilyInfo = useCallback(
    async (aadhaarNumber: string): Promise<Family | null> => {
      try {
        const uridHash =
          WorldChainContractService.generateURIDHash(aadhaarNumber);
        return await contractService.getFamilyInfo(uridHash);
      } catch (error) {
        console.error("Error getting family info:", error);
        return null;
      }
    },
    [contractService],
  );

  /**
   * Record aid distribution on the blockchain
   */
  const recordDistribution = useCallback(
    async (
      aadhaarNumber: string,
      aidType: AidType,
      quantity: number,
      location: string,
    ): Promise<TransactionResult> => {
      if (!isAuthenticated || !session) {
        return {
          success: false,
          error: "Volunteer authentication required",
        };
      }

      if (!session.nullifierHash) {
        return {
          success: false,
          error: "Volunteer nullifier not available",
        };
      }

      if (!MiniKit.isInstalled()) {
        return {
          success: false,
          error: "World App is required for blockchain transactions",
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        // Generate hashes
        const uridHash =
          WorldChainContractService.generateURIDHash(aadhaarNumber);
        const volunteerNullifier =
          WorldChainContractService.generateVolunteerNullifier(
            session.nullifierHash,
          );

        // Record distribution on blockchain
        const result = await contractService.recordDistribution(
          uridHash,
          volunteerNullifier,
          aidType,
          quantity,
          location,
        );

        if (result.success) {
          // Send notification to family (if we have their wallet address)
          try {
            // In a real implementation, you'd need to map URID to wallet address
            // For now, we'll just log the successful distribution
            console.log("Distribution recorded successfully:", {
              aidType,
              quantity,
              location,
              transactionHash: result.transactionHash,
            });

            // Monitor transaction
            if (result.transactionHash) {
              await WorldChainService.monitorTransactionWithWorldChain(
                result.transactionHash,
                (status) => {
                  console.log("Distribution transaction status:", status);
                },
              );
            }
          } catch (error) {
            console.warn("Post-distribution processing failed:", error);
          }
        }

        return result;
      } catch (error: any) {
        const errorMessage = error.message || "Failed to record distribution";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, session, contractService],
  );

  /**
   * Check if family is eligible for aid
   */
  const checkEligibility = useCallback(
    async (
      aadhaarNumber: string,
      aidType: AidType,
    ): Promise<EligibilityResult> => {
      try {
        const uridHash =
          WorldChainContractService.generateURIDHash(aadhaarNumber);
        return await contractService.checkEligibility(uridHash, aidType);
      } catch (error) {
        console.error("Error checking eligibility:", error);
        return {
          eligible: false,
          timeUntilEligible: 0,
        };
      }
    },
    [contractService],
  );

  /**
   * Get distribution history for a family
   */
  const getDistributionHistory = useCallback(
    async (aadhaarNumber: string): Promise<ContractDistribution[]> => {
      try {
        const uridHash =
          WorldChainContractService.generateURIDHash(aadhaarNumber);
        return await contractService.getDistributionHistory(uridHash);
      } catch (error) {
        console.error("Error getting distribution history:", error);
        return [];
      }
    },
    [contractService],
  );

  /**
   * Get total families registered
   */
  const getTotalFamilies = useCallback(async (): Promise<number> => {
    try {
      return await contractService.getTotalFamilies();
    } catch (error) {
      console.error("Error getting total families:", error);
      return 0;
    }
  }, [contractService]);

  /**
   * Get volunteer statistics
   */
  const getVolunteerStats = useCallback(async (): Promise<{
    distributionCount: number;
  }> => {
    if (!session?.nullifierHash) {
      return { distributionCount: 0 };
    }

    try {
      const volunteerNullifier =
        WorldChainContractService.generateVolunteerNullifier(
          session.nullifierHash,
        );
      const distributionCount =
        await contractService.getVolunteerDistributionCount(volunteerNullifier);
      return { distributionCount };
    } catch (error) {
      console.error("Error getting volunteer stats:", error);
      return { distributionCount: 0 };
    }
  }, [session, contractService]);

  /**
   * Monitor transaction status
   */
  const monitorTransaction = useCallback(
    async (transactionId: string): Promise<any> => {
      try {
        return await WorldChainService.monitorTransactionWithWorldChain(
          transactionId,
        );
      } catch (error) {
        console.error("Error monitoring transaction:", error);
        throw error;
      }
    },
    [],
  );

  return {
    contractService,
    isLoading,
    error,
    registerFamily,
    validateFamily,
    getFamilyInfo,
    recordDistribution,
    checkEligibility,
    getDistributionHistory,
    getTotalFamilies,
    getVolunteerStats,
    monitorTransaction,
    isConfigured,
    configErrors,
  };
}

/**
 * Hook for family-specific operations (for family users)
 */
export function useFamilyContracts(aadhaarNumber?: string) {
  const { contractService } = useWorldChainContracts();
  const [familyInfo, setFamilyInfo] = useState<Family | null>(null);
  const [distributionHistory, setDistributionHistory] = useState<
    ContractDistribution[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFamilyData = useCallback(async () => {
    if (!aadhaarNumber) return;

    setIsLoading(true);
    try {
      const uridHash =
        WorldChainContractService.generateURIDHash(aadhaarNumber);

      const [info, history] = await Promise.all([
        contractService.getFamilyInfo(uridHash),
        contractService.getDistributionHistory(uridHash),
      ]);

      setFamilyInfo(info);
      setDistributionHistory(history);
    } catch (error) {
      console.error("Error refreshing family data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [aadhaarNumber, contractService]);

  useEffect(() => {
    refreshFamilyData();
  }, [refreshFamilyData]);

  return {
    familyInfo,
    distributionHistory,
    isLoading,
    refreshFamilyData,
  };
}

export default useWorldChainContracts;
