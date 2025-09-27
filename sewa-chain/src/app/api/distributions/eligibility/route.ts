import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  AidType,
  VolunteerSession,
  EligibilityResult,
  COOLDOWN_PERIODS,
} from "@/types";
import { URIDService } from "@/lib/urid-service";
import { distributionRegistry } from "../record/route";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urid, aidType, volunteerSession } = body;

    // Validate request data
    if (!urid || !aidType || !volunteerSession) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message: "Missing required fields: urid, aidType, volunteerSession",
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

    // Verify volunteer session
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET not configured");
      }

      const decodedSession = jwt.verify(
        volunteerSession,
        jwtSecret,
      ) as VolunteerSession;

      // Check if session is expired
      if (Date.now() > decodedSession.expiresAt) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SESSION_EXPIRED",
              message: "Volunteer session has expired",
            },
          },
          { status: 401 },
        );
      }
    } catch (error) {
      console.error("Session verification error:", error);
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

    // Generate URID hash for lookup
    const uridHash = URIDService.hashURID(urid);

    // Check family eligibility for this aid type
    const eligibility = await checkFamilyEligibility(uridHash, aidType);

    return NextResponse.json({
      success: true,
      eligibility,
    });
  } catch (error) {
    console.error("Eligibility check error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to check eligibility. Please try again.",
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
