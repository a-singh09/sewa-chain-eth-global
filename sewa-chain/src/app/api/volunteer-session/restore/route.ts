import { NextRequest, NextResponse } from "next/server";
import { VolunteerSession } from "@/types";
import { volunteerSessionStore } from "@/lib/volunteer-session-store";

/**
 * Session Restoration API Route
 * Restores a volunteer session to the server-side store
 * This handles cases where localStorage has a valid session but server store doesn't
 */
export async function POST(req: NextRequest) {
  console.log("🔧 Session restoration endpoint called");
  try {
    const { volunteerSession } = await req.json();
    console.log("📥 Received session restoration request:", {
      hasSession: !!volunteerSession,
      hasToken: !!volunteerSession?.sessionToken,
      volunteerId: volunteerSession?.volunteerId,
      tokenPreview: volunteerSession?.sessionToken?.substring(0, 10) + "...",
    });

    if (!volunteerSession || !volunteerSession.sessionToken) {
      console.log("❌ Missing session or token in restoration request");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_SESSION",
            message: "Volunteer session is required",
          },
        },
        { status: 400 },
      );
    }

    // Validate session structure
    const requiredFields = [
      "nullifierHash",
      "sessionToken",
      "volunteerId",
      "expiresAt",
      "verifiedAt",
    ];

    for (const field of requiredFields) {
      if (!volunteerSession[field]) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_SESSION_STRUCTURE",
              message: `Missing required field: ${field}`,
            },
          },
          { status: 400 },
        );
      }
    }

    // Check if session is expired
    if (Date.now() > volunteerSession.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SESSION_EXPIRED",
            message: "Session has expired",
          },
        },
        { status: 401 },
      );
    }

    // Restore session to server-side store
    volunteerSessionStore.setSession(
      volunteerSession.sessionToken,
      volunteerSession as VolunteerSession,
    );

    console.log(
      `Session restored for volunteer: ${volunteerSession.volunteerId}`,
    );

    return NextResponse.json({
      success: true,
      message: "Session restored successfully",
    });
  } catch (error) {
    console.error("Session restoration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RESTORATION_FAILED",
          message: "Failed to restore session",
        },
      },
      { status: 500 },
    );
  }
}
