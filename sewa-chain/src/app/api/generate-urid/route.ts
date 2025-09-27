import { NextRequest, NextResponse } from "next/server";
import { URIDService, FamilyData } from "@/lib/urid-service";

export interface GenerateURIDRequest {
  hashedAadhaar: string;
  location: string;
  familySize: number;
  contactInfo: string;
  volunteerSession?: string;
  credentialSubject?: {
    nationality: string;
    gender: string;
    minimumAge: boolean;
  };
}

export interface GenerateURIDResponse {
  status: "success" | "error";
  urid?: string;
  qrCode?: string;
  uridHash?: string;
  contractTxHash?: string;
  message?: string;
}

/**
 * URID Generation Route
 * Creates unique family identifier and QR code after Aadhaar verification
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateURIDRequest;

    // Validate required fields
    if (
      !body.hashedAadhaar ||
      !body.location ||
      !body.familySize ||
      !body.contactInfo
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Missing required fields: hashedAadhaar, location, familySize, contactInfo",
        } as GenerateURIDResponse,
        { status: 400 },
      );
    }

    // Validate family size
    if (body.familySize < 1 || body.familySize > 20) {
      return NextResponse.json(
        {
          status: "error",
          message: "Family size must be between 1 and 20",
        } as GenerateURIDResponse,
        { status: 400 },
      );
    }

    // Validate location
    if (body.location.trim().length < 2) {
      return NextResponse.json(
        {
          status: "error",
          message: "Location must be at least 2 characters",
        } as GenerateURIDResponse,
        { status: 400 },
      );
    }

    // Create family data object with Aadhaar verification data
    const familyData = {
      hashedAadhaar: body.hashedAadhaar,
      location: body.location.trim(),
      familySize: body.familySize,
      contactInfo: body.contactInfo.trim(),
      registrationTimestamp: Date.now(),
      // Add credential subject from Self Protocol verification
      credentialSubject: body.credentialSubject || {
        nationality: "IN", // Default for India
        gender: "Unknown",
        minimumAge: true,
      },
      verificationTimestamp: Date.now(),
    };

    // Generate URID with collision detection
    const uridResult = await URIDService.generateUniqueURID(familyData);

    // Store URID mapping in database
    await URIDService.storeURIDMapping(uridResult.urid, familyData);

    // TODO: Register family on World Chain smart contract
    // const contractTxHash = await registerFamilyOnBlockchain(uridResult.uridHash, familyData);
    const contractTxHash = `0x${Math.random().toString(16).substring(2, 66)}`; // Mock transaction hash

    console.log("URID generated successfully:", {
      urid: uridResult.urid,
      hashedAadhaar: body.hashedAadhaar.substring(0, 8) + "...",
      location: body.location,
      familySize: body.familySize,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        status: "success",
        urid: uridResult.urid,
        qrCode: uridResult.qrCodeDataURL,
        uridHash: uridResult.uridHash,
        contractTxHash,
      } as GenerateURIDResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("URID generation error:", error);

    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Internal server error during URID generation",
      } as GenerateURIDResponse,
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to validate URID format
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const urid = url.searchParams.get("urid");

  if (!urid) {
    return NextResponse.json(
      {
        status: "error",
        message: "URID parameter is required",
      },
      { status: 400 },
    );
  }

  const isValid = URIDService.validateURID(urid);
  const parseResult = URIDService.parseURID(urid);

  return NextResponse.json({
    status: "success",
    urid,
    isValid,
    parseResult,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Mock function to register family on blockchain
 * In production, this would interact with the URIDRegistry smart contract
 */
async function registerFamilyOnBlockchain(
  uridHash: string,
  familyData: FamilyData,
): Promise<string> {
  // Mock blockchain interaction
  // In production:
  // 1. Connect to World Chain
  // 2. Call URIDRegistry.registerFamily(uridHash, familySize)
  // 3. Return transaction hash

  return Promise.resolve(`0x${Math.random().toString(16).substring(2, 66)}`);
}
