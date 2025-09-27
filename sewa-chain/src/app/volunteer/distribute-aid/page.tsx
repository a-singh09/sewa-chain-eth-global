"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  QrCodeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { QRScanner } from "@/components/QRScanner";
import { AidTypeSelector } from "@/components/AidTypeSelector";
import { VolunteerVerification } from "@/components/VolunteerVerification";
import { useVolunteerSession } from "@/hooks/useVolunteerSession";
import {
  DistributionState,
  AidType,
  EligibilityResult,
  Family,
  VolunteerSession,
} from "@/types";

export default function DistributeAidPage() {
  const { session: volunteerSession, isLoading: sessionLoading } =
    useVolunteerSession();
  const [distributionState, setDistributionState] = useState<DistributionState>(
    {
      phase: "scanning",
      isProcessing: false,
    },
  );

  // Reset to scanning phase when component mounts
  useEffect(() => {
    setDistributionState({
      phase: "scanning",
      isProcessing: false,
    });
  }, []);

  // Handle QR code scan
  const handleQRScan = async (urid: string) => {
    setDistributionState((prev) => ({
      ...prev,
      phase: "validating",
      scannedURID: urid,
      isProcessing: true,
      error: undefined,
    }));

    try {
      // Validate family and check eligibility for all aid types
      const response = await fetch("/api/families/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urid,
          volunteerSession: volunteerSession?.sessionToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to validate family");
      }

      // Check eligibility for all aid types
      const eligibilityChecks = await Promise.all(
        Object.values(AidType).map(async (aidType) => {
          const eligibilityResponse = await fetch(
            "/api/distributions/eligibility",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                urid,
                aidType,
                volunteerSession: volunteerSession?.sessionToken,
              }),
            },
          );

          const eligibilityData = await eligibilityResponse.json();

          return {
            aidType,
            eligibility: eligibilityData.eligibility as EligibilityResult,
          };
        }),
      );

      setDistributionState((prev) => ({
        ...prev,
        phase: "selecting",
        familyInfo: data.family,
        eligibilityChecks,
        isProcessing: false,
      }));
    } catch (error) {
      console.error("Family validation error:", error);
      setDistributionState((prev) => ({
        ...prev,
        phase: "scanning",
        isProcessing: false,
        error:
          error instanceof Error ? error.message : "Failed to validate family",
      }));
    }
  };

  // Handle aid type selection
  const handleAidTypeSelect = (aidType: AidType) => {
    setDistributionState((prev) => ({
      ...prev,
      phase: "confirming",
      selectedAidType: aidType,
    }));
  };

  // Handle distribution confirmation
  const handleConfirmDistribution = async (distributionData: {
    quantity: number;
    location: string;
  }) => {
    if (
      !distributionState.scannedURID ||
      !distributionState.selectedAidType ||
      !volunteerSession
    ) {
      return;
    }

    setDistributionState((prev) => ({
      ...prev,
      phase: "recording",
      isProcessing: true,
    }));

    try {
      // First record in API (for immediate feedback and validation)
      const response = await fetch("/api/distributions/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urid: distributionState.scannedURID,
          aidType: distributionState.selectedAidType,
          quantity: distributionData.quantity,
          location: distributionData.location,
          volunteerSession: volunteerSession.sessionToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to record distribution");
      }

      // If API recording succeeds, proceed to blockchain transaction
      // For demo purposes, we'll simulate the blockchain transaction
      // In production, this would use MiniKitService.recordDistribution()

      // Simulate blockchain transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Distribution recorded successfully:", {
        distributionId: data.distributionId,
        transactionHash: data.transactionHash,
      });

      setDistributionState((prev) => ({
        ...prev,
        phase: "complete",
        isProcessing: false,
      }));
    } catch (error) {
      console.error("Distribution recording error:", error);
      setDistributionState((prev) => ({
        ...prev,
        phase: "confirming",
        isProcessing: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to record distribution",
      }));
    }
  };

  // Handle scan error
  const handleScanError = (error: string) => {
    setDistributionState((prev) => ({
      ...prev,
      error,
    }));
  };

  // Reset to start new distribution
  const handleStartNew = () => {
    setDistributionState({
      phase: "scanning",
      isProcessing: false,
    });
  };

  // Show loading if session is still loading
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading volunteer session...</p>
        </div>
      </div>
    );
  }

  // Show verification form if no volunteer session
  if (!volunteerSession) {
    return <VolunteerVerificationRequired />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Distribute Aid
              </h1>
              <p className="text-gray-600 mt-1">
                Scan family QR code to record aid distribution
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Volunteer</p>
              <p className="font-medium text-gray-900">
                {volunteerSession.volunteerId.substring(0, 8)}...
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {distributionState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{distributionState.error}</p>
            </div>
          </div>
        )}

        {/* Phase-based Content */}
        {distributionState.phase === "scanning" && (
          <ScanningPhase
            onScan={handleQRScan}
            onError={handleScanError}
            isProcessing={distributionState.isProcessing}
          />
        )}

        {distributionState.phase === "validating" && <ValidatingPhase />}

        {distributionState.phase === "selecting" &&
          distributionState.eligibilityChecks && (
            <SelectingPhase
              familyInfo={distributionState.familyInfo}
              eligibilityChecks={distributionState.eligibilityChecks}
              onSelect={handleAidTypeSelect}
              onBack={handleStartNew}
            />
          )}

        {distributionState.phase === "confirming" && (
          <ConfirmingPhase
            familyInfo={distributionState.familyInfo}
            selectedAidType={distributionState.selectedAidType!}
            onConfirm={handleConfirmDistribution}
            onBack={() =>
              setDistributionState((prev) => ({ ...prev, phase: "selecting" }))
            }
            isProcessing={distributionState.isProcessing}
          />
        )}

        {distributionState.phase === "recording" && <RecordingPhase />}

        {distributionState.phase === "complete" && (
          <CompletePhase onStartNew={handleStartNew} />
        )}
      </div>
    </div>
  );
}

