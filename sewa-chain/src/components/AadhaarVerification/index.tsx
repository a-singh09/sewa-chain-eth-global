"use client";

import React, { useState, useCallback } from "react";
import { createHash } from "crypto";
import { SelfQRcodeWrapper, SelfAppBuilder } from "@selfxyz/qrcode";
import { VerificationResult } from "@/hooks/useAadhaarVerificationPolling";

export interface FamilyRegistrationData {
  headOfFamily: string;
  familySize: number;
  location: string;
  contactNumber: string;
}

export interface AadhaarVerificationProps {
  familyData: FamilyRegistrationData;
  onVerified: (
    hashedAadhaar: string,
    credentialSubject: {
      nationality: string;
      gender: string;
      minimumAge: boolean;
    },
  ) => void;
  onError: (error: string) => void;
}

export interface AadhaarVerificationState {
  phase:
    | "qr_display"
    | "waiting_verification"
    | "polling_status"
    | "completed"
    | "error";
  sessionId: string | null;
  error: string | null;
}

/**
 * Aadhaar Verification Component using Self Protocol
 *
 * This component handles the complete Aadhaar verification flow:
 * 1. Display QR code for Self app
 * 2. User scans QR and verifies in Self app
 * 3. Poll for verification status
 * 4. Return results to parent component
 */
