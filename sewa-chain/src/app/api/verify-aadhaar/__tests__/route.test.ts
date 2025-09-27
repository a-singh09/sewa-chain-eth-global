import { NextRequest } from "next/server";
import { POST, GET, AadhaarVerificationErrorCode } from "../route";

describe("/api/verify-aadhaar", () => {
  beforeEach(() => {
    // Set up environment variables for demo mode
    process.env.SELF_BACKEND_SCOPE = "sewachain-aadhaar";
    process.env.SELF_API_KEY = "your_self_api_key"; // Demo mode key
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET endpoint", () => {
    it("should return health check response", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("success");
      expect(data.message).toBe("Aadhaar verification endpoint is running");
      expect(data.timestamp).toBeDefined();
    });
  });

  describe("POST endpoint", () => {
    const validRequestBody = {
      attestationId: "test-attestation-id",
      proof: { test: "proof" },
      publicSignals: ["signal1", "signal2"],
      userContextData: {
        familySize: 4,
        location: "Mumbai",
        contactInfo: "+91-9876543210",
      },
    };

    it("should return error for missing required fields", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/verify-aadhaar",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe("error");
      expect(data.result).toBe(false);
      expect(data.errorCode).toBe(
        AadhaarVerificationErrorCode.MISSING_REQUIRED_FIELDS,
      );
    });

    it("should return error for invalid family size", async () => {
      const invalidBody = {
        ...validRequestBody,
        userContextData: {
          ...validRequestBody.userContextData,
          familySize: -1,
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/verify-aadhaar",
        {
          method: "POST",
          body: JSON.stringify(invalidBody),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe("error");
      expect(data.errorCode).toBe(
        AadhaarVerificationErrorCode.INVALID_REQUEST_DATA,
      );
    });

    it("should return error for missing environment configuration", async () => {
      delete process.env.SELF_BACKEND_SCOPE;

      const request = new NextRequest(
        "http://localhost:3000/api/verify-aadhaar",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe("error");
      expect(data.errorCode).toBe(
        AadhaarVerificationErrorCode.CONFIGURATION_ERROR,
      );
    });

    it("should successfully verify Aadhaar and return hashed identifier in demo mode", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/verify-aadhaar",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("success");
      expect(data.result).toBe(true);
      expect(data.hashedIdentifier).toBeDefined();
      expect(data.hashedIdentifier).toHaveLength(16);
      expect(data.credentialSubject).toEqual({
        nationality: "IN",
        gender: "F", // Based on publicSignals[1] !== "1"
        minimumAge: true,
      });
    });

    it("should generate deterministic hashed identifiers", async () => {
      // Make two identical requests
      const request1 = new NextRequest(
        "http://localhost:3000/api/verify-aadhaar",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
        },
      );

      const request2 = new NextRequest(
        "http://localhost:3000/api/verify-aadhaar",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
        },
      );

      const response1 = await POST(request1);
      const data1 = await response1.json();

      const response2 = await POST(request2);
      const data2 = await response2.json();

      // Should generate the same hashed identifier for identical inputs
      expect(data1.hashedIdentifier).toBe(data2.hashedIdentifier);
    });

    it("should handle empty public signals", async () => {
      const invalidBody = {
        ...validRequestBody,
        publicSignals: [],
      };

      const request = new NextRequest(
        "http://localhost:3000/api/verify-aadhaar",
        {
          method: "POST",
          body: JSON.stringify(invalidBody),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe("error");
      expect(data.errorCode).toBe(
        AadhaarVerificationErrorCode.MISSING_REQUIRED_FIELDS,
      );
    });
  });
});
