import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  SelfBackendVerifier,
  AttestationId,
  AllIds,
  DefaultConfigStore,
} from "@selfxyz/core";

// Initialize SelfBackendVerifier with configuration from environment variables
// Note: For demo purposes, this always returns successful verification
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_SCOPE || "sewachain-aadhaar",
  process.env.NEXT_PUBLIC_SELF_ENDPOINT ||
    `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/verify-aadhaar`,
  false, // mockPassport: false = mainnet, true = staging/testnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [], // No country restrictions for Aadhaar
    ofac: false, // OFAC disabled for Aadhaar
  }),
  "hex", // userIdentifierType
);

// In-memory storage for verification sessions (for demo - use Redis/DB in production)
const verificationSessions = new Map<
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
>();

// Make sessions available globally for status endpoint
if (typeof global !== "undefined") {
  (global as any).verificationSessions = verificationSessions;
}

/**
 * Generate a unique session ID for verification tracking
 */
function generateSessionId(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${Math.random()}`)
    .digest("hex")
    .substring(0, 16);
}

/**
 * Generate privacy-preserving hashed identifier
 */
function generatePrivacyPreservingIdentifier(
  publicSignals: string[],
  userContextData: {
    familySize: number;
    location: string;
    contactInfo: string;
  },
  credentialSubject: {
    nationality: string;
    gender: string;
    minimumAge: boolean;
  },
): string {
  const combinedData = JSON.stringify({
    signals: publicSignals.slice(0, 3), // Use first 3 signals for privacy
    context: {
      familySize: userContextData.familySize,
      location: userContextData.location.substring(0, 10), // Partial location
    },
    credentials: credentialSubject,
    timestamp: Math.floor(Date.now() / (1000 * 60 * 60)), // Hour-based timestamp
  });

  return createHash("sha256")
    .update(combinedData)
    .digest("hex")
    .substring(0, 16);
}

/**
 * Validate user context data
 */
function validateUserContextData(userContextData: unknown): boolean {
  if (!userContextData || typeof userContextData !== "object") {
    return false;
  }

  const data = userContextData as any;
  return (
    typeof data.familySize === "number" &&
    data.familySize > 0 &&
    typeof data.location === "string" &&
    data.location.length > 0 &&
    typeof data.contactInfo === "string" &&
    data.contactInfo.length > 0
  );
}

export async function GET() {
  return NextResponse.json({
    status: "success",
    message: "Aadhaar verification endpoint is running",
    timestamp: new Date().toISOString(),
    sessionsCount: verificationSessions.size,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("=== Self Protocol Verification Request ===");
    console.log("Request keys:", Object.keys(body));

    // Extract required fields from the request body
    const { attestationId, proof, publicSignals, userContextData } = body;

    // Validate required fields are present
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason:
            "Proof, publicSignals, attestationId and userContextData are required",
        },
        { status: 200 },
      );
    }

    // Verify the proof using SelfBackendVerifier
    const result = await selfBackendVerifier.verify(
      attestationId, // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
      proof, // The zero-knowledge proof
      publicSignals, // Public signals array
      userContextData, // User context data (hex string)
    );

    // Check if verification was successful
    const { isValid, isOlderThanValid, isOfacValid } = result.isValidDetails;
    if (!isValid || !isOlderThanValid || !isOfacValid) {
      let reason = "Verification failed";
      if (!isOlderThanValid) reason = "Minimum age verification failed";
      if (!isOfacValid) reason = "OFAC verification failed";

      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason,
        },
        { status: 200 },
      );
    }

    // Extract disclosure output for credential subject
    const { discloseOutput, userData } = result;

    // Create credential subject from disclosure output
    const credentialSubject = {
      nationality: discloseOutput.nationality || "IN", // Default to India for Aadhaar
      gender: discloseOutput.gender || "U", // Default to Unknown if not disclosed
      minimumAge: isOlderThanValid, // Use age validation result
    };

    // Generate privacy-preserving identifier using the nullifier to prevent reuse
    const hashedIdentifier = createHash("sha256")
      .update(
        discloseOutput.nullifier ||
          userData.userIdentifier ||
          `fallback-${Date.now()}`,
      )
      .digest("hex")
      .substring(0, 16);

    // Generate session ID
    const sessionId = generateSessionId();

    // Store verification result
    verificationSessions.set(sessionId, {
      status: "completed",
      result: true,
      hashedIdentifier,
      credentialSubject,
      timestamp: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    console.log("✅ Verification successful:", {
      sessionId,
      hashedIdentifier: hashedIdentifier.substring(0, 8) + "...",
      nationality: credentialSubject.nationality,
      gender: credentialSubject.gender,
      minimumAge: credentialSubject.minimumAge,
    });

    return NextResponse.json(
      {
        status: "success",
        result: true,
        hashedIdentifier,
        credentialSubject,
        sessionId,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("💥 Aadhaar verification error:", error);

    // Handle ConfigMismatchError specifically
    if (error.name === "ConfigMismatchError") {
      console.error("Configuration mismatches:", error.issues);
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: `Configuration mismatch: ${error.issues?.[0]?.type || "Unknown config error"}`,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    );
  }
}

// Response type interfaces
interface AadhaarVerificationResponse {
  status: "success" | "error";
  result: boolean;
  hashedIdentifier?: string;
  credentialSubject?: {
    nationality: string;
    gender: string;
    minimumAge: boolean;
  };
  message?: string;
  errorCode?: string;
  sessionId?: string;
  debug?: Record<string, unknown>; // For debugging purposes
}

interface VerificationStatusResponse {
  status: "pending" | "completed" | "failed" | "expired";
  result?: boolean;
  hashedIdentifier?: string;
  credentialSubject?: {
    nationality: string;
    gender: string;
    minimumAge: boolean;
  };
  message?: string;
}
