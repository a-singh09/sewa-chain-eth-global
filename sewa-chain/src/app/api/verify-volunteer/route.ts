import {
  ISuccessResult,
  IVerifyResponse,
  verifyCloudProof,
} from "@worldcoin/minikit-js";
import { NextRequest, NextResponse } from "next/server";
import {
  VerifyVolunteerRequest,
  VerifyVolunteerResponse,
  VolunteerSession,
  VerificationLevel,
  VolunteerPermission,
} from "@/types";

// In-memory storage for demo purposes - replace with database in production
const registeredVolunteers = new Set<string>();
const volunteerSessions = new Map<string, VolunteerSession>();

/**
 * Volunteer World ID Verification Route
 * Handles Device-level verification for volunteers with session management
 */
export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } =
      (await req.json()) as VerifyVolunteerRequest;

    if (action !== "verify-volunteer") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ACTION",
            message: "Invalid action for volunteer verification",
          },
        } as VerifyVolunteerResponse,
        { status: 400 },
      );
    }

    const app_id = process.env.NEXT_PUBLIC_APP_ID as `app_${string}`;

    if (!app_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFIGURATION_ERROR",
            message: "App ID not configured",
          },
        } as VerifyVolunteerResponse,
        { status: 500 },
      );
    }

    // Debug logging
    console.log("Verification request:", {
      app_id,
      action,
      signal,
      payload: {
        proof: payload.proof?.substring(0, 20) + "...",
        merkle_root: payload.merkle_root,
        nullifier_hash: payload.nullifier_hash?.substring(0, 20) + "...",
        verification_level: payload.verification_level,
      },
    });

    // Verify the proof using World ID (supports both Device and Orb level)
    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal,
    )) as IVerifyResponse;

    console.log("World ID verification result:", {
      success: verifyRes.success,
      detail: verifyRes.detail,
      code: verifyRes.code,
    });

    if (!verifyRes.success) {
      console.error("World ID verification failed:", verifyRes);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PROOF",
            message: "World ID verification failed",
            details: verifyRes.detail || "Unknown verification error",
          },
        } as VerifyVolunteerResponse,
        { status: 400 },
      );
    }

    const nullifierHash = payload.nullifier_hash;

    console.log(
      `World ID verification successful for nullifier: ${nullifierHash.slice(0, 8)}...`,
    );

    // Check if this nullifier is already registered (allow re-registration for demo)
    if (registeredVolunteers.has(nullifierHash)) {
      console.log(
        `Re-registration for existing volunteer: ${nullifierHash.slice(0, 8)}...`,
      );
    }

    // Create volunteer session
    const now = Date.now();
    const volunteerId = generateVolunteerId(nullifierHash);
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    // Create simple session token (no JWT needed for World App)
    const sessionToken = `vol_${nullifierHash.substring(0, 8)}_${now}_${Math.random().toString(36).substring(2)}`;

    const volunteerSession: VolunteerSession = {
      nullifierHash,
      sessionToken,
      verificationLevel: VerificationLevel.Device,
      timestamp: now,
      volunteerId,
      permissions: [
        VolunteerPermission.DISTRIBUTE_AID,
        VolunteerPermission.VERIFY_BENEFICIARIES,
        VolunteerPermission.VIEW_DISTRIBUTION_DATA,
      ],
      expiresAt,
      verifiedAt: now,
    };

    // Store volunteer registration and session
    registeredVolunteers.add(nullifierHash);
    volunteerSessions.set(sessionToken, volunteerSession);

    console.log(`New volunteer registered: ${volunteerSession.volunteerId}`);

    return NextResponse.json(
      {
        success: true,
        volunteerSession,
      } as VerifyVolunteerResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Volunteer verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VERIFICATION_FAILED",
          message: "Internal server error during verification",
        },
      } as VerifyVolunteerResponse,
      { status: 500 },
    );
  }
}

/**
 * Generate a unique volunteer ID from nullifier hash
 */
function generateVolunteerId(nullifierHash: string): string {
  // Use first 8 characters of nullifier hash for volunteer ID
  return `VOL_${nullifierHash.slice(0, 8).toUpperCase()}`;
}

// GET endpoint removed - no periodic validation needed for hackathon demo
