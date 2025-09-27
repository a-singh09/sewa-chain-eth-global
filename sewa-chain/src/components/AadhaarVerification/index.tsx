"use client";

import React, { useState, useCallback } from "react";
import { SelfQRcodeWrapper } from "@selfxyz/core";
import { SelfAppBuilder } from "@selfxyz/core";
import {
  useAadhaarVerificationPolling,
  VerificationResult,
} from "@/hooks/useAadhaarVerificationPolling";

export interface FamilyRegistrationData {
  headOfFamily: string;
  familySize: number;
  location: string;
  contactNumber: string;
}

export interface AadhaarVerificationProps {
  familyData: FamilyRegistrationData;
  onVerified: (hashedAadhaar: string, credentialSubject: any) => void;
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

  // Set up verification status polling
  const {
    status: pollStatus,
    result,
    error: pollError,
    isPolling,
  } = useAadhaarVerificationPolling({
    sessionId: state.sessionId,
    onSuccess: useCallback(
      (result: VerificationResult) => {
        setState((prev) => ({ ...prev, phase: "completed" }));
        onVerified(result.hashedIdentifier, result.credentialSubject);
      },
      [onVerified],
    ),
    onError: useCallback(
      (error: string) => {
        setState((prev) => ({ ...prev, phase: "error", error }));
        onError(error);
      },
      [onError],
    ),
    onExpired: useCallback(() => {
      setState((prev) => ({
        ...prev,
        phase: "error",
        error: "Verification session expired",
      }));
      onError("Verification session expired - please try again");
    }, [onError]),
  });

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

    return new SelfAppBuilder({
      appName: process.env.NEXT_PUBLIC_SELF_APP_NAME,
      scope: process.env.NEXT_PUBLIC_SELF_SCOPE,
      endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT,
      userId: `family_${Date.now()}`, // Unique identifier for this verification
      userIdType: "uuid",
      version: 2,
      userDefinedData: JSON.stringify({
        familySize: familyData.familySize,
        location: familyData.location,
        contactInfo: familyData.contactNumber,
        timestamp: Date.now(),
      }),
      disclosures: {
        nationality: true,
        gender: true,
        minimumAge: 18, // Require 18+ for family registration
      },
      devMode: process.env.NODE_ENV === "development",
    }).build();
  }, [familyData]);

  // Handle successful QR scan/verification initiation
  const handleVerificationStart = useCallback(() => {
    console.log("Aadhaar verification started via Self app");
    setState((prev) => ({ ...prev, phase: "waiting_verification" }));
  }, []);

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
  const handleVerificationComplete = useCallback(
    async (verificationData: any) => {
      console.log(
        "Verification data received from Self app:",
        verificationData,
      );

      try {
        // The verification data should contain the session ID for polling
        if (verificationData.sessionId) {
          setState((prev) => ({
            ...prev,
            phase: "polling_status",
            sessionId: verificationData.sessionId,
          }));
        } else {
          // Direct verification result (fallback)
          if (
            verificationData.hashedIdentifier &&
            verificationData.credentialSubject
          ) {
            setState((prev) => ({ ...prev, phase: "completed" }));
            onVerified(
              verificationData.hashedIdentifier,
              verificationData.credentialSubject,
            );
          } else {
            throw new Error("Invalid verification data received");
          }
        }
      } catch (error) {
        console.error("Error processing verification completion:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to process verification";
        setState((prev) => ({ ...prev, phase: "error", error: errorMessage }));
        onError(errorMessage);
      }
    },
    [onVerified, onError],
  );

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
              onSuccess={handleVerificationStart}
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
            {isPolling
              ? "Checking verification status..."
              : "Waiting for verification..."}
          </p>
          <div className="text-xs text-gray-500">Status: {pollStatus}</div>
        </div>
      )}

      {/* Completed Phase */}
      {state.phase === "completed" && result && (
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
          <p className="text-sm text-gray-600">
            Your Aadhaar has been verified successfully. Proceeding with family
            registration...
          </p>
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
            {state.error ||
              pollError ||
              "An error occurred during verification"}
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
          <div>Poll Status: {pollStatus}</div>
          <div>Is Polling: {isPolling ? "Yes" : "No"}</div>
          {state.error && <div>Error: {state.error}</div>}
          {pollError && <div>Poll Error: {pollError}</div>}
        </div>
      )}
    </div>
  );
}
