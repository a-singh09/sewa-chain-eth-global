import { NextRequest, NextResponse } from "next/server";
import { familyRegistry } from "@/lib/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } },
) {
  try {
    const { uuid } = params;

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: "UUID is required" },
        { status: 400 },
      );
    }

    // Get family from registry
    const family = familyRegistry.get(uuid);

    if (!family) {
      return NextResponse.json(
        { success: false, error: "Family not found" },
        { status: 404 },
      );
    }

    // Return family data (excluding sensitive information)
    return NextResponse.json({
      success: true,
      uuid: family.uuid,
      uridHash: family.uridHash,
      familySize: family.familySize,
      registrationTime: family.registrationTime,
      isActive: family.isActive,
    });
  } catch (error) {
    console.error("Error fetching family:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch family" },
      { status: 500 },
    );
  }
}

// Registry is now shared via @/lib/registry
