"use client";

import React, { useState } from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Navbar } from "@/components/Navbar";
import { QRScanner } from "@/components/QRScanner";
import URIDRegistryABI from "@/abi/URIDRegistry.json";
import { MiniKit } from "@worldcoin/minikit-js";
import { AidType } from "@/types";
import {
  checkMiniKitAvailability,
  validateEnvironment,
  generateURIDHash,
} from "@/utils/minikit";

interface DistributionState {
  step:
    | "input"
    | "scanning"
    | "validating"
    | "details"
    | "recording"
    | "complete";
  familyUuid: string;
  uridHash: string;
  familySize: number;
  aidType: AidType;
  quantity: number;
  location: string;
  volunteerNullifier: string;
  error: string;
  distributionId: string;
  isValidating: boolean;
}

const AID_TYPE_OPTIONS = [
  { value: AidType.FOOD, label: "Food" },
  { value: AidType.MEDICAL, label: "Medical Supplies" },
  { value: AidType.SHELTER, label: "Shelter Materials" },
  { value: AidType.CLOTHING, label: "Clothing" },
  { value: AidType.WATER, label: "Water" },
  { value: AidType.CASH, label: "Cash Assistance" },
];

export default function DistributeAidPage() {
  const [state, setState] = useState<DistributionState>({
    step: "input",
    familyUuid: "",
    uridHash: "",
    familySize: 0,
    aidType: AidType.FOOD,
    quantity: 1,
    location: "",
    volunteerNullifier: "0x" + "1".repeat(64), // Demo nullifier
    error: "",
    distributionId: "",
    isValidating: false,
  });

  const handleUuidInput = async (uuid: string) => {
    setState((prev) => ({ ...prev, error: "", isValidating: true }));

    try {
      // Validate family using our API endpoint that checks the smart contract
      const response = await fetch("/api/validate-family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Family not found");
      }

      const familyData = await response.json();

      setState((prev) => ({
        ...prev,
        familyUuid: uuid,
        uridHash: familyData.uridHash,
        familySize: familyData.familySize,
        step: "details",
        isValidating: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Family validation failed. Please check the UUID.",
        isValidating: false,
      }));
    }
  };

  const handleQRCodeScan = async (qrData: string) => {
    setState((prev) => ({ ...prev, error: "", isValidating: true }));

    try {
      const data = JSON.parse(qrData);
      if (data.type !== "sewa_family") {
        throw new Error("Invalid QR code");
      }

      // Validate family using our API endpoint
      const response = await fetch("/api/validate-family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: data.uuid,
          uridHash: data.uridHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Family not found");
      }

      const familyData = await response.json();

      setState((prev) => ({
        ...prev,
        familyUuid: data.uuid,
        uridHash: familyData.uridHash,
        familySize: familyData.familySize,
        step: "details",
        error: "",
        isValidating: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Invalid QR code or family validation failed",
        isValidating: false,
      }));
    }
  };

  const handleDistributionRecord = async () => {
    if (!state.location.trim()) {
      setState((prev) => ({ ...prev, error: "Location is required" }));
      return;
    }

    setState((prev) => ({ ...prev, step: "recording", error: "" }));

    try {
      // Check if World MiniKit is available
      const miniKitCheck = checkMiniKitAvailability();
      if (!miniKitCheck.isAvailable) {
        throw new Error(
          miniKitCheck.error ||
            "World App is required for blockchain transactions",
        );
      }

      // Validate environment configuration
      const envCheck = validateEnvironment();
      if (!envCheck.isValid) {
        throw new Error(`Configuration error: ${envCheck.errors.join(", ")}`);
      }

      // Convert aid type to enum value for contract
      const getAidTypeValue = (aidType: AidType): number => {
        const aidTypeMap = {
          [AidType.FOOD]: 0,
          [AidType.MEDICAL]: 1,
          [AidType.SHELTER]: 2,
          [AidType.CLOTHING]: 3,
          [AidType.WATER]: 4,
          [AidType.CASH]: 5,
        };
        return aidTypeMap[aidType] ?? 0;
      };

      // Record distribution on blockchain using MiniKit sendTransaction
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS!,
            abi: [
              {
                inputs: [
                  {
                    internalType: "bytes32",
                    name: "uridHash",
                    type: "bytes32",
                  },
                  {
                    internalType: "bytes32",
                    name: "volunteerNullifier",
                    type: "bytes32",
                  },
                  { internalType: "uint8", name: "aidType", type: "uint8" },
                  {
                    internalType: "uint256",
                    name: "quantity",
                    type: "uint256",
                  },
                  { internalType: "string", name: "location", type: "string" },
                ],
                name: "recordDistribution",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
              },
            ],
            functionName: "recordDistribution",
            args: [
              state.uridHash,
              state.volunteerNullifier,
              getAidTypeValue(state.aidType),
              state.quantity,
              state.location,
            ],
          },
        ],
      });

      if (finalPayload.status === "error") {
        throw new Error(`Transaction failed: ${finalPayload.error_code}`);
      }

      // Store distribution data in our API
      await fetch("/api/distributions/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyUuid: state.familyUuid,
          volunteerNullifier: state.volunteerNullifier,
          aidType: state.aidType,
          quantity: state.quantity,
          location: state.location,
          transactionHash: finalPayload.transaction_id,
        }),
      });

      setState((prev) => ({
        ...prev,
        step: "complete",
        distributionId: finalPayload.transaction_id,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: "details",
        error:
          error instanceof Error
            ? error.message
            : "Distribution recording failed",
      }));
    }
  };

  const renderInputStep = () => (
    <div className="bg-white rounded-lg shadow-sm card-mobile">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
        Distribute Aid
      </h2>

      {state.error && (
        <div className="alert-mobile alert-mobile-error mb-4">
          <p className="text-red-700">{state.error}</p>
        </div>
      )}

      <div className="form-mobile space-y-4">
        <div className="form-group">
          <label>Family UUID</label>
          <input
            type="text"
            value={state.familyUuid}
            onChange={(e) =>
              setState((prev) => ({ ...prev, familyUuid: e.target.value }))
            }
            placeholder="Enter family UUID"
          />
          <button
            onClick={() => handleUuidInput(state.familyUuid)}
            disabled={!state.familyUuid.trim() || state.isValidating}
            className="btn-mobile btn-mobile-full mt-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {state.isValidating ? "Validating..." : "Continue with UUID"}
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-2">OR</p>
          <button
            onClick={() => setState((prev) => ({ ...prev, step: "scanning" }))}
            className="btn-mobile btn-mobile-full bg-green-600 text-white hover:bg-green-700"
          >
            Scan QR Code
          </button>
        </div>
      </div>
    </div>
  );

  const renderScanningStep = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Scan Family QR Code
      </h2>

      {state.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">{state.error}</p>
        </div>
      )}

      <QRScanner
        onScan={handleQRCodeScan}
        onError={(error) => setState((prev) => ({ ...prev, error }))}
        isActive={true}
      />

      <button
        onClick={() => setState((prev) => ({ ...prev, step: "input" }))}
        className="w-full mt-4 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
      >
        Back to Manual Entry
      </button>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Distribution Details
      </h2>

      {state.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">{state.error}</p>
        </div>
      )}

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Family:</strong> {state.familyUuid}
          <br />
          <strong>Size:</strong> {state.familySize} members
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aid Type
          </label>
          <select
            value={state.aidType}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                aidType: parseInt(e.target.value) as AidType,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {AID_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            value={state.quantity}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                quantity: parseInt(e.target.value) || 1,
              }))
            }
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Distribution Location
          </label>
          <input
            type="text"
            value={state.location}
            onChange={(e) =>
              setState((prev) => ({ ...prev, location: e.target.value }))
            }
            placeholder="Enter distribution location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleDistributionRecord}
          disabled={!state.location.trim()}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          Record Distribution
        </button>
      </div>
    </div>
  );

  const renderRecordingStep = () => (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <h2 className="text-2xl font-bold mb-6">Recording Distribution</h2>
      <p className="text-gray-600">
        Recording distribution on the blockchain...
      </p>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-6 text-green-600">
        Distribution Recorded!
      </h2>

      <div className="mb-6">
        <p className="text-lg font-semibold mb-2">Distribution ID:</p>
        <p className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
          {state.distributionId}
        </p>
      </div>

      <div className="text-sm text-gray-600 mb-6">
        <p>
          <strong>Family:</strong> {state.familyUuid}
        </p>
        <p>
          <strong>Aid Type:</strong>{" "}
          {AID_TYPE_OPTIONS.find((opt) => opt.value === state.aidType)?.label}
        </p>
        <p>
          <strong>Quantity:</strong> {state.quantity}
        </p>
        <p>
          <strong>Location:</strong> {state.location}
        </p>
      </div>

      <button
        onClick={() =>
          setState((prev) => ({
            ...prev,
            step: "input",
            familyUuid: "",
            uridHash: "",
            familySize: 0,
            quantity: 1,
            location: "",
            error: "",
            distributionId: "",
          }))
        }
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Record Another Distribution
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Distribute Aid" showBackButton={true} />
      <div className="max-w-2xl mx-auto mobile-p">
        {state.step === "input" && renderInputStep()}
        {state.step === "scanning" && renderScanningStep()}
        {state.step === "details" && renderDetailsStep()}
        {state.step === "recording" && renderRecordingStep()}
        {state.step === "complete" && renderCompleteStep()}
      </div>
    </div>
  );
}
