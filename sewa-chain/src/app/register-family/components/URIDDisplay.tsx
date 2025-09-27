'use client';

import React, { useState } from 'react';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { 
  CheckCircleIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { URIDDisplayProps } from '@/types';

export function URIDDisplay({ urid, qrCode, familyData, onComplete }: URIDDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyURID = async () => {
    try {
      await navigator.clipboard.writeText(urid);
      setCopied(true);
      
      // Provide haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = urid;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = async () => {
    setDownloading(true);
    
    try {
      // Convert base64 to blob
      const response = await fetch(qrCode);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `URID-${urid}-QRCode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (error) {
      console.error('Failed to download QR code:', error);
    } finally {
      setDownloading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Registration Complete!
        </h2>
        <p className="text-gray-600">
          Your family has been successfully registered with SewaChain
        </p>
      </div>

      {/* URID Display Card */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="text-center mb-4">
          <QrCodeIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Your Unique Family ID (URID)
          </h3>
          <p className="text-sm text-gray-500">
            Present this QR code or URID when receiving aid
          </p>
        </div>
        
        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-100">
            <img 
              src={qrCode} 
              alt="URID QR Code"
              className="w-48 h-48 mx-auto"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
        
        {/* URID Text */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">FAMILY ID</p>
              <p className="text-xl font-mono font-bold text-blue-600 break-all">
                {urid}
              </p>
            </div>
            <Button
              onClick={handleCopyURID}
              variant="tertiary"
              className="ml-2 p-2 min-h-[44px]"
              aria-label="Copy URID"
            >
              {copied ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              ) : (
                <DocumentDuplicateIcon className="w-5 h-5" />
              )}
            </Button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownloadQR}
            variant="secondary"
            className="flex-1 min-h-[44px] touch-manipulation"
            disabled={downloading}
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download QR Code'}
          </Button>
        </div>
      </div>

      {/* Registration Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
          Registration Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">Head of Family:</span>
            <span className="text-blue-900 font-medium">{familyData.headOfFamily}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Family Size:</span>
            <span className="text-blue-900 font-medium">{familyData.familySize} members</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Location:</span>
            <span className="text-blue-900 font-medium">{familyData.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Contact:</span>
            <span className="text-blue-900 font-medium">{formatPhoneNumber(familyData.contactNumber)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-blue-200">
            <span className="text-blue-700">Verification Status:</span>
            <span className="text-green-700 font-medium flex items-center">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Aadhaar Verified
            </span>
          </div>
        </div>
      </div>

      {/* Important Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">Important Instructions</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            Save or screenshot this QR code for future aid distribution
          </li>
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            Present either the QR code or URID to volunteers during aid distribution
          </li>
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            Keep your URID confidential and do not share with unauthorized persons
          </li>
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            Contact local authorities if you lose access to your URID
          </li>
        </ul>
      </div>

      {/* Completion Button */}
      <Button 
        onClick={onComplete}
        variant="primary" 
        className="w-full min-h-[44px] touch-manipulation"
      >
        Complete Registration
      </Button>

      {/* Footer Note */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Your registration is now active on the SewaChain network
        </p>
      </div>
    </div>
  );
}