"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@worldcoin/mini-apps-ui-kit-react";
import { Page } from "@/components/PageLayout";
import { AadhaarVerification } from "@/components/AadhaarVerification";
import {
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface FamilyRegistrationData {
  headOfFamily: string;
  familySize: number;
  location: string;
  contactNumber: string;
}

interface CredentialSubject {
  nationality: string;
  gender: string;
  minimumAge: boolean;
}

interface RegistrationState {
  step: "basic_info" | "aadhaar_verification" | "urid_generation" | "complete";
  familyData: FamilyRegistrationData;
  hashedAadhaar?: string;
  credentialSubject?: CredentialSubject;
  urid?: string;
  qrCode?: string;
  error?: string;
  isLoading?: boolean;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
];

export default function FamilyRegistrationPage() {
  const router = useRouter();
  const [registrationState, setRegistrationState] = useState<RegistrationState>(
    {
      step: "basic_info",
      familyData: {
        headOfFamily: "",
        familySize: 1,
        location: "",
        contactNumber: "",
      },
    },
  );

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate basic info
    const { headOfFamily, familySize, location, contactNumber } =
      registrationState.familyData;

    if (!headOfFamily.trim() || !location.trim() || !contactNumber.trim()) {
      setRegistrationState((prev) => ({
        ...prev,
        error: "Please fill in all required fields",
      }));
      return;
    }

    if (familySize < 1 || familySize > 20) {
      setRegistrationState((prev) => ({
        ...prev,
        error: "Family size must be between 1 and 20",
      }));
      return;
    }

    if (!/^[+]?[\d\s\-()]{10,15}$/.test(contactNumber.trim())) {
      setRegistrationState((prev) => ({
        ...prev,
        error: "Please enter a valid contact number",
      }));
      return;
    }

    setRegistrationState((prev) => ({
      ...prev,
      step: "aadhaar_verification",
      error: undefined,
    }));
  };

  const handleAadhaarVerificationComplete = async (
    hashedId: string,
    credentialSubject: CredentialSubject,
  ) => {
    console.log("Aadhaar verification completed:", {
      hashedId,
      credentialSubject,
    });

    setRegistrationState((prev) => ({
      ...prev,
      hashedAadhaar: hashedId,
      credentialSubject,
      step: "urid_generation",
      isLoading: true,
      error: undefined,
    }));

    try {
      // Generate URID using the Self Protocol hashed identifier
      const response = await fetch("/api/generate-urid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hashedAadhaar: hashedId,
          familyData: registrationState.familyData,
          credentialSubject: credentialSubject,
          // Include additional context for URID generation
          verificationMethod: "self_protocol",
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to generate URID");
      }

      console.log("URID generated successfully:", { urid: data.urid });

      setRegistrationState((prev) => ({
        ...prev,
        urid: data.urid,
        qrCode: data.qrCode,
        step: "complete",
        isLoading: false,
      }));
    } catch (error) {
      console.error("URID generation error:", error);
      setRegistrationState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate URID. Please try again.",
        isLoading: false,
        step: "aadhaar_verification", // Go back to verification step on error
      }));
    }
  };

  const handleAadhaarVerificationError = (error: Error) => {
    console.error("Aadhaar verification error:", error);

    let userFriendlyMessage = error.message;

    // Provide more user-friendly error messages
    if (
      error.message.includes("network") ||
      error.message.includes("timeout")
    ) {
      userFriendlyMessage =
        "Network error occurred. Please check your connection and try again.";
    } else if (error.message.includes("configuration")) {
      userFriendlyMessage =
        "Verification service is temporarily unavailable. Please try again later.";
    } else if (error.message.includes("Self Protocol")) {
      userFriendlyMessage =
        "Self Protocol verification failed. Please ensure you have the Self app installed and try again.";
    }

    setRegistrationState((prev) => ({
      ...prev,
      error: userFriendlyMessage,
      isLoading: false,
      step: "aadhaar_verification", // Stay on verification step for retry
    }));
  };

  const updateFamilyData = (
    field: keyof FamilyRegistrationData,
    value: string | number,
  ) => {
    setRegistrationState((prev) => ({
      ...prev,
      familyData: {
        ...prev.familyData,
        [field]: value,
      },
      error: undefined,
    }));
  };

  const handleStartOver = () => {
    setRegistrationState({
      step: "basic_info",
      familyData: {
        headOfFamily: "",
        familySize: 1,
        location: "",
        contactNumber: "",
      },
    });
  };

  const handleGoToDashboard = () => {
    router.push("/volunteer/dashboard");
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <UsersIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Family Registration
        </h2>
        <p className="text-gray-600">
          Enter basic family information to begin the registration process
        </p>
      </div>

      <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
        {/* Head of Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Head of Family Name *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              value={registrationState.familyData.headOfFamily}
              onChange={(e) => updateFamilyData("headOfFamily", e.target.value)}
              placeholder="Enter full name"
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Family Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Family Size *
          </label>
          <div className="relative">
            <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="number"
              min="1"
              max="20"
              value={registrationState.familyData.familySize}
              onChange={(e) =>
                updateFamilyData("familySize", parseInt(e.target.value) || 1)
              }
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (State/District) *
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Select
              value={registrationState.familyData.location}
              onValueChange={(value) => updateFamilyData("location", value)}
              placeholder="Select your state"
              className="pl-10"
            >
              {INDIAN_STATES.map((state) => (
                <Select.Item key={state} value={state}>
                  {state}
                </Select.Item>
              ))}
            </Select>
          </div>
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number *
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="tel"
              value={registrationState.familyData.contactNumber}
              onChange={(e) =>
                updateFamilyData("contactNumber", e.target.value)
              }
              placeholder="+91 XXXXXXXXXX"
              className="pl-10"
              required
            />
          </div>
        </div>

        {registrationState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{registrationState.error}</p>
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full">
          Continue to Aadhaar Verification
        </Button>
      </form>
    </div>
  );

  const renderAadhaarVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Aadhaar Verification
        </h2>
        <p className="text-gray-600">
          Verify your identity with Self Protocol for secure, privacy-preserving
          registration
        </p>
        <div className="mt-4 text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
          <p>
            🔒 Your Aadhaar number is never stored - only privacy-preserving
            proofs are generated
          </p>
        </div>
      </div>

      {/* Family Data Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Registering Family:
        </h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Head of Family:</strong>{" "}
            {registrationState.familyData.headOfFamily}
          </p>
          <p>
            <strong>Family Size:</strong>{" "}
            {registrationState.familyData.familySize} members
          </p>
          <p>
            <strong>Location:</strong> {registrationState.familyData.location}
          </p>
        </div>
      </div>

      <AadhaarVerification
        onVerificationComplete={handleAadhaarVerificationComplete}
        onError={handleAadhaarVerificationError}
        familyData={{
          familySize: registrationState.familyData.familySize,
          location: registrationState.familyData.location,
          contactInfo: registrationState.familyData.contactNumber,
        }}
      />

      {registrationState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{registrationState.error}</p>
          <div className="mt-2">
            <Button
              onClick={() =>
                setRegistrationState((prev) => ({ ...prev, error: undefined }))
              }
              variant="tertiary"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Button
          onClick={() =>
            setRegistrationState((prev) => ({
              ...prev,
              step: "basic_info",
              error: undefined,
            }))
          }
          variant="tertiary"
        >
          Back to Basic Info
        </Button>
      </div>
    </div>
  );

  const renderURIDGenerationStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      <h2 className="text-2xl font-bold text-gray-900">Generating Your URID</h2>
      <p className="text-gray-600">
        Please wait while we create your unique family identifier...
      </p>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto" />

      <h2 className="text-2xl font-bold text-gray-900">
        Registration Complete!
      </h2>

      <p className="text-gray-600">
        Your family has been successfully registered with SewaChain
      </p>

      {/* URID Display */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Unique Family ID (URID)
        </h3>

        {registrationState.qrCode && (
          <div className="mb-4">
            <img
              src={registrationState.qrCode}
              alt="URID QR Code"
              className="mx-auto w-48 h-48"
            />
          </div>
        )}

        <p className="text-2xl font-mono font-bold text-blue-600 mb-2">
          {registrationState.urid}
        </p>

        <p className="text-sm text-gray-500">
          Present this QR code or URID when receiving aid
        </p>
      </div>

      {/* Family Information Summary */}
      <div className="bg-gray-50 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-gray-900 mb-2">
          Registration Details
        </h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <strong>Head of Family:</strong>{" "}
            {registrationState.familyData.headOfFamily}
          </p>
          <p>
            <strong>Family Size:</strong>{" "}
            {registrationState.familyData.familySize} members
          </p>
          <p>
            <strong>Location:</strong> {registrationState.familyData.location}
          </p>
          <p>
            <strong>Contact:</strong>{" "}
            {registrationState.familyData.contactNumber}
          </p>
          <p>
            <strong>Verification:</strong> ✓ Aadhaar Verified with Self Protocol
          </p>
          {registrationState.credentialSubject && (
            <>
              <p>
                <strong>Nationality:</strong>{" "}
                {registrationState.credentialSubject.nationality}
              </p>
              <p>
                <strong>Age Verified:</strong>{" "}
                {registrationState.credentialSubject.minimumAge
                  ? "18+"
                  : "Verified"}
              </p>
              <p>
                <strong>Gender:</strong>{" "}
                {registrationState.credentialSubject.gender}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">
          🔒 Privacy Protected
        </h4>
        <div className="text-sm text-green-800 space-y-1">
          <p>✓ Your Aadhaar number was never stored or transmitted</p>
          <p>✓ Only privacy-preserving cryptographic proofs were generated</p>
          <p>✓ Your URID is derived from secure, hashed identifiers</p>
          <p>✓ Self Protocol ensures zero-knowledge verification</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleStartOver}
          variant="secondary"
          className="flex-1"
        >
          Register Another Family
        </Button>
        <Button
          onClick={handleGoToDashboard}
          variant="primary"
          className="flex-1"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );

  return (
    <Page>
      <Page.Main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-blue-600">
                  Step{" "}
                  {registrationState.step === "basic_info"
                    ? "1"
                    : registrationState.step === "aadhaar_verification"
                      ? "2"
                      : registrationState.step === "urid_generation"
                        ? "3"
                        : "4"}{" "}
                  of 4
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {registrationState.step === "basic_info"
                    ? "Basic Information"
                    : registrationState.step === "aadhaar_verification"
                      ? "Aadhaar Verification"
                      : registrationState.step === "urid_generation"
                        ? "URID Generation"
                        : "Complete"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width:
                      registrationState.step === "basic_info"
                        ? "25%"
                        : registrationState.step === "aadhaar_verification"
                          ? "50%"
                          : registrationState.step === "urid_generation"
                            ? "75%"
                            : "100%",
                  }}
                />
              </div>
            </div>

            {/* Step Content */}
            {registrationState.step === "basic_info" && renderBasicInfoStep()}
            {registrationState.step === "aadhaar_verification" &&
              renderAadhaarVerificationStep()}
            {registrationState.step === "urid_generation" &&
              renderURIDGenerationStep()}
            {registrationState.step === "complete" && renderCompleteStep()}
          </div>
        </div>
      </Page.Main>
    </Page>
  );
}
