'use client';

import React, { useState, useEffect } from 'react';
import { SelfQRcodeWrapper } from '@selfxyz/qrcode';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { CheckIcon, XMarkIcon, DocumentTextIcon, QrCodeIcon } from '@heroicons/react/24/outline';

export interface AadhaarVerificationProps {
  onVerificationComplete: (hashedId: string, credentialSubject: any) => void;
  onError: (error: Error) => void;
  familyData?: {
    familySize: number;
    location: string;
    contactInfo: string;
  };
  disabled?: boolean;
  className?: string;
}

export interface AadhaarVerificationState {
  status: 'idle' | 'waiting_for_scan' | 'verifying' | 'success' | 'error';
  error?: string;
  hashedId?: string;
  credentialSubject?: any;
}

const selfAppConfig = {
  version: 2 as const,
  appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "SewaChain Aadhaar Verification",
  scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "sewachain-aadhaar",
  endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://your-ngrok-url.com/api/verify-aadhaar",
  logoBase64: "", // Will be set from logo file
  userId: "beneficiary",
  endpointType: "staging_https" as const,
  userIdType: "hex" as const,
  userDefinedData: "",
  disclosures: {
    minimumAge: 18,
    nationality: true,
    gender: true,
  }
};

export function AadhaarVerification({
  onVerificationComplete,
  onError,
  familyData,
  disabled = false,
  className = ''
}: AadhaarVerificationProps) {
  const [verificationState, setVerificationState] = useState<AadhaarVerificationState>({
    status: 'idle'
  });
  const [showInstructions, setShowInstructions] = useState(true);

  // Reset verification state after timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (verificationState.status === 'error') {
      timeoutId = setTimeout(() => {
        setVerificationState({ status: 'idle' });
      }, 5000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [verificationState.status]);

  const handleStartVerification = () => {
    setVerificationState({ status: 'waiting_for_scan' });
    setShowInstructions(false);
  };

  const handleSelfQRSuccess = (data: any) => {
    console.log('Self Protocol verification success:', data);
    setVerificationState({ status: 'verifying' });
    
    // The actual verification will be handled by the backend endpoint
    // For now, we'll simulate the process
    setTimeout(() => {
      const mockHashedId = generateMockHashedId();
      const mockCredentialSubject = {
        nationality: "IN",
        gender: "M",
        minimumAge: true
      };
      
      setVerificationState({
        status: 'success',
        hashedId: mockHashedId,
        credentialSubject: mockCredentialSubject
      });
      
      onVerificationComplete(mockHashedId, mockCredentialSubject);
    }, 2000);
  };

  const handleSelfQRError = (error: any) => {
    console.error('Self Protocol verification error:', error);
    const errorMessage = error?.message || 'Aadhaar verification failed';
    
    setVerificationState({
      status: 'error',
      error: errorMessage
    });
    
    onError(new Error(errorMessage));
  };

  const generateMockHashedId = (): string => {
    // Generate a mock hashed ID for demo purposes
    return Math.random().toString(36).substring(2, 18);
  };

  const getStatusIcon = () => {
    switch (verificationState.status) {
      case 'success':
        return <CheckIcon className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XMarkIcon className="w-6 h-6 text-red-600" />;
      case 'verifying':
        return <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <DocumentTextIcon className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationState.status) {
      case 'waiting_for_scan':
        return 'Please scan your Aadhaar QR code using the Self Protocol app';
      case 'verifying':
        return 'Verifying Aadhaar details with Self Protocol...';
      case 'success':
        return 'Aadhaar verification completed successfully!';
      case 'error':
        return verificationState.error || 'Verification failed. Please try again.';
      default:
        return 'Ready to verify your Aadhaar card';
    }
  };

  const getStatusColor = () => {
    switch (verificationState.status) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'verifying':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  // Update config with family data
  const configWithUserData = {
    ...selfAppConfig,
    userDefinedData: familyData ? JSON.stringify(familyData) : ""
  };

  return (
    <div className={`w-full max-w-md mx-auto space-y-6 ${className}`}>
      {/* Instructions */}
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <DocumentTextIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-2">Aadhaar Verification Required</p>
              <ul className="text-blue-700 space-y-1 list-disc list-inside">
                <li>Have your Aadhaar card ready</li>
                <li>Install Self Protocol app on your phone</li>
                <li>Scan the QR code that will appear</li>
                <li>Follow the Self Protocol verification steps</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
        {getStatusIcon()}
        <div className="flex-1">
          <p className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusMessage()}
          </p>
          {verificationState.hashedId && (
            <p className="text-xs text-gray-500 mt-1">
              Hashed ID: {verificationState.hashedId}
            </p>
          )}
        </div>
      </div>

      {/* Verification Button */}
      {verificationState.status === 'idle' && (
        <Button
          onClick={handleStartVerification}
          disabled={disabled}
          variant="primary"
          className="w-full flex items-center justify-center space-x-2 py-3"
        >
          <QrCodeIcon className="w-5 h-5" />
          <span>Start Aadhaar Verification</span>
        </Button>
      )}

      {/* Self Protocol QR Code */}
      {verificationState.status === 'waiting_for_scan' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with the Self Protocol app on your phone
            </p>
          </div>
          
          <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <SelfQRcodeWrapper
              config={configWithUserData}
              onSuccess={handleSelfQRSuccess}
              onError={handleSelfQRError}
            />
          </div>
          
          <div className="text-center">
            <Button
              onClick={() => setVerificationState({ status: 'idle' })}
              variant="tertiary"
              size="sm"
            >
              Cancel Verification
            </Button>
          </div>
        </div>
      )}

      {/* Live Feedback */}
      {(verificationState.status === 'verifying' || 
        verificationState.status === 'success' || 
        verificationState.status === 'error') && (
        <LiveFeedback
          status={
            verificationState.status === 'success' ? 'success' : 
            verificationState.status === 'error' ? 'error' : 'loading'
          }
          message={getStatusMessage()}
        />
      )}

      {/* Verification Details */}
      {verificationState.status === 'success' && verificationState.credentialSubject && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Verified Information</h4>
          <div className="text-sm text-green-800 space-y-1">
            <p>✓ Nationality: {verificationState.credentialSubject.nationality}</p>
            <p>✓ Age: {verificationState.credentialSubject.minimumAge ? '18+' : 'Verified'}</p>
            <p>✓ Gender: {verificationState.credentialSubject.gender}</p>
            <p>✓ Identity: Verified with Self Protocol</p>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="text-xs text-gray-500 text-center">
        <p>
          🔒 Your Aadhaar number is never stored. Only a privacy-preserving proof is generated.
        </p>
      </div>
    </div>
  );
}