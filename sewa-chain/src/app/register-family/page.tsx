"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@worldcoin/mini-apps-ui-kit-react";
import { Page } from "@/components/PageLayout";
import { Navbar } from "@/components/Navbar";
import { AadhaarVerification } from "@/components/AadhaarVerification";

import { MiniKit } from "@worldcoin/minikit-js";
import QRCode from "qrcode";
import {
  checkMiniKitAvailability,
  validateEnvironment,
  generateURIDHash,
} from "@/utils/minikit";
import { UsersIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

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
  step:
    | "basic_info"
    | "aadhaar_verification"
    | "blockchain_registration"
    | "complete";
  familyData: FamilyRegistrationData;
  hashedAadhaar?: string;
  credentialSubject?: CredentialSubject;
  urid?: string;
  qrCode?: string;
  error?: string;
  isLoading?: boolean;
  transactionHash?: string;
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
      step: "blockchain_registration",
      isLoading: true,
      error: undefined,
    }));

    try {
      // Check if World MiniKit is available
      const miniKitCheck = checkMiniKitAvailability();
      if (!miniKitCheck.isAvailable) {
        throw new Error(
          miniKitCheck.error ||
            "World App is required for blockchain registration",
        );
      }

      // Validate environment configuration
      const envCheck = validateEnvironment();
      if (!envCheck.isValid) {
        throw new Error(`Configuration error: ${envCheck.errors.join(", ")}`);
      }

      // Generate URID hash from the Self Protocol hashed identifier
      const uridHash = generateURIDHash(hashedId);

      // Register family on blockchain using MiniKit sendTransaction
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: process.env.NEXT_PUBLIC_URID_REGISTRY_ADDRESS!,
            abi: [
              {
                inputs: [
                  {
                    internalType: "bytes32",
                    name: "_uridHash",
                    type: "bytes32",
                  },
                  {
                    internalType: "uint256",
                    name: "_familySize",
                    type: "uint256",
                  },
                ],
                name: "registerFamily",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
              },
            ],
            functionName: "registerFamily",
            args: [uridHash, registrationState.familyData.familySize],
          },
        ],
      });

      if (finalPayload.status === "error") {
        throw new Error(`Transaction failed: ${finalPayload.error_code}`);
      }

      // Generate UUID and QR code
      const uuid = `SEWA_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 11)}`;
      const qrData = JSON.stringify({
        type: "sewa_family",
        uuid: uuid,
        uridHash: uridHash,
        familySize: registrationState.familyData.familySize,
        registrationTime: Date.now(),
      });

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);

      // Store registration data in our API
      await fetch("/api/families/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: uuid,
          aadhaarHash: hashedId,
          uridHash: uridHash,
          familySize: registrationState.familyData.familySize,
          location: registrationState.familyData.location,
          transactionHash: finalPayload.transaction_id,
        }),
      });

      setRegistrationState((prev) => ({
        ...prev,
        urid: uuid,
        qrCode: qrCodeDataUrl,
        transactionHash: finalPayload.transaction_id,
        step: "complete",
        isLoading: false,
      }));
    } catch (error) {
      console.error("Blockchain registration error:", error);
      setRegistrationState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to register family on blockchain",
        isLoading: false,
        step: "aadhaar_verification",
      }));
    }
  };

  const handleAadhaarVerificationError = (error: string) => {
    console.error("Aadhaar verification error:", error);
    setRegistrationState((prev) => ({
      ...prev,
      error: error,
      isLoading: false,
      step: "aadhaar_verification",
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
      <div className="text-center mb-6 sm:mb-8">
        <UsersIcon className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Family Registration
        </h2>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Enter basic family information to begin the registration process
        </p>
      </div>

      <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Head of Family Name *
          </label>
          <div className="relative">
            {/* <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" /> */}
            <Input
              type="text"
              value={registrationState.familyData.headOfFamily}
              onChange={(e) => updateFamilyData("headOfFamily", e.target.value)}
              className="pl-10 min-h-[48px] text-base touch-manipulation"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Family Size *
          </label>
          <div className="relative">
            {/* <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" /> */}
            <Input
              type="number"
              min="1"
              max="20"
              value={registrationState.familyData.familySize}
              onChange={(e) =>
                updateFamilyData("familySize", parseInt(e.target.value) || 1)
              }
              className="pl-10 min-h-[48px] text-base touch-manipulation"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (State/District) *
          </label>
          <div className="relative">
            {/* <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" /> */}
            <select
              value={registrationState.familyData.location}
              onChange={(e) => updateFamilyData("location", e.target.value)}
              className="w-full pl-10 pr-10 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer min-h-[48px] touch-manipulation"
              required
            >
              <option value="" disabled>
                Select your state
              </option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Number *
          </label>
          <div className="relative">
            {/* <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" /> */}
            <Input
              type="tel"
              value={registrationState.familyData.contactNumber}
              onChange={(e) =>
                updateFamilyData("contactNumber", e.target.value)
              }
              className="pl-10 min-h-[48px] text-base touch-manipulation"
              required
            />
          </div>
        </div>

        {registrationState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-sm text-red-700">{registrationState.error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full min-h-[52px] text-base font-medium touch-manipulation"
        >
          Continue to Aadhaar Verification
        </Button>
      </form>
    </div>
  );

  const renderAadhaarVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Aadhaar Verification
        </h2>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Verify your identity with Self Protocol for secure, privacy-preserving
          registration
        </p>
      </div>

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
        onVerified={handleAadhaarVerificationComplete}
        onError={handleAadhaarVerificationError}
        familyData={registrationState.familyData}
      />

      {registrationState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-sm text-red-700">{registrationState.error}</p>
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
          className="min-h-[48px] text-base touch-manipulation"
        >
          Back to Basic Info
        </Button>
      </div>
    </div>
  );

  const renderBlockchainRegistrationStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      <h2 className="text-2xl font-bold text-gray-900">
        Registering on Blockchain
      </h2>
      <p className="text-gray-600">
        Please wait while we register your family on the World Chain
        blockchain...
      </p>
      <div className="text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
        <p>
          🔗 This will create a permanent, tamper-proof record of your family
          registration
        </p>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto" />
      <h2 className="text-2xl font-bold text-gray-900">
        Registration Complete!
      </h2>
      <p className="text-gray-600">
        Your family has been successfully registered on SewaChain
      </p>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Family QR Code & UUID
        </h3>

        {registrationState.qrCode && (
          <div className="mb-4">
            <img
              src={registrationState.qrCode}
              alt="Family QR Code"
              className="mx-auto w-40 h-40 sm:w-48 sm:h-48"
            />
          </div>
        )}

        <p className="text-xl sm:text-2xl font-mono font-bold text-blue-600 mb-2 break-all">
          {registrationState.urid}
        </p>
        <p className="text-sm text-gray-500">
          Present this QR code or UUID when receiving aid
        </p>
      </div>

      {registrationState.transactionHash && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">
            🔗 Blockchain Transaction
          </h4>
          <p className="text-sm text-green-800 font-mono break-all">
            {registrationState.transactionHash}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleStartOver}
          variant="secondary"
          className="flex-1 min-h-[48px] text-base touch-manipulation"
        >
          Register Another Family
        </Button>
        <Button
          onClick={handleGoToDashboard}
          variant="primary"
          className="flex-1 min-h-[48px] text-base touch-manipulation"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );

  return (
    <Page>
      <Page.Header className="p-0">
        <Navbar title="Family Registration" showBackButton={true} />
      </Page.Header>
      <Page.Main className="min-h-screen bg-gray-50 py-4 sm:py-8 mobile-p">
        <div className="container mx-auto">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg card-mobile">
            {/* Progress Indicator */}
            <div className="progress-mobile">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-medium text-blue-600">
                  Step{" "}
                  {registrationState.step === "basic_info"
                    ? "1"
                    : registrationState.step === "aadhaar_verification"
                      ? "2"
                      : registrationState.step === "blockchain_registration"
                        ? "3"
                        : "4"}{" "}
                  of 4
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-500 text-right">
                  {registrationState.step === "basic_info"
                    ? "Basic Info"
                    : registrationState.step === "aadhaar_verification"
                      ? "Verification"
                      : registrationState.step === "blockchain_registration"
                        ? "Blockchain"
                        : "Complete"}
                </span>
              </div>
              <div className="progress-mobile-bar">
                <div
                  className="progress-mobile-fill"
                  style={{
                    width:
                      registrationState.step === "basic_info"
                        ? "25%"
                        : registrationState.step === "aadhaar_verification"
                          ? "50%"
                          : registrationState.step === "blockchain_registration"
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
            {registrationState.step === "blockchain_registration" &&
              renderBlockchainRegistrationStep()}
            {registrationState.step === "complete" && renderCompleteStep()}
          </div>
        </div>
      </Page.Main>
    </Page>
  );
}
