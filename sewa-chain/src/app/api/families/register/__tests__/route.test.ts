import { NextRequest } from "next/server";
import { POST } from "../route";
import { URIDService } from "@/lib/urid-service";

// Mock the dependencies
jest.mock("@/services/ContractService", () => ({
  getContractService: jest.fn(() => ({
    registerFamily: jest.fn().mockResolvedValue({
      success: true,
      transactionHash: "0x123456789abcdef",
    }),
  })),
}));

jest.mock("@/lib/volunteer-session", () => ({
  validateVolunteerSession: jest.fn().mockResolvedValue({
    valid: true,
  }),
}));

describe("/api/families/register", () => {
  beforeEach(() => {
    // Clear URID registries before each test
    URIDService.clearRegistries();
    jest.clearAllMocks();
  });

  const validRequestBody = {
    volunteerSession: JSON.stringify({
      nullifierHash: "test-nullifier",
      sessionToken: "test-token",
      verificationLevel: "device",
      timestamp: Date.now(),
      volunteerId: "test-volunteer-id",
      permissions: ["distribute_aid"],
      expiresAt: Date.now() + 3600000,
      verifiedAt: Date.now(),
    }),
    familyDetails: {
      headOfFamily: "John Doe",
      familySize: 4,
      location: "Mumbai, Maharashtra",
      contactNumber: "+91-9876543210",
    },
    aadhaarProof: {
      hashedIdentifier: "aadhaar-hash-a1b2c3d4e5f6789012345678901234567890abcd",
      credentialSubject: {
        nationality: "IN",
        gender: "M",
        minimumAge: true,
      },
      verificationTimestamp: Date.now(),
    },
  };

  describe("POST endpoint", () => {
    it("should successfully register a family with valid Aadhaar verification", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/families/register",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.urid).toBeDefined();
      expect(data.urid).toMatch(/^[A-F0-9]{16}$/);
      expect(data.uridHash).toBeDefined();
      expect(data.qrCodeDataURL).toBeDefined();
      expect(data.transactionHash).toBe("0x123456789abcdef");
      expect(data.verificationStatus).toEqual({
        aadhaarVerified: true,
        volunteerVerified: true,
        duplicateCheck: true,
      });
    });

    it("should return error for missing required fields", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/families/register",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("MISSING_FIELDS");
    });

    it("should return error for invalid family size", async () => {
      const invalidBody = {
        ...validRequestBody,
        familyDetails: {
          ...validRequestBody.familyDetails,
          familySize: 0,
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/families/register",
        {
          method: "POST",
          body: JSON.stringify(invalidBody),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_FAMILY_SIZE");
    });

    it("should return error for missing Aadhaar verification", async () => {
      const invalidBody = {
        ...validRequestBody,
        aadhaarProof: {
          hashedIdentifier: "test-hash",
          // Missing credentialSubject and verificationTimestamp
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/families/register",
        {
          method: "POST",
          body: JSON.stringify(invalidBody),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_AADHAAR_PROOF");
    });

    it("should return error for age requirement not met", async () => {
      const invalidBody = {
        ...validRequestBody,
        aadhaarProof: {
          ...validRequestBody.aadhaarProof,
          credentialSubject: {
            nationality: "IN",
            gender: "M",
            minimumAge: false, // Under 18
          },
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/families/register",
        {
          method: "POST",
          body: JSON.stringify(invalidBody),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("AGE_REQUIREMENT_NOT_MET");
    });

    it("should prevent duplicate Aadhaar registration", async () => {
      // First registration
      const request1 = new NextRequest(
        "http://localhost:3000/api/families/register",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
        },
      );

      const response1 = await POST(request1);
      expect(response1.status).toBe(200);

      // Attempt duplicate registration
      const request2 = new NextRequest(
        "http://localhost:3000/api/families/register",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
        },
      );

      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(409);
      expect(data2.success).toBe(false);
      expect(data2.error.code).toBe("DUPLICATE_AADHAAR");
    });
  });
});
