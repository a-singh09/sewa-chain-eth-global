import { NextRequest, NextResponse } from "next/server";
import { getWorldChainContractService } from "@/services/WorldChainContractService";
import { WorldChainService } from "@/services/WorldChainService";
import { getVolunteerSession } from "@/lib/volunteer-session";

interface RegisterFamilyRequest {
  aadhaarNumber: string;
  familySize: number;
  location?: string;
}

/**
 * Register a family on the World Chain blockchain
 * POST /api/families/register
 */
export async function POST(request: NextRequest) {
  try {
    const body: RegisterFamilyRequest = await request.json();
    const { aadhaarNumber, familySize, location } = body;

    // Validate input
    if (!aadhaarNumber || !familySize) {
      return NextResponse.json(
        { error: "Aadhaar number and family size are required" },
        { status: 400 },
      );
    }

    if (familySize < 1 || familySize > 20) {
      return NextResponse.json(
        { error: "Family size must be between 1 and 20" },
        { status: 400 },
      );
    }

    // Validate Aadhaar number format (12 digits)
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return NextResponse.json(
        { error: "Invalid Aadhaar number format" },
        { status: 400 },
      );
    }

    // Get volunteer session for authorization
    const volunteerSession = getVolunteerSession();
    if (!volunteerSession) {
      return NextResponse.json(
        { error: "Volunteer authentication required" },
        { status: 401 },
      );
    }

    // Get contract service
    const contractService = getWorldChainContractService();

    // Generate URID hash from Aadhaar number
    const uridHash =
      contractService.constructor.generateURIDHash(aadhaarNumber);

    // Check if family is already registered
    const isRegistered = await contractService.isURIDRegistered(uridHash);
    if (isRegistered) {
      return NextResponse.json(
        {
          error: "Family is already registered",
          uridHash,
          alreadyExists: true,
        },
        { status: 409 },
      );
    }

    // For API route, we return the preparation data
    // The actual blockchain transaction will be handled by the frontend using MiniKit
    return NextResponse.json({
      success: true,
      message: "Family registration prepared",
      data: {
        uridHash,
        familySize,
        location,
        volunteerNullifier: volunteerSession.nullifierHash,
        contractAddress: process.env.NEXT_PUBLIC_URID_REGISTRY_ADDRESS,
        preparationTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error in family registration API:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * Get family registration status
 * GET /api/families/register?aadhaar=123456789012
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aadhaarNumber = searchParams.get("aadhaar");

    if (!aadhaarNumber) {
      return NextResponse.json(
        { error: "Aadhaar number is required" },
        { status: 400 },
      );
    }

    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return NextResponse.json(
        { error: "Invalid Aadhaar number format" },
        { status: 400 },
      );
    }

    const contractService = getWorldChainContractService();
    const uridHash =
      contractService.constructor.generateURIDHash(aadhaarNumber);

    // Check registration status
    const [isRegistered, isValid, familyInfo] = await Promise.all([
      contractService.isURIDRegistered(uridHash),
      contractService.isValidFamily(uridHash),
      contractService.getFamilyInfo(uridHash).catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        uridHash,
        isRegistered,
        isValid,
        familyInfo,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error checking family registration status:", error);

    return NextResponse.json(
      {
        error: "Failed to check registration status",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