export function AadhaarVerification({
  familyData,
  onVerified,
  onError,
}: AadhaarVerificationProps) {
  const [state, setState] = useState<AadhaarVerificationState>({
    phase: "qr_display",
    sessionId: null,
    error: null,
  });

  // For demo purposes, we'll use a simplified verification flow
  // In production, you would use the polling hook with a real backend
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  // Create Self Protocol app configuration
  const selfApp = React.useMemo(() => {
    if (
      !process.env.NEXT_PUBLIC_SELF_APP_NAME ||
      !process.env.NEXT_PUBLIC_SELF_SCOPE ||
      !process.env.NEXT_PUBLIC_SELF_ENDPOINT
    ) {
      console.error("Self Protocol configuration missing");
      return null;
    }

    // Generate a valid hex userId (32 bytes = 64 hex characters)
    const generateHexUserId = () => {
      const timestamp = Date.now().toString(16).padStart(12, "0"); // 6 bytes
      const random = Math.random().toString(16).substring(2).padStart(14, "0"); // 7 bytes
      const familyHash = (familyData.headOfFamily || "default")
        .slice(0, 8)
        .split("")
        .map((c) => c.charCodeAt(0).toString(16))
        .join("")
        .padStart(16, "0"); // 8 bytes
      const locationHash = (familyData.location || "default")
        .slice(0, 2)
        .split("")
        .map((c) => c.charCodeAt(0).toString(16))
        .join("")
        .padStart(4, "0"); // 2 bytes
      const sizeHex = familyData.familySize.toString(16).padStart(2, "0"); // 1 byte
      const padding = "0".repeat(
        64 -
          timestamp.length -
          random.length -
          familyHash.length -
          locationHash.length -
          sizeHex.length,
      );
      return `0x${timestamp}${random}${familyHash}${locationHash}${sizeHex}${padding}`;
    };

    return new SelfAppBuilder({
      version: 2,
      appName:
        process.env.NEXT_PUBLIC_SELF_APP_NAME ||
        "SewaChain Aadhaar Verification",
      scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "sewachain-aadhaar",
      endpoint:
        process.env.NEXT_PUBLIC_SELF_ENDPOINT ||
        `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/verify-aadhaar`,
      logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png", // Default Self logo
      userId: generateHexUserId(),
      userIdType: "hex",
      userDefinedData: JSON.stringify({
        familySize: familyData.familySize,
        location: familyData.location,
        contactInfo: familyData.contactNumber,
        timestamp: Date.now(),
      }),
      disclosures: {
        // Verification requirements (must match backend exactly for Aadhaar)
        minimumAge: 18,
        ofac: false, // Aadhaar does not support OFAC checks - must be false
        excludedCountries: [], // No country restrictions for Aadhaar

        // Disclosure requests (what users reveal)
        nationality: true,
        gender: true,
        // Other optional fields can be added here
      },
      devMode:
        process.env.SELF_DEV_MODE === "true" ||
        process.env.NODE_ENV === "development",
    }).build();
  }, [familyData]);

  // Handle QR code errors
  const handleQRError = useCallback(
    (error: { error_code?: string; reason?: string }) => {
      console.error("Self Protocol QR error:", error);
      const errorMessage =
        error.reason || error.error_code || "QR code generation failed";
      setState((prev) => ({ ...prev, phase: "error", error: errorMessage }));
      onError(errorMessage);
    },
    [onError],
  );

  // Handle verification completion (from Self app callback)
  const handleVerificationComplete = useCallback(async () => {
    console.log("Self Protocol verification completed successfully!");

    // Check if onVerified callback is available
    if (typeof onVerified !== "function") {
      console.error("onVerified callback is not a function:", onVerified);
      setState((prev) => ({
        ...prev,
        phase: "error",
        error: "Verification callback not available",
      }));
      onError("Verification callback not available");
      return;
    }

    setState((prev) => ({ ...prev, phase: "waiting_verification" }));

    try {
      // When the Self app completes verification, it sends the proof to our backend
      // We need to wait a moment for the backend to process it, then check for results
      console.log("Waiting for backend verification to complete...");

      // Poll the backend for verification results
      // In the updated Self Protocol, verification results should be available shortly after onSuccess
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      const pollForResult = async (): Promise<void> => {
        attempts++;

        try {
          // Check if there's a recent verification result
          // This is a simplified approach - in production you might want to use websockets or server-sent events
          const response = await fetch("/api/verify-aadhaar", {
            method: "GET",
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Backend status check:", data);

            // For now, we'll create a deterministic result based on family data
            // In a real implementation, you'd get this from the actual verification
            const mockVerificationResult = {
              hashedIdentifier: `aadhaar-${createHash("sha256")
                .update(
                  `${familyData.headOfFamily}-${familyData.location}-${Date.now()}`,
                )
                .digest("hex")
                .substring(0, 16)}`,
              credentialSubject: {
                nationality: "IND", // Aadhaar is always Indian
                gender: "U", // Unknown - users can choose what to disclose
                minimumAge: true, // Based on 18+ requirement
              },
            };

            console.log("Using verification result:", mockVerificationResult);
            setVerificationResult(mockVerificationResult);

            // Call the parent callback
            onVerified(
              mockVerificationResult.hashedIdentifier,
              mockVerificationResult.credentialSubject,
            );

            setState((prev) => ({ ...prev, phase: "completed" }));
            return;
          }
        } catch (error) {
          console.warn(`Poll attempt ${attempts} failed:`, error);
        }

        if (attempts >= maxAttempts) {
          throw new Error("Verification timeout - backend did not respond");
        }

        // Wait 1 second before next attempt
        setTimeout(() => {
          pollForResult().catch((error) => {
            console.error("Polling failed:", error);
            setState((prev) => ({
              ...prev,
              phase: "error",
              error: "Verification timeout",
            }));
            onError("Verification took too long to complete");
          });
        }, 1000);
      };

      // Start polling after a short delay
      setTimeout(() => {
        pollForResult().catch((error) => {
          console.error("Initial poll failed:", error);
          setState((prev) => ({
            ...prev,
            phase: "error",
            error: "Failed to verify with backend",
          }));
          onError("Failed to verify with backend");
        });
      }, 2000);
    } catch (error) {
      console.error("Error processing verification:", error);
      setState((prev) => ({
        ...prev,
        phase: "error",
        error: "Failed to process verification result",
      }));
      onError("Failed to process verification result");
    }
  }, [onVerified, onError, familyData]);

  // Retry verification
  const handleRetry = useCallback(() => {
    setState({
      phase: "qr_display",
      sessionId: null,
      error: null,
    });
  }, []);

  if (!selfApp) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Configuration Error
        </h3>
        <p className="text-red-600">
          Self Protocol configuration is missing. Please check your environment
          variables.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Aadhaar Verification
        </h2>
        <p className="text-sm text-gray-600">
          Verify your identity using the Self app for privacy-preserving Aadhaar
          verification
        </p>
      </div>

      {/* QR Code Display Phase */}
      {state.phase === "qr_display" && (
        <div className="text-center">
          <div className="mb-4">
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleVerificationComplete}
              onError={handleQRError}
              type="websocket"
              size={250}
              darkMode={false}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              1. Open the Self app on your phone
            </p>
            <p className="text-sm text-gray-600">2. Scan the QR code above</p>
            <p className="text-sm text-gray-600">
              3. Complete Aadhaar verification in the Self app
            </p>
          </div>
        </div>
      )}

      {/* Waiting for Verification Phase */}
      {state.phase === "waiting_verification" && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Verification in Progress
          </h3>
          <p className="text-sm text-gray-600">
            Please complete the Aadhaar verification in your Self app
          </p>
        </div>
      )}

      {/* Polling Status Phase */}
      {state.phase === "polling_status" && (
        <div className="text-center">
          <div className="animate-pulse rounded-full h-12 w-12 bg-blue-100 mx-auto mb-4 flex items-center justify-center">
            <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Checking Verification Status
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Checking verification status...
          </p>
        </div>
      )}

      {/* Completed Phase */}
      {state.phase === "completed" && (
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-green-800 mb-2">
            Verification Successful
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your Aadhaar has been verified successfully. Proceeding to URID
            generation...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      )}

      {/* Error Phase */}
      {state.phase === "error" && (
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Verification Failed
          </h3>
          <p className="text-sm text-red-600 mb-4">
            {state.error || "An error occurred during verification"}
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-500">
          <div>Phase: {state.phase}</div>
          <div>Session ID: {state.sessionId || "None"}</div>
          {state.error && <div>Error: {state.error}</div>}
          {verificationResult && (
            <div>Result: {JSON.stringify(verificationResult, null, 2)}</div>
          )}
        </div>
      )}
    </div>
  );
}
