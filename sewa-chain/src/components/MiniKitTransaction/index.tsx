"use client";

import React, { useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DistributionParams, AidType } from "@/types";

interface MiniKitTransactionProps {
  distribution: DistributionParams;
  volunteerNullifier: string;
  onSuccess: (transactionHash: string) => void;
  onError: (error: string) => void;
}

export function MiniKitTransaction({
  distribution,
  volunteerNullifier,
  onSuccess,
  onError,
}: MiniKitTransactionProps) {
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [transactionHash, setTransactionHash] = useState<string>("");

  const handleBlockchainTransaction = async () => {
    try {
      setStatus("processing");

      // Check MiniKit availability
      if (!MiniKit.isInstalled()) {
        throw new Error("World App is required for blockchain transactions");
      }

      // Get contract addresses and ABI
      const contractAddress =
        process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS;
      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      // Prepare transaction parameters
      const transactionParams = {
        transaction: [
          {
            address: contractAddress,
            abi: [
              {
                inputs: [
                  {
                    internalType: "bytes32",
                    name: "_uridHash",
                    type: "bytes32",
                  },
                  {
                    internalType: "bytes32",
                    name: "_volunteerNullifier",
                    type: "bytes32",
                  },
                  { internalType: "uint8", name: "_aidType", type: "uint8" },
                  {
                    internalType: "uint256",
                    name: "_quantity",
                    type: "uint256",
                  },
                  { internalType: "string", name: "_location", type: "string" },
                ],
                name: "recordDistribution",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
              },
            ],
            functionName: "recordDistribution",
            args: [
              distribution.uridHash,
              volunteerNullifier,
              getAidTypeValue(distribution.aidType),
              distribution.quantity,
              distribution.location,
            ],
          },
        ],
      };

      // Execute transaction via MiniKit
      const { finalPayload } =
        await MiniKit.commandsAsync.sendTransaction(transactionParams);

      if (finalPayload.status !== "success") {
        throw new Error("Transaction was cancelled or failed");
      }

      const txHash = finalPayload.transaction_hash;
      setTransactionHash(txHash);
      setStatus("success");
      onSuccess(txHash);
    } catch (error) {
      console.error("Blockchain transaction error:", error);
      setStatus("error");
      onError(error instanceof Error ? error.message : "Transaction failed");
    }
  };

  const getAidTypeValue = (aidType: AidType): number => {
    const aidTypeMap: Record<AidType, number> = {
      [AidType.FOOD]: 0,
      [AidType.MEDICAL]: 1,
      [AidType.SHELTER]: 2,
      [AidType.CLOTHING]: 3,
      [AidType.WATER]: 4,
      [AidType.CASH]: 5,
    };
    return aidTypeMap[aidType] ?? 0;
  };

  const getButtonText = () => {
    switch (status) {
      case "processing":
        return "Recording on Blockchain...";
      case "success":
        return "Distribution Recorded!";
      case "error":
        return "Transaction Failed";
      default:
        return "Record Distribution";
    }
  };

  const getButtonVariant = () => {
    switch (status) {
      case "success":
        return "success" as const;
      case "error":
        return "error" as const;
      default:
        return "primary" as const;
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleBlockchainTransaction}
        disabled={status === "processing" || status === "success"}
        loading={status === "processing" ? "true" : "false"}
        variant={getButtonVariant()}
        className="w-full flex items-center justify-center space-x-2"
      >
        {status === "success" && <CheckIcon className="w-5 h-5" />}
        {status === "error" && <XMarkIcon className="w-5 h-5" />}
        <span>{getButtonText()}</span>
      </Button>

      {status === "success" && transactionHash && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800 font-medium mb-1">
            Distribution successfully recorded on blockchain
          </p>
          <p className="text-xs text-green-700 break-all">
            Transaction: {transactionHash}
          </p>
        </div>
      )}
    </div>
  );
}
