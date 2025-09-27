import { NextRequest, NextResponse } from "next/server";

// Mock transaction status for demo purposes
// In production, this would query the actual blockchain
const mockTransactions = new Map<
  string,
  {
    status: "pending" | "success" | "failed";
    receipt?: any;
    confirmations?: number;
    error?: string;
  }
>();

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionHash: string } },
) {
  try {
    const { transactionHash } = params;

    if (!transactionHash) {
      return NextResponse.json(
        { error: "Transaction hash is required" },
        { status: 400 },
      );
    }

    // Check if we have a mock transaction
    let transaction = mockTransactions.get(transactionHash);

    if (!transaction) {
      // Create a new mock transaction that will "confirm" after some time
      const createdAt = Date.now();

      // Simulate transaction confirmation after 10-30 seconds
      const confirmationTime = createdAt + (10000 + Math.random() * 20000);

      transaction = {
        status: Date.now() > confirmationTime ? "success" : "pending",
        confirmations: Date.now() > confirmationTime ? 1 : 0,
      };

      if (transaction.status === "success") {
        transaction.receipt = {
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
          gasUsed: Math.floor(Math.random() * 100000) + 21000,
          transactionHash,
          status: 1,
        };
      }

      mockTransactions.set(transactionHash, transaction);
    } else if (transaction.status === "pending") {
      // Check if enough time has passed for confirmation
      const shouldConfirm = Math.random() > 0.7; // 30% chance to confirm each check

      if (shouldConfirm) {
        transaction.status = "success";
        transaction.confirmations = 1;
        transaction.receipt = {
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
          gasUsed: Math.floor(Math.random() * 100000) + 21000,
          transactionHash,
          status: 1,
        };

        mockTransactions.set(transactionHash, transaction);
      }
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      receipt: transaction.receipt,
      confirmations: transaction.confirmations || 0,
      error: transaction.error,
    });
  } catch (error) {
    console.error("Transaction status check error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check transaction status",
      },
      { status: 500 },
    );
  }
}
