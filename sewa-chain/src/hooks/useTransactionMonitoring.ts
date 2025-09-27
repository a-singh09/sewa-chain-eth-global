"use client";

import { useState, useEffect, useCallback } from "react";
import { MiniKitService, TransactionStatus } from "@/services/MiniKitService";

export interface UseTransactionMonitoringOptions {
  autoStart?: boolean;
  onSuccess?: (status: TransactionStatus) => void;
  onError?: (status: TransactionStatus) => void;
  onStatusChange?: (status: TransactionStatus) => void;
}

export interface UseTransactionMonitoringReturn {
  status: TransactionStatus | null;
  isMonitoring: boolean;
  startMonitoring: (transactionHash: string) => void;
  stopMonitoring: () => void;
  reset: () => void;
}

/**
 * Hook for monitoring blockchain transaction status
 */
export function useTransactionMonitoring(
  options: UseTransactionMonitoringOptions = {},
): UseTransactionMonitoringReturn {
  const [status, setStatus] = useState<TransactionStatus | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentTransactionHash, setCurrentTransactionHash] = useState<
    string | null
  >(null);

  const { autoStart = true, onSuccess, onError, onStatusChange } = options;

  const handleStatusUpdate = useCallback(
    (newStatus: TransactionStatus) => {
      setStatus(newStatus);

      // Call the general status change callback
      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      // Call specific callbacks based on status
      if (newStatus.status === "success" && onSuccess) {
        onSuccess(newStatus);
      } else if (newStatus.status === "failed" && onError) {
        onError(newStatus);
      }

      // Stop monitoring when transaction is complete
      if (newStatus.status === "success" || newStatus.status === "failed") {
        setIsMonitoring(false);
      }
    },
    [onSuccess, onError, onStatusChange],
  );

  const startMonitoring = useCallback(
    async (transactionHash: string) => {
      if (!transactionHash) {
        console.error("Cannot start monitoring: no transaction hash provided");
        return;
      }

      setCurrentTransactionHash(transactionHash);
      setIsMonitoring(true);

      // Set initial pending status
      const initialStatus: TransactionStatus = {
        status: "pending",
        transactionHash,
      };
      handleStatusUpdate(initialStatus);

      try {
        // Start monitoring the transaction
        await MiniKitService.waitForConfirmation(
          transactionHash,
          handleStatusUpdate,
        );
      } catch (error) {
        console.error("Error monitoring transaction:", error);

        const errorStatus: TransactionStatus = {
          status: "failed",
          transactionHash,
          error: error instanceof Error ? error.message : "Monitoring failed",
        };

        handleStatusUpdate(errorStatus);
      }
    },
    [handleStatusUpdate],
  );

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const reset = useCallback(() => {
    setStatus(null);
    setIsMonitoring(false);
    setCurrentTransactionHash(null);
  }, []);

  // Auto-start monitoring if transaction hash is provided and autoStart is true
  useEffect(() => {
    if (autoStart && currentTransactionHash && !isMonitoring && !status) {
      startMonitoring(currentTransactionHash);
    }
  }, [
    autoStart,
    currentTransactionHash,
    isMonitoring,
    status,
    startMonitoring,
  ]);

  return {
    status,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    reset,
  };
}

/**
 * Hook for monitoring distribution recording transactions
 */
export function useDistributionTransaction() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monitoring = useTransactionMonitoring({
    onSuccess: (status) => {
      console.log("Distribution transaction confirmed:", status);
      setIsRecording(false);
      setError(null);
    },
    onError: (status) => {
      console.error("Distribution transaction failed:", status);
      setIsRecording(false);
      setError(status.error || "Transaction failed");
    },
  });

  const recordDistribution = useCallback(
    async (params: any) => {
      setIsRecording(true);
      setError(null);
      monitoring.reset();

      try {
        const result = await MiniKitService.recordDistribution(params);

        if (result.success && result.transactionHash) {
          monitoring.startMonitoring(result.transactionHash);
          return result;
        } else {
          setIsRecording(false);
          setError(result.error || "Transaction failed");
          return result;
        }
      } catch (err) {
        setIsRecording(false);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [monitoring],
  );

  return {
    recordDistribution,
    isRecording: isRecording || monitoring.isMonitoring,
    status: monitoring.status,
    error,
    reset: () => {
      setIsRecording(false);
      setError(null);
      monitoring.reset();
    },
  };
}

/**
 * Hook for monitoring family registration transactions
 */
export function useFamilyRegistrationTransaction() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monitoring = useTransactionMonitoring({
    onSuccess: (status) => {
      console.log("Family registration transaction confirmed:", status);
      setIsRegistering(false);
      setError(null);
    },
    onError: (status) => {
      console.error("Family registration transaction failed:", status);
      setIsRegistering(false);
      setError(status.error || "Transaction failed");
    },
  });

  const registerFamily = useCallback(
    async (uridHash: string, familySize: number) => {
      setIsRegistering(true);
      setError(null);
      monitoring.reset();

      try {
        const result = await MiniKitService.registerFamily(
          uridHash,
          familySize,
        );

        if (result.success && result.transactionHash) {
          monitoring.startMonitoring(result.transactionHash);
          return result;
        } else {
          setIsRegistering(false);
          setError(result.error || "Transaction failed");
          return result;
        }
      } catch (err) {
        setIsRegistering(false);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [monitoring],
  );

  return {
    registerFamily,
    isRegistering: isRegistering || monitoring.isMonitoring,
    status: monitoring.status,
    error,
    reset: () => {
      setIsRegistering(false);
      setError(null);
      monitoring.reset();
    },
  };
}
