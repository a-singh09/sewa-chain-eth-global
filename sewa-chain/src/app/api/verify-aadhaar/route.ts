import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// Error codes for Aadhaar verification
enum AadhaarVerificationErrorCode {
  MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",
  INVALID_REQUEST_DATA = "INVALID_REQUEST_DATA",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  PROOF_VERIFICATION_FAILED = "PROOF_VERIFICATION_FAILED",
  INVALID_PROOF = "INVALID_PROOF",
  MISSING_DISCLOSURES = "MISSING_DISCLOSURES",
  NETWORK_ERROR = "NETWORK_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

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
  global.verificationSessions = verificationSessions;
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

export interface AadhaarVerificationResponse {
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

export interface VerificationStatusResponse {
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

/**
 * Simplified Aadhaar Verification Route for Hackathon Demo
 *
 * This endpoint handles Self Protocol verification requests in demo mode.
 * Based on Self Protocol documentation and workshop examples.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("=== Self Protocol Request Debug ===");
    console.log("Request keys:", Object.keys(body));
    console.log("userContextData type:", typeof body.userContextData);
    if (typeof body.userContextData === "string") {
      console.log("userContextData length:", body.userContextData.length);
      console.log(
        "userContextData preview:",
        body.userContextData.substring(0, 100) + "...",
      );
    }
    console.log("=====================================");

    // According to Self Protocol docs, the verification data comes in this format:
    // { attestationId, proof, publicSignals, userContextData }
    // But userContextData might be in userData.userDefinedData

    let userContextData;
    let extractionMethod = "none";

    // Method 1: Direct userDefinedData (most common Self Protocol format)
    if (body.userDefinedData) {
      try {
        userContextData =
          typeof body.userDefinedData === "string"
            ? JSON.parse(body.userDefinedData)
            : body.userDefinedData;
        extractionMethod = "userDefinedData";
        console.log("✓ Extracted from userDefinedData:", userContextData);
      } catch (e) {
        console.warn("✗ Failed to parse userDefinedData:", e);
      }
    }

    // Method 2: userData.userDefinedData (alternative Self Protocol format)
    if (!userContextData && body.userData && body.userData.userDefinedData) {
      try {
        userContextData =
          typeof body.userData.userDefinedData === "string"
            ? JSON.parse(body.userData.userDefinedData)
            : body.userData.userDefinedData;
        extractionMethod = "userData.userDefinedData";
        console.log(
          "✓ Extracted from userData.userDefinedData:",
          userContextData,
        );
      } catch (e) {
        console.warn("✗ Failed to parse userData.userDefinedData:", e);
      }
    }

    // Method 3: Direct userContextData (might be hex-encoded)
    if (!userContextData && body.userContextData) {
      try {
        // Check if userContextData is a hex-encoded string
        if (
          typeof body.userContextData === "string" &&
          body.userContextData.startsWith("0x")
        ) {
          // Remove 0x prefix and decode hex
          const hexString = body.userContextData.slice(2);
          const decodedString = Buffer.from(hexString, "hex").toString("utf8");

          // Find the JSON part (it should be at the end of the decoded string)
          const jsonMatch = decodedString.match(/\{.*\}$/);
          if (jsonMatch) {
            userContextData = JSON.parse(jsonMatch[0]);
            extractionMethod = "userContextData_hex_decoded";
            console.log("✓ Decoded hex userContextData:", userContextData);
          } else {
            console.warn(
              "✗ No JSON found in decoded hex string:",
              decodedString,
            );
          }
        } else if (
          typeof body.userContextData === "string" &&
          body.userContextData.match(/^[0-9a-fA-F]+$/)
        ) {
          // Hex string without 0x prefix
          const decodedString = Buffer.from(
            body.userContextData,
            "hex",
          ).toString("utf8");
          console.log(
            "Decoded string preview:",
            decodedString.substring(Math.max(0, decodedString.length - 200)),
          );

          // Find the JSON part (it should be at the end of the decoded string)
          const jsonMatch = decodedString.match(/\{.*\}$/);
          if (jsonMatch) {
            userContextData = JSON.parse(jsonMatch[0]);
            extractionMethod = "userContextData_hex_decoded_no_prefix";
            console.log(
              "✓ Decoded hex userContextData (no prefix):",
              userContextData,
            );
          } else {
            console.warn("✗ No JSON found in decoded hex string");
            console.warn("Decoded string length:", decodedString.length);
            console.warn(
              "Decoded string (last 100 chars):",
              decodedString.slice(-100),
            );
          }
        } else {
          // Try to parse as JSON directly
          userContextData =
            typeof body.userContextData === "string"
              ? JSON.parse(body.userContextData)
              : body.userContextData;
          extractionMethod = "userContextData_direct";
          console.log("✓ Using direct userContextData:", userContextData);
        }
      } catch (e) {
        console.warn("✗ Failed to process userContextData:", e);
        console.log("Raw userContextData:", body.userContextData);
      }
    }

    // Method 4: For demo - create mock data if nothing found
    if (!userContextData) {
      console.log("⚠ No user context data found, creating demo data");
      userContextData = {
        familySize: 4,
        location: "Demo Location, India",
        contactInfo: "+91-9999999999",
        timestamp: Date.now(),
      };
      extractionMethod = "demo_fallback";
    }

    console.log("Final userContextData:", userContextData);
    console.log("Extraction method:", extractionMethod);

    // Validate the extracted data
    const validation = validateUserContextData(userContextData);
    if (!validation.isValid) {
      console.error("❌ Validation failed:", validation.error);

      return NextResponse.json(
        {
          status: "error",
          result: false,
          message: validation.error,
          errorCode: AadhaarVerificationErrorCode.MISSING_REQUIRED_FIELDS,
          debug: {
            extractionMethod,
            receivedKeys: Object.keys(body),
            userContextData,
            validation,
          },
        } as AadhaarVerificationResponse,
        { status: 400 },
      );
    }

    console.log("✅ Validation passed, proceeding with demo verification");

    // For hackathon demo: Always succeed with mock verification
    const credentialSubject = {
      nationality: "IN", // India
      gender: Math.random() > 0.5 ? "M" : "F", // Random for demo
      minimumAge: true, // Always 18+ for demo
    };

    // Generate privacy-preserving hashed identifier
    const hashedIdentifier = generatePrivacyPreservingIdentifier(
      body.publicSignals || [`demo-signal-${Date.now()}`],
      userContextData,
      credentialSubject,
    );

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

    console.log("🎉 Demo Aadhaar verification successful:", {
      sessionId,
      hashedIdentifier: hashedIdentifier.substring(0, 8) + "...",
      location: userContextData.location,
      familySize: userContextData.familySize,
    });

    return NextResponse.json(
      {
        status: "success",
        result: true,
        hashedIdentifier,
        credentialSubject,
        sessionId,
      } as AadhaarVerificationResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("💥 Aadhaar verification error:", error);

    return NextResponse.json(
      {
        status: "error",
        result: false,
        message: "Internal server error during Aadhaar verification",
        errorCode: AadhaarVerificationErrorCode.INTERNAL_SERVER_ERROR,
        debug: {
          error: error instanceof Error ? error.message : String(error),
        },
      } as AadhaarVerificationResponse,
      { status: 500 },
    );
  }
}

/**
 * Validate user context data
 */
function validateUserContextData(userContextData: unknown): {
  isValid: boolean;
  error?: string;
} {
  if (!userContextData) {
    return { isValid: false, error: "userContextData is null or undefined" };
  }

  if (typeof userContextData !== "object") {
    return { isValid: false, error: "userContextData must be an object" };
  }

  const contextData = userContextData as any;

  if (
    typeof contextData.familySize !== "number" ||
    contextData.familySize < 1
  ) {
    return { isValid: false, error: "familySize must be a positive number" };
  }

  if (!contextData.location || typeof contextData.location !== "string") {
    return { isValid: false, error: "location must be a non-empty string" };
  }

  if (!contextData.contactInfo || typeof contextData.contactInfo !== "string") {
    return { isValid: false, error: "contactInfo must be a non-empty string" };
  }

  return { isValid: true };
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
  // Use the first public signal as the primary identifier
  const primaryIdentifier = publicSignals[0] || `demo-${Date.now()}`;

  // Create a deterministic salt from stable user data
  const saltData = [
    userContextData.location.toLowerCase().trim(),
    userContextData.familySize.toString(),
    credentialSubject.nationality,
    credentialSubject.gender,
  ].join("|");

  // Generate deterministic hash
  const salt = createHash("sha256").update(saltData).digest("hex");
  const combinedData = `${primaryIdentifier}:${salt}`;

  // Generate final identifier (16 characters for URID compatibility)
  return createHash("sha256")
    .update(combinedData)
    .digest("hex")
    .substring(0, 16);
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "success",
    message: "Aadhaar verification endpoint is running (demo mode)",
    timestamp: new Date().toISOString(),
    demoMode: true,
    sessionsCount: verificationSessions.size,
  });
}
