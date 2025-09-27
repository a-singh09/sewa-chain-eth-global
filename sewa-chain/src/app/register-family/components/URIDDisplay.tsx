"use client";

import React, { useState } from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  CheckCircleIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { URIDDisplayProps } from "@/types";

export function URIDDisplay({
  urid,
  qrCode,
  familyData,
  onComplete,
}: URIDDisplayProps) {
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
      console.error("Failed to copy URID:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = urid;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
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
      const link = document.createElement("a");
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
      console.error("Failed to download QR code:", error);
    } finally {
      setDownloading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, "");
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
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCodeIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Your Unique Family ID (URID)
          </h3>
          <p className="text-sm text-gray-600">
            Present this QR code or URID when receiving aid
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm">
            <img
              src={qrCode}
              alt={`URID QR Code for family ID ${urid}`}
              className="w-48 h-48 sm:w-56 sm:h-56 mx-auto"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        </div>

        {/* URID Text */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-700 mb-2 uppercase tracking-wide">
                FAMILY ID
              </p>
              <p className="text-lg sm:text-xl font-mono font-bold text-blue-900 break-all leading-tight">
                {urid}
              </p>
            </div>
            <Button
              onClick={handleCopyURID}
              variant="tertiary"
              className="ml-3 p-3 min-h-[48px] min-w-[48px] flex-shrink-0"
              aria-label={
                copied ? "URID copied to clipboard" : "Copy URID to clipboard"
              }
            >
              {copied ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              ) : (
                <DocumentDuplicateIcon className="w-5 h-5 text-blue-600" />
              )}
            </Button>
          </div>
          {copied && (
            <div className="mt-3 flex items-center text-green-700">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              <p className="text-sm font-medium">Copied to clipboard!</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleDownloadQR}
            variant="secondary"
            className="min-h-[52px] touch-manipulation text-base font-medium"
            disabled={downloading}
            aria-label="Download QR code as image"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            {downloading ? "Downloading..." : "Download QR Code"}
          </Button>
          <Button
            onClick={handleCopyURID}
            variant="tertiary"
            className="min-h-[52px] touch-manipulation text-base font-medium"
            disabled={copied}
          >
            <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
            {copied ? "Copied!" : "Copy URID"}
          </Button>
        </div>
      </div>

      {/* Registration Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <h4 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
          <ClipboardDocumentIcon className="w-6 h-6 mr-2" />
          Registration Summary
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <span className="block text-blue-700 font-medium mb-1">
                Head of Family:
              </span>
              <span className="text-blue-900 font-semibold">
                {familyData.headOfFamily}
              </span>
            </div>
            <div>
              <span className="block text-blue-700 font-medium mb-1">
                Family Size:
              </span>
              <span className="text-blue-900 font-semibold">
                {familyData.familySize} members
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="block text-blue-700 font-medium mb-1">
                Location:
              </span>
              <span className="text-blue-900 font-semibold">
                {familyData.location}
              </span>
            </div>
            <div>
              <span className="block text-blue-700 font-medium mb-1">
                Contact:
              </span>
              <span className="text-blue-900 font-semibold">
                {formatPhoneNumber(familyData.contactNumber)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-blue-700 font-medium">
              Verification Status:
            </span>
            <span className="text-green-700 font-bold flex items-center bg-green-100 px-3 py-1 rounded-full">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Aadhaar Verified
            </span>
          </div>
        </div>
      </div>

      {/* Important Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">
          Important Instructions
        </h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            Save or screenshot this QR code for future aid distribution
          </li>
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            Present either the QR code or URID to volunteers during aid
            distribution
          </li>
          <li className="flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            Keep your URID confidential and do not share with unauthorized
            persons
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
        className="w-full min-h-[52px] touch-manipulation text-base font-semibold"
      >
        Complete Registration
      </Button>

      {/* Footer Note */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 font-medium">
          🎉 Your registration is now active on the SewaChain network
        </p>
        <p className="text-xs text-gray-500">
          Registration ID: {urid} • Verified with Self Protocol • Secured by
          World Chain
        </p>
      </div>
    </div>
  );
}
