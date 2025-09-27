"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVolunteerSession } from "@/hooks/useVolunteerSession";
import { Page } from "@/components/PageLayout";
import { AadhaarVerification } from "@/components/AadhaarVerification";
import { Button, Input, Select } from "@worldcoin/mini-apps-ui-kit-react";
import {
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
  CheckCircleIcon,
  QrCodeIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface FamilyRegistrationData {
  headOfFamily: string;
  familySize: number;
  location: string;
  contactNumber: string;
}

interface RegistrationState {
  step: "basic_info" | "aadhaar_verification" | "urid_generation" | "complete";
  familyData: FamilyRegistrationData;
  hashedAadhaar?: string;
  credentialSubject?: any;
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

export default function RegisterBeneficiaryPage() {
  const router = useRouter();
  const {
    session,
    isAuthenticated,
    isLoading: sessionLoading,
  } = useVolunteerSession();
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

  // Handle authentication redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push("/volunteer/verify");
    }
  }, [sessionLoading, isAuthenticated, router]);

  // Check authentication
  if (sessionLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading session...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (!isAuthenticated) {
    // Show loading while redirecting
    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to verification...</p>
          </div>
        </div>
      </Page>
    );
  }

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
    credentialSubject: any,
  ) => {
    setRegistrationState((prev) => ({
      ...prev,
      hashedAadhaar: hashedId,
      credentialSubject,
      step: "urid_generation",
      isLoading: true,
    }));

    try {
      // Generate URID
      const response = await fetch("/api/generate-urid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hashedAadhaar: hashedId,
          location: registrationState.familyData.location,
          familySize: registrationState.familyData.familySize,
          contactInfo: registrationState.familyData.contactNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
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
      setRegistrationState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to generate URID",
        isLoading: false,
      }));
    }
  };

  const handleAadhaarVerificationError = (error: Error) => {
    setRegistrationState((prev) => ({
      ...prev,
      error: error.message,
      isLoading: false,
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
          Register New Beneficiary
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
          Verify family identity with Self Protocol for secure registration
        </p>
      </div>

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
        <Button
          onClick={() =>
            setRegistrationState((prev) => ({ ...prev, step: "basic_info" }))
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
      <h2 className="text-2xl font-bold text-gray-900">Generating URID</h2>
      <p className="text-gray-600">
        Creating unique identifier for this family...
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
        Family has been successfully registered with SewaChain
      </p>

      {/* URID Display */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Unique Family ID (URID)
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
          Share this QR code or URID for aid distribution
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
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <UserIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Register Beneficiary
            </h1>
          </div>
          <Button
            onClick={() => router.push("/volunteer/dashboard")}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
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
    </Page>
  );
}
