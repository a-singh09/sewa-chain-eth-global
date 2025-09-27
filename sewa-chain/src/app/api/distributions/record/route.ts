import { NextRequest, NextResponse } from "next/server";
import { getWorldChainContractService } from "@/services/WorldChainContractService";
import { WorldChainService } from "@/services/WorldChainService";
import { getVolunteerSession } from "@/lib/volunteer-session";
import { AidType } from "@/types";

interface RecordDistributionRequest {
  aadhaarNumber: string;
  aidType: AidType;
  quantity: number;
  location: string;
  notes?: string;
}

/**
 * Record aid distribution on the World Chain blockchain
 * POST /api/distributions/record
 */
export async function POST(request: NextRequest) {
  try {
    const body: RecordDistributionRequest = await request.json();
    const { aadhaarNumber, aidType, quantity, location, notes } = body;

    // Validate input
    if (!aadhaarNumber || !aidType || !quantity || !location) {
      return NextResponse.json(
        {
          error:
            "All fields (aadhaarNumber, aidType, quantity, location) are required",
        },
        { status: 400 },
      );
    }

    if (quantity <= 0 || quantity > 1000) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 1000" },
        { status: 400 },
      );
    }

    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return NextResponse.json(
        { error: "Invalid Aadhaar number format" },
        { status: 400 },
      );
    }

    // Validate aid type
    if (!Object.values(AidType).includes(aidType)) {
      return NextResponse.json({ error: "Invalid aid type" }, { status: 400 });
    }

    // Get volunteer session for authorization
    const volunteerSession = getVolunteerSession();
    if (!volunteerSession) {
      return NextResponse.json(
        { error: "Volunteer authentication required" },
        { status: 401 },
      );
    }

    if (!volunteerSession.nullifierHash) {
      return NextResponse.json(
        { error: "Volunteer nullifier not available" },
        { status: 401 },
      );
    }

    // Get contract service
    const contractService = getWorldChainContractService();

    // Generate hashes
    const uridHash =
      contractService.constructor.generateURIDHash(aadhaarNumber);
    const volunteerNullifier =
      contractService.constructor.generateVolunteerNullifier(
        volunteerSession.nullifierHash,
      );

    // Check if family is registered and active
    const isValidFamily = await contractService.isValidFamily(uridHash);
    if (!isValidFamily) {
      return NextResponse.json(
        {
          error: "Family not found or inactive",
          uridHash,
          suggestion: "Please register the family first",
        },
        { status: 404 },
      );
    }

    // Check eligibility for this aid type
    const eligibility = await contractService.checkEligibility(
      uridHash,
      aidType,
    );
    if (!eligibility.eligible) {
      const hoursRemaining = Math.ceil(eligibility.timeUntilEligible / 3600);
      return NextResponse.json(
        {
          error: `Family not eligible for ${aidType}`,
          timeUntilEligible: eligibility.timeUntilEligible,
          hoursRemaining,
          suggestion: `Please wait ${hoursRemaining} hours before distributing ${aidType} aid`,
        },
        { status: 409 },
      );
    }

    // For API route, we return the preparation data
    // The actual blockchain transaction will be handled by the frontend using MiniKit
    return NextResponse.json({
      success: true,
      message: "Distribution recording prepared",
      data: {
        uridHash,
        volunteerNullifier,
        aidType,
        quantity,
        location,
        notes,
        contractAddress: process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS,
        eligibility,
        preparationTime: new Date().toISOString(),
        volunteerInfo: {
          id: volunteerSession.volunteerId,
          walletAddress: volunteerSession.walletAddress,
        },
      },
    });
  } catch (error: any) {
    console.error("Error in distribution recording API:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * Get distribution eligibility
 * GET /api/distributions/record?aadhaar=123456789012&aidType=FOOD
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aadhaarNumber = searchParams.get("aadhaar");
    const aidType = searchParams.get("aidType") as AidType;

    if (!aadhaarNumber || !aidType) {
      return NextResponse.json(
        { error: "Aadhaar number and aid type are required" },
        { status: 400 },
      );
    }

    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return NextResponse.json(
        { error: "Invalid Aadhaar number format" },
        { status: 400 },
      );
    }

    // Validate aid type
    if (!Object.values(AidType).includes(aidType)) {
      return NextResponse.json({ error: "Invalid aid type" }, { status: 400 });
    }

    const contractService = getWorldChainContractService();
    const uridHash =
      contractService.constructor.generateURIDHash(aadhaarNumber);

    // Check family validity and eligibility
    const [isValidFamily, eligibility, distributionHistory] = await Promise.all(
      [
        contractService.isValidFamily(uridHash),
        contractService.checkEligibility(uridHash, aidType),
        contractService.getDistributionHistory(uridHash).catch(() => []),
      ],
    );

    return NextResponse.json({
      success: true,
      data: {
        uridHash,
        isValidFamily,
        eligibility,
        distributionHistory,
        aidType,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error checking distribution eligibility:", error);

    return NextResponse.json(
      {
        error: "Failed to check eligibility",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