// Scanning Phase Component
function ScanningPhase({
  onScan,
  onError,
  isProcessing,
}: {
  onScan: (urid: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <QRScanner onScan={onScan} onError={onError} isActive={!isProcessing} />

      {isProcessing && (
        <div className="mt-4 text-center">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Validating family...</p>
        </div>
      )}
    </div>
  );
}

// Validating Phase Component
function ValidatingPhase() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Validating Family
      </h3>
      <p className="text-gray-600">
        Checking family registration and aid eligibility...
      </p>
    </div>
  );
}

// Selecting Phase Component
function SelectingPhase({
  familyInfo,
  eligibilityChecks,
  onSelect,
  onBack,
}: {
  familyInfo?: Family;
  eligibilityChecks: Array<{
    aidType: AidType;
    eligibility: EligibilityResult;
  }>;
  onSelect: (aidType: AidType) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Family Info */}
      {familyInfo && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Family Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-600">
                Family Size: {familyInfo.familySize}
              </span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-600">
                Registered:{" "}
                {new Date(familyInfo.registrationTime).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Aid Type Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Aid Type
        </h3>
        <AidTypeSelector
          eligibilityChecks={eligibilityChecks}
          onSelect={onSelect}
        />
      </div>

      {/* Back Button */}
      <div className="flex justify-center">
        <Button
          onClick={onBack}
          variant="secondary"
          className="min-h-[44px] px-8"
        >
          Scan Different QR Code
        </Button>
      </div>
    </div>
  );
}

// Confirming Phase Component
function ConfirmingPhase({
  familyInfo,
  selectedAidType,
  onConfirm,
  onBack,
  isProcessing,
}: {
  familyInfo?: Family;
  selectedAidType: AidType;
  onConfirm: (data: { quantity: number; location: string }) => void;
  onBack: () => void;
  isProcessing: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > 0 && location.trim()) {
      onConfirm({ quantity, location: location.trim() });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Confirm Distribution
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Aid Type Display */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Selected Aid Type</p>
          <p className="text-lg font-semibold text-blue-900">
            {selectedAidType}
          </p>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Location Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distribution Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Relief Camp A, Sector 5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={onBack}
            variant="secondary"
            className="flex-1 min-h-[44px]"
            disabled={isProcessing}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 min-h-[44px]"
            disabled={isProcessing || !location.trim()}
          >
            {isProcessing ? "Recording..." : "Confirm Distribution"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Recording Phase Component
function RecordingPhase() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Recording Distribution
      </h3>
      <p className="text-gray-600">
        Saving distribution record to blockchain...
      </p>
    </div>
  );
}

// Complete Phase Component
function CompletePhase({ onStartNew }: { onStartNew: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Distribution Recorded Successfully
      </h3>
      <p className="text-gray-600 mb-6">
        The aid distribution has been recorded on the blockchain and the
        family's eligibility has been updated.
      </p>

      <Button
        onClick={onStartNew}
        variant="primary"
        className="min-h-[44px] px-8"
      >
        Distribute to Another Family
      </Button>
    </div>
  );
}

// Volunteer Verification Required Component
function VolunteerVerificationRequired() {
  const { login } = useVolunteerSession();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVolunteerVerified = (volunteerData: VolunteerSession) => {
    login(volunteerData);
    // The page will automatically re-render and show the distribute aid interface
  };

  const handleVerificationError = (error: any) => {
    console.error("Volunteer verification failed:", error);
    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Volunteer Verification Required
          </h2>
          <p className="text-gray-600">
            You need to verify your volunteer status before distributing aid.
          </p>
        </div>

        <VolunteerVerification
          onVerified={handleVolunteerVerified}
          onError={handleVerificationError}
          disabled={isVerifying}
        />

        <div className="mt-6 text-center">
          <Button
            onClick={() => (window.location.href = "/home")}
            variant="secondary"
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
