import { NextRequest, NextResponse } from "next/server";

// Import types from the main verification route
import type { VerificationStatusResponse } from "../route";

// Access the verification sessions from the main route
// In production, this would be a shared Redis/database store
declare global {
  var verificationSessions: Map<
    string,
    {
      status: "pending" | "completed" | "failed" | "expired";
      result?: boolean;
      hashedIdentifier?: string;
      credentialSubject?: {
        nationality: string;
        gender: string;
        minimumAge: boolean;
      };
      timestamp: number;
      expiresAt: number;
    }
  >;
}

/**
 * GET endpoint for checking Aadhaar verification status
 *
 * This endpoint allows the World app to poll for verification status
 * after the user has gone to the Self app for Aadhaar verification.
 *
 * Usage: GET /api/verify-aadhaar/status?sessionId=<session_id>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        {
          status: "failed",
          message: "Session ID is required",
        } as VerificationStatusResponse,
        { status: 400 },
      );
    }

    // Get verification sessions from global store
    // In production, this would be a proper database/Redis lookup
    const sessions = global.verificationSessions || new Map();
    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          status: "expired",
          message: "Verification session not found or expired",
        } as VerificationStatusResponse,
        { status: 404 },
      );
    }

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      sessions.delete(sessionId);
      return NextResponse.json(
        {
          status: "expired",
          message: "Verification session has expired",
        } as VerificationStatusResponse,
        { status: 410 },
      );
    }

    // Return current session status
    const response: VerificationStatusResponse = {
      status: session.status,
    };

    // Include verification results if completed successfully
    if (session.status === "completed" && session.result) {
      response.result = session.result;
      response.hashedIdentifier = session.hashedIdentifier;
      response.credentialSubject = session.credentialSubject;
    } else if (session.status === "failed") {
      response.message = "Aadhaar verification failed";
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Verification status check error:", error);

    return NextResponse.json(
      {
        status: "failed",
        message: "Internal server error while checking verification status",
      } as VerificationStatusResponse,
      { status: 500 },
    );
  }
}

/**
 * POST endpoint for updating verification status (for Self app callback)
 *
 * This endpoint can be used by the Self app or verification service
 * to update the status of a pending verification.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, status, result, hashedIdentifier, credentialSubject } =
      body;

    if (!sessionId || !status) {
      return NextResponse.json(
        {
          status: "failed",
          message: "Session ID and status are required",
        },
        { status: 400 },
      );
    }

    // Get verification sessions from global store
    const sessions = global.verificationSessions || new Map();
    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          status: "failed",
          message: "Verification session not found",
        },
        { status: 404 },
      );
    }

    // Update session status
    session.status = status;
    if (result !== undefined) session.result = result;
    if (hashedIdentifier) session.hashedIdentifier = hashedIdentifier;
    if (credentialSubject) session.credentialSubject = credentialSubject;

    sessions.set(sessionId, session);

    console.log("Verification status updated:", {
      sessionId,
      status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Verification status updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verification status update error:", error);

    return NextResponse.json(
      {
        status: "failed",
        message: "Internal server error while updating verification status",
      },
      { status: 500 },
    );
  }
}
