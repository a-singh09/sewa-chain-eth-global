import { NextRequest, NextResponse } from "next/server";
import { getContractService } from "@/services/ContractService";
import { URIDService, AadhaarVerifiedFamilyData } from "@/lib/urid-service";
import { volunteerSessionStore } from "@/lib/volunteer-session-store";
import type { VolunteerSession } from "@/types";

export interface RegisterFamilyRequest {
  volunteerSession: string;
  familyDetails: {
    headOfFamily: string;
    familySize: number;
    location: string;
    contactNumber: string;
  };
  aadhaarProof: {
    hashedIdentifier: string;
    credentialSubject: {
      nationality: string;
      gender: string;
      minimumAge: boolean;
    };
    verificationTimestamp: number;
  };
}

export interface RegisterFamilyResponse {
  success: boolean;
  urid?: string;
  uridHash?: string;
  qrCodeDataURL?: string;
  transactionHash?: string;
  verificationStatus?: {
    aadhaarVerified: boolean;
    volunteerVerified: boolean;
    duplicateCheck: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Family Registration API Route with Self Protocol Integration
 * Handles Aadhaar verification results and creates privacy-preserving family records
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterFamilyRequest;

    // Validate required fields
    if (!body.volunteerSession || !body.familyDetails || !body.aadhaarProof) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message:
              "Missing required fields: volunteerSession, familyDetails, aadhaarProof",
          },
        } as RegisterFamilyResponse,
        { status: 400 },
      );
    }

    const { familyDetails, aadhaarProof } = body;

    // Validate family details
    if (
      !familyDetails.headOfFamily ||
      !familyDetails.location ||
      !familyDetails.contactNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_FAMILY_DETAILS",
            message:
              "Missing family details: headOfFamily, location, contactNumber required",
          },
        } as RegisterFamilyResponse,
        { status: 400 },
      );
    }

    if (familyDetails.familySize < 1 || familyDetails.familySize > 20) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_FAMILY_SIZE",
            message: "Family size must be between 1 and 20",
          },
        } as RegisterFamilyResponse,
        { status: 400 },
      );
    }

    // Validate Aadhaar proof from Self Protocol
    if (
      !aadhaarProof.hashedIdentifier ||
      !aadhaarProof.credentialSubject ||
      !aadhaarProof.verificationTimestamp
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_AADHAAR_PROOF",
            message:
              "Complete Aadhaar verification required - hashedIdentifier, credentialSubject, and verificationTimestamp missing",
          },
        } as RegisterFamilyResponse,
        { status: 400 },
      );
    }

    // Validate credential subject structure
    const { credentialSubject } = aadhaarProof;
    if (
      !credentialSubject.nationality ||
      !credentialSubject.gender ||
      credentialSubject.minimumAge === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIAL_SUBJECT",
            message:
              "Invalid credential subject - nationality, gender, and minimumAge are required",
          },
        } as RegisterFamilyResponse,
        { status: 400 },
      );
    }

    // Validate minimum age requirement
    if (!credentialSubject.minimumAge) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AGE_REQUIREMENT_NOT_MET",
            message: "Family head must be 18 years or older",
          },
        } as RegisterFamilyResponse,
        { status: 400 },
      );
    }

    // Validate volunteer session token
    if (!volunteerSessionStore.isValidSession(body.volunteerSession)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_VOLUNTEER_SESSION",
            message: "Invalid volunteer session",
          },
        } as RegisterFamilyResponse,
        { status: 401 },
      );
    }

    const volunteerSession = volunteerSessionStore.getSession(
      body.volunteerSession,
    )!;

    // Check for duplicate Aadhaar registration
    const duplicateCheck = URIDService.checkAadhaarDuplicate(
      aadhaarProof.hashedIdentifier,
    );
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_AADHAAR",
            message: `Family already registered with URID: ${duplicateCheck.existingURID}. Each Aadhaar can only be registered once.`,
          },
        } as RegisterFamilyResponse,
        { status: 409 },
      );
    }

    // Create Aadhaar-verified family data structure
    const aadhaarVerifiedFamilyData: AadhaarVerifiedFamilyData = {
      hashedAadhaar: aadhaarProof.hashedIdentifier,
      location: familyDetails.location.trim(),
      familySize: familyDetails.familySize,
      contactInfo: familyDetails.contactNumber.trim(),
      registrationTimestamp: Date.now(),
      credentialSubject: {
        nationality: credentialSubject.nationality,
        gender: credentialSubject.gender,
        minimumAge: credentialSubject.minimumAge,
      },
      verificationTimestamp: aadhaarProof.verificationTimestamp,
    };

    // Validate the Aadhaar verification data structure
    if (
      !URIDService.validateAadhaarVerificationData(aadhaarVerifiedFamilyData)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_VERIFICATION_DATA",
            message: "Invalid Aadhaar verification data structure",
          },
        } as RegisterFamilyResponse,
        { status: 400 },
      );
    }

    // Generate URID with Aadhaar verification integration
    let uridResult;
    try {
      uridResult = await URIDService.generateUniqueURID(
        aadhaarVerifiedFamilyData,
      );
    } catch (error) {
      console.error("URID generation failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "URID_GENERATION_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to generate unique URID",
          },
        } as RegisterFamilyResponse,
        { status: 500 },
      );
    }

    // Register family on smart contract
    const contractService = getContractService(
      process.env.NODE_ENV === "production" ? "mainnet" : "testnet",
    );

    let registrationResult;
    try {
      registrationResult = await contractService.registerFamily(
        uridResult.uridHash,
        familyDetails.familySize,
      );
    } catch (error) {
      console.error("Smart contract registration failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONTRACT_ERROR",
            message: "Smart contract registration failed",
          },
        } as RegisterFamilyResponse,
        { status: 500 },
      );
    }

    if (!registrationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONTRACT_ERROR",
            message:
              registrationResult.error || "Smart contract registration failed",
          },
        } as RegisterFamilyResponse,
        { status: 500 },
      );
    }

    // Store URID mapping with Aadhaar verification data
    try {
      await URIDService.storeURIDMapping(uridResult.urid, {
        ...aadhaarVerifiedFamilyData,
        headOfFamily: familyDetails.headOfFamily,
        transactionHash: registrationResult.transactionHash,
        registeredAt: new Date().toISOString(),
        registeredBy: volunteerSession.volunteerId,
      } as any);
    } catch (error) {
      console.error("Failed to store URID mapping:", error);
      // Continue with success response as blockchain registration succeeded
    }

    // Log successful registration (privacy-preserving)
    console.log(
      "Family registered successfully with Self Protocol verification:",
      {
        urid: uridResult.urid,
        familySize: familyDetails.familySize,
        location: familyDetails.location,
        nationality: credentialSubject.nationality,
        minimumAge: credentialSubject.minimumAge,
        transactionHash: registrationResult.transactionHash,
        volunteerId: volunteerSession.volunteerId,
        collisionAttempts: uridResult.attempts,
        timestamp: new Date().toISOString(),
      },
    );

    return NextResponse.json(
      {
        success: true,
        urid: uridResult.urid,
        uridHash: uridResult.uridHash,
        qrCodeDataURL: uridResult.qrCodeDataURL,
        transactionHash: registrationResult.transactionHash,
        verificationStatus: {
          aadhaarVerified: true,
          volunteerVerified: true,
          duplicateCheck: true,
        },
      } as RegisterFamilyResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Family registration error:", error);

    // Provide specific error handling
    let errorCode = "REGISTRATION_FAILED";
    let message = "Internal server error during family registration";

    if (error instanceof Error) {
      if (
        error.message.includes("duplicate") ||
        error.message.includes("already registered")
      ) {
        errorCode = "DUPLICATE_REGISTRATION";
        message = "Family already registered in the system";
      } else if (
        error.message.includes("network") ||
        error.message.includes("timeout")
      ) {
        errorCode = "NETWORK_ERROR";
        message = "Network error during registration. Please try again.";
      } else if (error.message.includes("contract")) {
        errorCode = "CONTRACT_ERROR";
        message = "Blockchain registration failed. Please try again.";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorCode,
          message,
        },
      } as RegisterFamilyResponse,
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to retrieve family registration status
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const urid = url.searchParams.get("urid");
  const uridHash = url.searchParams.get("uridHash");

  if (!urid && !uridHash) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_IDENTIFIER",
          message: "Either URID or URID hash is required",
        },
      },
      { status: 400 },
    );
  }

  try {
    const contractService = getContractService(
      process.env.NODE_ENV === "production" ? "mainnet" : "testnet",
    );

    let queryHash = uridHash;
    if (urid && !uridHash) {
      queryHash = URIDService.hashURID(urid);
    }

    if (!queryHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_IDENTIFIER",
            message: "Invalid URID or URID hash format",
          },
        },
        { status: 400 },
      );
    }

    // Get family info from contract
    const familyInfo = await contractService.getFamilyInfo(queryHash);

    if (!familyInfo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FAMILY_NOT_FOUND",
            message: "Family not found in registry",
          },
        },
        { status: 404 },
      );
    }

    // Get local family data if available (without exposing sensitive data)
    let localData = null;
    if (urid) {
      try {
        const fullData = await URIDService.getFamilyData(urid);
        if (fullData) {
          // Return only non-sensitive data
          localData = {
            familySize: fullData.familySize,
            location: fullData.location,
            registrationTimestamp: fullData.registrationTimestamp,
            verificationTimestamp: fullData.verificationTimestamp,
            nationality: fullData.credentialSubject?.nationality,
            minimumAge: fullData.credentialSubject?.minimumAge,
          };
        }
      } catch (error) {
        console.error("Failed to retrieve local family data:", error);
        // Continue without local data
      }
    }

    return NextResponse.json({
      success: true,
      familyInfo,
      localData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Family lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LOOKUP_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Internal server error during family lookup",
        },
      },
      { status: 500 },
    );
  }
}
