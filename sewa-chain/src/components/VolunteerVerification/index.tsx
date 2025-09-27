"use client";

import { useState, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import {
  VolunteerVerificationProps,
  VerificationState,
  VerificationError,
  VerificationErrorCode,
  VerificationLevel,
} from "@/types";
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const errorMessages: Record<VerificationErrorCode, string> = {
  [VerificationErrorCode.MINIKIT_UNAVAILABLE]:
    "World App is required for volunteer verification",
  [VerificationErrorCode.USER_CANCELLED]: "Verification was cancelled",
  [VerificationErrorCode.VERIFICATION_FAILED]: "World ID verification failed",
  [VerificationErrorCode.ALREADY_REGISTERED]:
    "This identity is already registered as a volunteer",
  [VerificationErrorCode.NETWORK_ERROR]:
    "Network error occurred. Please try again.",
  [VerificationErrorCode.INVALID_PROOF]: "Invalid verification proof",
};

export function VolunteerVerification({
  onVerified,
  onError,
  disabled = false,
  className = "",
}: VolunteerVerificationProps) {
  const [verificationState, setVerificationState] =
    useState<VerificationState>("idle");
  const [errorDetails, setErrorDetails] = useState<VerificationError | null>(
    null,
  );

  // Auto-reset error state after 3 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (verificationState === "failed" && errorDetails) {
      timeoutId = setTimeout(() => {
        setVerificationState("idle");
        setErrorDetails(null);
      }, 3000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [verificationState, errorDetails]);

  const handleVolunteerVerification = async () => {
    try {
      setVerificationState("pending");
      setErrorDetails(null);

      // Check MiniKit availability
      if (!MiniKit.isInstalled()) {
        throw new Error("MINIKIT_UNAVAILABLE");
      }

      // Use MiniKit async commands for verification with Device level (for hackathon demo)
      console.log("Starting World ID verification...");
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: "verify-volunteer",
        verification_level: VerificationLevel.Device, // Changed from Orb to Device for hackathon
      });

      console.log("World ID verification payload:", {
        status: finalPayload.status,
        verification_level: finalPayload.verification_level,
        nullifier_hash: finalPayload.nullifier_hash?.substring(0, 20) + "...",
      });

      if (finalPayload.status !== "success") {
        console.error("World ID verification failed:", finalPayload);
        throw new Error("USER_CANCELLED");
      }

      // Send proof to backend for verification
      console.log("Sending proof to backend...");
      const response = await fetch("/api/verify-volunteer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          action: "verify-volunteer",
        }),
      });

      const data = await response.json();
      console.log("Backend response:", {
        ok: response.ok,
        status: response.status,
        success: data.success,
        error: data.error,
      });

      if (!response.ok || !data.success) {
        const errorCode = data.error?.code || "VERIFICATION_FAILED";
        console.error("Backend verification failed:", data.error);
        throw new Error(errorCode);
      }

      if (data.volunteerSession) {
        setVerificationState("success");
        onVerified(data.volunteerSession);
      } else {
        throw new Error("VERIFICATION_FAILED");
      }
    } catch (error: any) {
      const errorCode =
        (error.message as VerificationErrorCode) ||
        VerificationErrorCode.VERIFICATION_FAILED;
      const verificationError: VerificationError = {
        code: errorCode,
        message: errorMessages[errorCode] || "Unknown verification error",
        details: error,
      };

      setVerificationState("failed");
      setErrorDetails(verificationError);
      onError?.(verificationError);
    }
  };

  const getButtonText = () => {
    switch (verificationState) {
      case "pending":
        return "Verifying with World ID...";
      case "success":
        return "Verification Complete!";
      case "failed":
        return "Verification Failed";
      default:
        return "Verify as Volunteer (Device)";
    }
  };

  const getButtonVariant = () => {
    switch (verificationState) {
      case "success":
        return "success" as const;
      case "failed":
        return "error" as const;
      default:
        return "primary" as const;
    }
  };

  const getIcon = () => {
    switch (verificationState) {
      case "success":
        return <CheckIcon className="w-5 h-5" />;
      case "failed":
        return <XMarkIcon className="w-5 h-5" />;
      case "pending":
        return null; // Loading spinner handled by Button component
      default:
        return <ExclamationTriangleIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto space-y-4 ${className}`}>
      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">
              Device Verification Required
            </p>
            <p className="text-blue-700">
              Volunteer verification required. Device level verification is
              sufficient for this demo.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Button */}
      <Button
        onClick={handleVolunteerVerification}
        disabled={
          disabled ||
          verificationState === "pending" ||
          verificationState === "success"
        }
        loading={verificationState === "pending" ? "true" : "false"}
        variant={getButtonVariant()}
        className="w-full flex items-center justify-center space-x-2 py-3"
      >
        {getIcon()}
        <span>{getButtonText()}</span>
      </Button>

      {/* Live Feedback */}
      {verificationState !== "idle" && (
        <LiveFeedback
          status={
            verificationState === "success"
              ? "success"
              : verificationState === "failed"
                ? "error"
                : "loading"
          }
          message={
            verificationState === "success"
              ? "Successfully verified as volunteer!"
              : verificationState === "failed"
                ? errorDetails?.message || "Verification failed"
                : "Processing World ID verification..."
          }
        />
      )}

      {/* Verification Level Badge */}
      {verificationState === "success" && (
        <div className="flex items-center justify-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-800">
            Verified at Device Level
          </span>
        </div>
      )}
    </div>
  );
}
