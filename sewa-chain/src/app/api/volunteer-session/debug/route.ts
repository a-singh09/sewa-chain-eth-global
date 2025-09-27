import { NextRequest, NextResponse } from "next/server";
import { volunteerSessionStore } from "@/lib/volunteer-session-store";

/**
 * Debug endpoint to check session store state
 * Only for development/debugging purposes
 */
export async function GET(req: NextRequest) {
  try {
    const activeSessions = volunteerSessionStore.getActiveSessions();
    const cleanedCount = volunteerSessionStore.cleanupExpiredSessions();

    return NextResponse.json({
      success: true,
      debug: {
        totalActiveSessions: activeSessions.length,
        expiredSessionsCleanedUp: cleanedCount,
        globalStoreExists: !!globalThis.__volunteerSessions,
        globalStoreSize: globalThis.__volunteerSessions?.size || 0,
        sessions: activeSessions.map((session) => ({
          volunteerId: session.volunteerId,
          tokenPreview: session.sessionToken.substring(0, 15) + "...",
          expiresAt: new Date(session.expiresAt).toISOString(),
          isExpired: Date.now() > session.expiresAt,
          permissions: session.permissions,
        })),
      },
    });
  } catch (error) {
    console.error("Session debug error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DEBUG_FAILED",
          message: "Failed to get session debug info",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST endpoint to manually add a session for testing
 */
export async function POST(req: NextRequest) {
  try {
    const { action, sessionToken, session } = await req.json();

    if (action === "add" && sessionToken && session) {
      volunteerSessionStore.setSession(sessionToken, session);
      return NextResponse.json({
        success: true,
        message: "Session added for testing",
      });
    } else if (action === "clear") {
      // Clear all sessions (for testing only)
      const activeSessions = volunteerSessionStore.getActiveSessions();
      activeSessions.forEach((session) => {
        volunteerSessionStore.removeSession(session.sessionToken);
      });
      return NextResponse.json({
        success: true,
        message: "All sessions cleared",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_ACTION",
          message: "Invalid debug action",
        },
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Session debug POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DEBUG_FAILED",
          message: "Failed to execute debug action",
        },
      },
      { status: 500 },
    );
  }
}
