import { NextRequest, NextResponse } from "next/server";
import { familyRegistry, FamilyRecord } from "@/lib/registry";

interface FamilyRegistrationRequest {
  uuid: string;
  aadhaarHash: string;
  uridHash: string;
  familySize: number;
  location: string;
  transactionHash: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FamilyRegistrationRequest = await request.json();

    // Validate required fields
    if (
      !body.uuid ||
      !body.aadhaarHash ||
      !body.uridHash ||
      !body.familySize ||
      !body.transactionHash
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if family already exists
    if (familyRegistry.has(body.uuid)) {
      return NextResponse.json(
        { success: false, error: "Family already registered" },
        { status: 409 },
      );
    }

    // Store family registration
    const familyRecord: FamilyRecord = {
      uuid: body.uuid,
      aadhaarHash: body.aadhaarHash,
      uridHash: body.uridHash,
      familySize: body.familySize,
      location: body.location,
      transactionHash: body.transactionHash,
      registrationTime: Date.now(),
      isActive: true,
    };

    familyRegistry.set(body.uuid, familyRecord);

    console.log("Family registered:", body.uuid);

    return NextResponse.json({
      success: true,
      message: "Family registered successfully",
      uuid: body.uuid,
    });
  } catch (error) {
    console.error("Family registration error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 500 },
    );
  }
}
