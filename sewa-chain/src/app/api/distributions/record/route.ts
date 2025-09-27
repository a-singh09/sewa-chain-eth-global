import { NextRequest, NextResponse } from "next/server";
import { distributionRegistry, DistributionRecord } from "@/lib/registry";

interface RecordDistributionRequest {
  familyUuid: string;
  volunteerNullifier: string;
  aidType: number;
  quantity: number;
  location: string;
  transactionHash: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RecordDistributionRequest = await request.json();

    // Validate required fields
    if (
      !body.familyUuid ||
      !body.volunteerNullifier ||
      body.aidType === undefined ||
      !body.quantity ||
      !body.location ||
      !body.transactionHash
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate distribution ID
    const distributionId = `DIST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store distribution record
    const distributionRecord: DistributionRecord = {
      distributionId,
      familyUuid: body.familyUuid,
      volunteerNullifier: body.volunteerNullifier,
      aidType: body.aidType,
      quantity: body.quantity,
      location: body.location,
      transactionHash: body.transactionHash,
      timestamp: Date.now(),
    };

    distributionRegistry.set(distributionId, distributionRecord);

    console.log("Distribution recorded:", distributionId);

    return NextResponse.json({
      success: true,
      distributionId,
      message: "Distribution recorded successfully",
    });
  } catch (error) {
    console.error("Distribution recording error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record distribution" },
      { status: 500 },
    );
  }
}

// Registry is now shared via @/lib/registry
