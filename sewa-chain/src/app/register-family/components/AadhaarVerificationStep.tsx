"use client";

import React from "react";
import {
  AadhaarVerification,
  FamilyRegistrationData,
} from "@/components/AadhaarVerification";

export interface AadhaarVerificationStepProps {
  familyData: FamilyRegistrationData;
  onVerificationComplete: (
    hashedIdentifier: string,
    credentialSubject: any,
  ) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

/**
 * Aadhaar Verification Step Component
 *
 * This component integrates the AadhaarVerification component into the
 * family registration flow with proper error handling and navigation.
 */
export function AadhaarVerificationStep({
  familyData,
  onVerificationComplete,
  onError,
  onBack,
}: AadhaarVerificationStepProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Step Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Family Details
          </button>
          <div className="text-sm text-gray-500">Step 2 of 3</div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Identity
        </h1>
        <p className="text-gray-600">
          Complete Aadhaar verification using the Self app to ensure secure and
          private identity verification.
        </p>
      </div>

      {/* Family Data Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-2">
          Family Registration Details
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Head of Family:</span>
            <div className="font-medium">{familyData.headOfFamily}</div>
          </div>
          <div>
            <span className="text-gray-500">Family Size:</span>
            <div className="font-medium">{familyData.familySize} members</div>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>
            <div className="font-medium">{familyData.location}</div>
          </div>
          <div>
            <span className="text-gray-500">Contact:</span>
            <div className="font-medium">{familyData.contactNumber}</div>
          </div>
        </div>
      </div>

      {/* Aadhaar Verification Component */}
      <AadhaarVerification
        familyData={familyData}
        onVerified={onVerificationComplete}
        onError={onError}
      />

      {/* Help Section */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Make sure you have the Self app installed on your phone</p>
          <p>• Ensure your phone's camera can scan QR codes</p>
          <p>• Keep your Aadhaar card ready for verification</p>
          <p>
            • The verification process is completely private - no personal data
            is stored
          </p>
        </div>
      </div>
    </div>
  );
}
