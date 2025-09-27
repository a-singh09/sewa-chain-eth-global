import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  AidType,
  VolunteerSession,
  EligibilityResult,
  COOLDOWN_PERIODS,
} from "@/types";
import { URIDService } from "@/lib/urid-service";
import { checkFamilyEligibility } from "../record/route";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urid, aidType, volunteerSession } = body;

    // Validate request data
    if (!urid || !aidType || !volunteerSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      );
    }

    // Validate URID format
    if (!URIDService.validateURID(urid)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URID format",
        },
        { status: 400 },
      );
    }

    // Validate aid type
    if (!Object.values(AidType).includes(aidType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid aid type",
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
            error: "Volunteer session has expired",
          },
          { status: 401 },
        );
      }
    } catch (error) {
      console.error("Session verification error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid volunteer session",
        },
        { status: 401 },
      );
    }

    // Check if family exists
    const familyExists = await URIDService.checkURIDExists(urid);
    if (!familyExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Family not found",
        },
        { status: 404 },
      );
    }

    // Generate URID hash for eligibility check
    const uridHash = URIDService.hashURID(urid);

    // Check eligibility
    const eligibility = await checkFamilyEligibility(uridHash, aidType);

    return NextResponse.json({
      success: true,
      eligibility,
      cooldownPeriod: COOLDOWN_PERIODS[aidType],
    });
  } catch (error) {
    console.error("Eligibility check error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check eligibility. Please try again.",
      },
      { status: 500 },
    );
  }
}
