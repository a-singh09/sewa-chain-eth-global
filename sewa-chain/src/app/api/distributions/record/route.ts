import { NextRequest, NextResponse } from "next/server";
import {
  DistributionRequest,
  DistributionResponse,
  Distribution,
  AidType,
  VolunteerSession,
  EligibilityResult,
  COOLDOWN_PERIODS,
} from "@/types";
import { URIDService } from "@/lib/urid-service";
import { volunteerSessionStore } from "@/lib/volunteer-session-store";

// In-memory storage for demo purposes
const distributionRegistry = new Map<string, Distribution[]>(); // uridHash -> distributions
const volunteerDistributions = new Map<string, Distribution[]>(); // volunteerNullifier -> distributions

export async function POST(request: NextRequest) {
  try {
    const body: DistributionRequest = await request.json();
    const { urid, aidType, quantity, location, volunteerSession } = body;

    // Validate request data
    if (!urid || !aidType || !quantity || !location || !volunteerSession) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message: "Missing required fields",
          },
        },
        { status: 400 },
      );
    }

    // Validate URID format
    if (!URIDService.validateURID(urid)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_URID",
            message: "Invalid URID format",
          },
        },
        { status: 400 },
      );
    }

    // Validate aid type
    if (!Object.values(AidType).includes(aidType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_AID_TYPE",
            message: "Invalid aid type",
          },
        },
        { status: 400 },
      );
    }

    // Validate quantity
    if (quantity <= 0 || quantity > 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_QUANTITY",
            message: "Quantity must be between 1 and 50",
          },
        },
        { status: 400 },
      );
    }

    // Verify volunteer session token
    if (!volunteerSessionStore.isValidSession(volunteerSession)) {
      console.error("Invalid or expired session:", volunteerSession);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SESSION",
            message: "Invalid volunteer session",
          },
        },
        { status: 401 },
      );
    }

    const decodedSession = volunteerSessionStore.getSession(volunteerSession)!;

    // Check if family exists (URID validation)
    const familyExists = await URIDService.checkURIDExists(urid);
    if (!familyExists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FAMILY_NOT_FOUND",
            message: "Family not found. Please verify the QR code is correct.",
          },
        },
        { status: 404 },
      );
    }

    // Generate URID hash for storage
    const uridHash = URIDService.hashURID(urid);

    // Check family eligibility for this aid type
    const eligibility = await checkFamilyEligibility(uridHash, aidType);
    if (!eligibility.eligible) {
      const timeRemaining = Math.ceil(
        eligibility.timeUntilEligible / (1000 * 60 * 60),
      ); // hours
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_ELIGIBLE",
            message: `Family is not eligible for ${aidType}. Please wait ${timeRemaining} hours.`,
          },
        },
        { status: 400 },
      );
    }

    // Create distribution record
    const distributionId = generateDistributionId();
    const distribution: Distribution = {
      id: distributionId,
      uridHash,
      volunteerNullifier: decodedSession.nullifierHash,
      aidType,
      quantity,
      location: location.trim(),
      timestamp: Date.now(),
      confirmed: true, // For demo purposes, mark as confirmed immediately
    };

    // Store distribution record
    const familyDistributions = distributionRegistry.get(uridHash) || [];
    familyDistributions.push(distribution);
    distributionRegistry.set(uridHash, familyDistributions);

    // Store volunteer distribution record
    const volunteerDists =
      volunteerDistributions.get(decodedSession.nullifierHash) || [];
    volunteerDists.push(distribution);
    volunteerDistributions.set(decodedSession.nullifierHash, volunteerDists);

    console.log("Distribution recorded:", {
      distributionId,
      uridHash: uridHash.substring(0, 8) + "...",
      volunteerNullifier: decodedSession.nullifierHash.substring(0, 8) + "...",
      aidType,
      quantity,
      location,
      timestamp: new Date(distribution.timestamp).toISOString(),
    });

    // Return success response
    const response: DistributionResponse = {
      success: true,
      distributionId,
      // For demo purposes, we'll simulate a transaction hash
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Distribution recording error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to record distribution. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}

// Check family eligibility for aid type based on cooldown periods
async function checkFamilyEligibility(
  uridHash: string,
  aidType: AidType,
): Promise<EligibilityResult> {
  const familyDistributions = distributionRegistry.get(uridHash) || [];

  // Find the most recent distribution of this aid type
  const recentDistributions = familyDistributions
    .filter((dist) => dist.aidType === aidType && dist.confirmed)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (recentDistributions.length === 0) {
    // No previous distributions of this type, family is eligible
    return {
      eligible: true,
      timeUntilEligible: 0,
    };
  }

  const lastDistribution = recentDistributions[0];
  const cooldownPeriod = COOLDOWN_PERIODS[aidType];
  const timeSinceLastDistribution = Date.now() - lastDistribution.timestamp;

  if (timeSinceLastDistribution >= cooldownPeriod) {
    // Cooldown period has passed, family is eligible
    return {
      eligible: true,
      timeUntilEligible: 0,
      lastDistribution: {
        timestamp: lastDistribution.timestamp,
        quantity: lastDistribution.quantity,
        location: lastDistribution.location,
      },
    };
  } else {
    // Still in cooldown period
    const timeUntilEligible = cooldownPeriod - timeSinceLastDistribution;
    return {
      eligible: false,
      timeUntilEligible,
      lastDistribution: {
        timestamp: lastDistribution.timestamp,
        quantity: lastDistribution.quantity,
        location: lastDistribution.location,
      },
    };
  }
}

// Generate unique distribution ID
function generateDistributionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `dist_${timestamp}_${random}`;
}

// GET endpoint to retrieve distribution history for a family
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urid = searchParams.get("urid");
    const volunteerSession = searchParams.get("volunteerSession");

    if (!urid || !volunteerSession) {
      return NextResponse.json(
        { error: "Missing urid or volunteerSession parameter" },
        { status: 400 },
      );
    }

    // Verify volunteer session token
    if (!volunteerSessionStore.isValidSession(volunteerSession)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Validate URID format
    if (!URIDService.validateURID(urid)) {
      return NextResponse.json(
        { error: "Invalid URID format" },
        { status: 400 },
      );
    }

    const uridHash = URIDService.hashURID(urid);
    const distributions = distributionRegistry.get(uridHash) || [];

    // Sort by timestamp (most recent first)
    const sortedDistributions = distributions
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((dist) => ({
        ...dist,
        // Mask volunteer nullifier for privacy
        volunteerNullifier: dist.volunteerNullifier.substring(0, 8) + "...",
      }));

    return NextResponse.json({
      success: true,
      distributions: sortedDistributions,
      totalCount: sortedDistributions.length,
    });
  } catch (error) {
    console.error("Distribution history retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve distribution history" },
      { status: 500 },
    );
  }
}

// Export functions for testing and other modules
export { checkFamilyEligibility, distributionRegistry, volunteerDistributions };
