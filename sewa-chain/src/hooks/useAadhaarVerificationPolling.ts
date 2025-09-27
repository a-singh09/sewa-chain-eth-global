import { useState, useEffect, useCallback, useRef } from "react";

export interface VerificationResult {
  hashedIdentifier: string;
  credentialSubject: {
    nationality: string;
    gender: string;
    minimumAge: boolean;
  };
}

export interface UseAadhaarVerificationPollingOptions {
  sessionId: string | null;
  pollInterval?: number; // milliseconds, default 2000 (2 seconds)
  maxPollTime?: number; // milliseconds, default 300000 (5 minutes)
  onSuccess?: (result: VerificationResult) => void;
  onError?: (error: string) => void;
  onExpired?: () => void;
}

export interface UseAadhaarVerificationPollingReturn {
  status: "idle" | "polling" | "completed" | "failed" | "expired";
  result: VerificationResult | null;
  error: string | null;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  resetPolling: () => void;
}

/**
 * Custom hook for polling Aadhaar verification status
 *
 * This hook handles the polling logic for checking verification status
 * after the user has gone to the Self app for Aadhaar verification.
 *
 * Usage:
 * ```tsx
 * const { status, result, startPolling } = useAadhaarVerificationPolling({
 *   sessionId: 'session_id_from_verification',
 *   onSuccess: (result) => {
 *     console.log('Verification completed:', result);
 *     // Proceed with URID generation
 *   },
 *   onError: (error) => {
 *     console.error('Verification failed:', error);
 *   }
 * });
 * ```
 */
export function useAadhaarVerificationPolling({
  sessionId,
  pollInterval = 2000,
  maxPollTime = 300000, // 5 minutes
  onSuccess,
  onError,
  onExpired,
}: UseAadhaarVerificationPollingOptions): UseAadhaarVerificationPollingReturn {
  const [status, setStatus] = useState<
    "idle" | "polling" | "completed" | "failed" | "expired"
  >("idle");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartTimeRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
    pollStartTimeRef.current = null;
  }, []);

  const checkVerificationStatus = useCallback(async () => {
    if (!sessionId) {
      setError("No session ID provided");
      setStatus("failed");
      stopPolling();
      return;
    }

    try {
      const response = await fetch(
        `/api/verify-aadhaar/status?sessionId=${sessionId}`,
      );
      const data = await response.json();

      switch (data.status) {
        case "completed":
          if (data.result && data.hashedIdentifier && data.credentialSubject) {
            const verificationResult: VerificationResult = {
              hashedIdentifier: data.hashedIdentifier,
              credentialSubject: data.credentialSubject,
            };
            setResult(verificationResult);
            setStatus("completed");
            setError(null);
            stopPolling();
            onSuccess?.(verificationResult);
          } else {
            setError("Verification completed but missing required data");
            setStatus("failed");
            stopPolling();
            onError?.("Verification completed but missing required data");
          }
          break;

        case "failed":
          setError(data.message || "Verification failed");
          setStatus("failed");
          stopPolling();
          onError?.(data.message || "Verification failed");
          break;

        case "expired":
          setError("Verification session expired");
          setStatus("expired");
          stopPolling();
          onExpired?.();
          break;

        case "pending":
          // Check if we've exceeded max poll time
          if (
            pollStartTimeRef.current &&
            Date.now() - pollStartTimeRef.current > maxPollTime
          ) {
            setError("Verification timeout - please try again");
            setStatus("failed");
            stopPolling();
            onError?.("Verification timeout - please try again");
          }
          // Continue polling
          break;

        default:
          setError(`Unknown verification status: ${data.status}`);
          setStatus("failed");
          stopPolling();
          onError?.(`Unknown verification status: ${data.status}`);
      }
    } catch (fetchError) {
      console.error("Error checking verification status:", fetchError);
      setError("Network error while checking verification status");
      setStatus("failed");
      stopPolling();
      onError?.("Network error while checking verification status");
    }
  }, [sessionId, maxPollTime, stopPolling, onSuccess, onError, onExpired]);

  const startPolling = useCallback(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setStatus("failed");
      return;
    }

    if (isPolling) {
      return; // Already polling
    }

    setStatus("polling");
    setIsPolling(true);
    setError(null);
    setResult(null);
    pollStartTimeRef.current = Date.now();

    // Check immediately
    checkVerificationStatus();

    // Set up polling interval
    pollIntervalRef.current = setInterval(
      checkVerificationStatus,
      pollInterval,
    );
  }, [sessionId, isPolling, pollInterval, checkVerificationStatus]);

  const resetPolling = useCallback(() => {
    stopPolling();
    setStatus("idle");
    setResult(null);
    setError(null);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Auto-start polling when sessionId is provided
  useEffect(() => {
    if (sessionId && status === "idle") {
      startPolling();
    }
  }, [sessionId, status, startPolling]);

  return {
    status,
    result,
    error,
    isPolling,
    startPolling,
    stopPolling,
    resetPolling,
  };
}
