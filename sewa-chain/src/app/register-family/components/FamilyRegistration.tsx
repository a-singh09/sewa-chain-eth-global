"use client";

import React, { useState, useCallback } from "react";
import {
  FamilyRegistrationProps,
  RegistrationState,
  FamilyRegistrationData,
} from "@/types";
import { BasicInfoForm } from "./BasicInfoForm";
import { URIDDisplay } from "./URIDDisplay";
import { AadhaarVerification } from "@/components/AadhaarVerification";

export function FamilyRegistration({
  onComplete,
  onError,
}: FamilyRegistrationProps) {
  const [registrationState, setRegistrationState] = useState<RegistrationState>(
    {
      step: "basic_info",
      familyData: {
        headOfFamily: "",
        familySize: 1,
        location: "",
        contactNumber: "",
      },
      isLoading: false,
    },
  );

  const handleBasicInfoNext = useCallback(
    (familyData: FamilyRegistrationData) => {
      setRegistrationState((prev) => ({
        ...prev,
        familyData,
        step: "aadhaar_verification",
        error: undefined,
      }));
    },
    [],
  );

  const handleAadhaarVerificationComplete = useCallback(
    async (hashedAadhaar: string, credentialSubject: any) => {
      setRegistrationState((prev) => ({
        ...prev,
        hashedAadhaar,
        credentialSubject,
        step: "urid_generation",
        isLoading: true,
        error: undefined,
      }));

      try {
        const response = await fetch("/api/generate-urid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hashedAadhaar,
            location: registrationState.familyData.location,
            familySize: registrationState.familyData.familySize,
            contactInfo: registrationState.familyData.contactNumber,
          }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Network error" }));
          throw new Error(
            errorData.message || `Server error: ${response.status}`,
          );
        }

        const data = await response.json();

        if (data.status !== "success") {
          throw new Error(data.message || "Failed to generate URID");
        }

        setRegistrationState((prev) => ({
          ...prev,
          urid: data.urid,
          qrCode: data.qrCode,
          step: "complete",
          isLoading: false,
        }));
      } catch (error) {
        console.error("URID generation error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to generate URID";

        setRegistrationState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          step: "aadhaar_verification",
        }));

        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    },
    [registrationState.familyData, onError],
  );

  const handleAadhaarVerificationError = useCallback(
    (error: string) => {
      setRegistrationState((prev) => ({
        ...prev,
        error: error,
        isLoading: false,
      }));
      onError(new Error(error));
    },
    [onError],
  );

  const handleURIDComplete = useCallback(() => {
    if (registrationState.urid) {
      onComplete(registrationState.urid);
    }
  }, [registrationState.urid, onComplete]);

  const renderProgressIndicator = () => {
    const steps = [
      "basic_info",
      "aadhaar_verification",
      "urid_generation",
      "complete",
    ];
    const labels = [
      "Basic Information",
      "Aadhaar Verification",
      "URID Generation",
      "Complete",
    ];

    const currentIndex = steps.indexOf(registrationState.step);
    const progress = ((currentIndex + 1) / steps.length) * 100;

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-blue-600">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {labels[currentIndex]}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (
      registrationState.isLoading &&
      registrationState.step === "urid_generation"
    ) {
      return (
        <div className="space-y-6 text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">
            Generating Your URID
          </h2>
          <p className="text-gray-600">
            Please wait while we create your unique family identifier...
          </p>
        </div>
      );
    }

    switch (registrationState.step) {
      case "basic_info":
        return (
          <BasicInfoForm
            onNext={handleBasicInfoNext}
            initialData={registrationState.familyData}
          />
        );

      case "aadhaar_verification":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Aadhaar Verification
              </h2>
              <p className="text-gray-600">
                Verify your identity with Self Protocol for secure registration
              </p>
            </div>

            {registrationState.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700">
                  {registrationState.error}
                </p>
              </div>
            )}

            <AadhaarVerification
              onVerified={handleAadhaarVerificationComplete}
              onError={handleAadhaarVerificationError}
              familyData={{
                headOfFamily: registrationState.familyData.headOfFamily,
                familySize: registrationState.familyData.familySize,
                location: registrationState.familyData.location,
                contactNumber: registrationState.familyData.contactNumber,
              }}
            />

            <div className="text-center">
              <button
                onClick={() =>
                  setRegistrationState((prev) => ({
                    ...prev,
                    step: "basic_info",
                  }))
                }
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Basic Information
              </button>
            </div>
          </div>
        );

      case "complete":
        if (!registrationState.urid || !registrationState.qrCode) {
          return (
            <div className="text-center py-12">
              <p className="text-red-600">Error: Missing registration data</p>
            </div>
          );
        }

        return (
          <URIDDisplay
            urid={registrationState.urid}
            qrCode={registrationState.qrCode}
            familyData={registrationState.familyData}
            onComplete={handleURIDComplete}
          />
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Unknown step</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {renderProgressIndicator()}
      {renderCurrentStep()}
    </div>
  );
}
