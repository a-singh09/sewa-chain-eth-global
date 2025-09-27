import {
  URIDService,
  FamilyData,
  AadhaarVerifiedFamilyData,
} from "@/lib/urid-service";

// Mock QRCode module
jest.mock("qrcode", () => ({
  toDataURL: jest.fn().mockImplementation((text) => {
    if (!text) {
      throw new Error("Invalid input");
    }
    return Promise.resolve(`data:image/png;base64,mock-qr-code-for-${text}`);
  }),
}));

describe("URIDService", () => {
  const mockFamilyData: FamilyData = {
    hashedAadhaar: "a1b2c3d4e5f6g7h8",
    location: "Delhi",
    familySize: 4,
    contactInfo: "+919876543210",
    registrationTimestamp: 1640995200000, // Fixed timestamp for testing
  };

  describe("generateURID", () => {
    test("should generate valid 16-character hex URID", () => {
      const urid = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        mockFamilyData.location,
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp,
      );

      expect(urid).toMatch(/^[A-F0-9]{16}$/);
      expect(urid.length).toBe(16);
    });

    test("should generate same URID for same input data", () => {
      const urid1 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        mockFamilyData.location,
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp,
      );

      const urid2 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        mockFamilyData.location,
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp,
      );

      expect(urid1).toBe(urid2);
    });

    test("should generate different URIDs for different input data", () => {
      const urid1 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        "Mumbai",
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp,
      );

      const urid2 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        "Delhi",
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp,
      );

      expect(urid1).not.toBe(urid2);
    });
  });

  describe("validateURID", () => {
    test("should accept valid 16-character hex URID", () => {
      const validURID = "A1B2C3D4E5F67890";
      expect(URIDService.validateURID(validURID)).toBe(true);
    });

    test("should reject invalid URID formats", () => {
      expect(URIDService.validateURID("invalid")).toBe(false);
      expect(URIDService.validateURID("A1B2C3D4E5F6789")).toBe(false); // 15 chars
      expect(URIDService.validateURID("A1B2C3D4E5F678901")).toBe(false); // 17 chars
      expect(URIDService.validateURID("a1b2c3d4e5f67890")).toBe(false); // lowercase
      expect(URIDService.validateURID("")).toBe(false); // empty
    });
  });

  describe("generateQRCode", () => {
    test("should generate valid QR code data URL", async () => {
      const urid = "A1B2C3D4E5F67890";
      const qrCode = await URIDService.generateQRCode(urid);

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
      expect(qrCode.length).toBeGreaterThan(50);
    });

    test("should handle invalid URID format", async () => {
      const invalidURID = "invalid";

      await expect(URIDService.generateQRCode(invalidURID)).rejects.toThrow(
        "Invalid URID format",
      );
    });
  });

  describe("Aadhaar Integration Tests", () => {
    const mockAadhaarVerifiedData: AadhaarVerifiedFamilyData = {
      hashedAadhaar: "aadhaar-hash-a1b2c3d4e5f6789012345678901234567890abcd",
      location: "Mumbai, Maharashtra",
      familySize: 4,
      contactInfo: "+91-9876543210",
      registrationTimestamp: Date.now(),
      verificationTimestamp: Date.now(),
      credentialSubject: {
        nationality: "IN",
        gender: "M",
        minimumAge: true,
      },
    };

    beforeEach(() => {
      // Clear registries before each test
      URIDService.clearRegistries();
    });

    test("should detect no duplicate for new Aadhaar", () => {
      const result = URIDService.checkAadhaarDuplicate(
        mockAadhaarVerifiedData.hashedAadhaar,
      );
      expect(result.isDuplicate).toBe(false);
      expect(result.existingURID).toBeUndefined();
    });

    test("should generate URID with Aadhaar verification data", async () => {
      const result = await URIDService.generateURIDPackage(
        mockAadhaarVerifiedData,
      );

      expect(result.urid).toMatch(/^[A-F0-9]{16}$/);
      expect(result.qrCodeDataURL).toMatch(/^data:image\/png;base64,/);
      expect(result.uridHash).toMatch(/^[a-f0-9]{64}$/);
    });

    test("should prevent duplicate Aadhaar registration", async () => {
      // First registration
      await URIDService.generateURIDPackage(mockAadhaarVerifiedData);

      // Attempt duplicate registration
      await expect(
        URIDService.generateURIDPackage(mockAadhaarVerifiedData),
      ).rejects.toThrow("Family already registered with URID");
    });

    test("should detect duplicate after registration", async () => {
      // First registration
      const result = await URIDService.generateURIDPackage(
        mockAadhaarVerifiedData,
      );

      // Check for duplicate
      const duplicateCheck = URIDService.checkAadhaarDuplicate(
        mockAadhaarVerifiedData.hashedAadhaar,
      );
      expect(duplicateCheck.isDuplicate).toBe(true);
      expect(duplicateCheck.existingURID).toBe(result.urid);
    });

    test("should validate Aadhaar verification data structure", () => {
      expect(
        URIDService.validateAadhaarVerificationData(mockAadhaarVerifiedData),
      ).toBe(true);

      const invalidData = { ...mockAadhaarVerifiedData };
      delete (invalidData as any).credentialSubject;
      expect(URIDService.validateAadhaarVerificationData(invalidData)).toBe(
        false,
      );
    });

    test("should provide registration statistics", async () => {
      await URIDService.generateURIDPackage(mockAadhaarVerifiedData);

      const stats = URIDService.getRegistrationStats();
      expect(stats.totalURIDs).toBe(1);
      expect(stats.totalAadhaarRegistrations).toBe(1);
    });

    test("should retrieve URID by Aadhaar hash", async () => {
      const result = await URIDService.generateURIDPackage(
        mockAadhaarVerifiedData,
      );

      const retrievedURID = URIDService.getURIDByAadhaar(
        mockAadhaarVerifiedData.hashedAadhaar,
      );
      expect(retrievedURID).toBe(result.urid);
    });

    test("should generate different URIDs for different credential subjects", async () => {
      const data1 = { ...mockAadhaarVerifiedData };
      const data2 = {
        ...mockAadhaarVerifiedData,
        hashedAadhaar: "different_aadhaar_hash_12345678901234567890",
        credentialSubject: {
          nationality: "US",
          gender: "F",
          minimumAge: true,
        },
      };

      const result1 = await URIDService.generateURIDPackage(data1);
      const result2 = await URIDService.generateURIDPackage(data2);

      expect(result1.urid).not.toBe(result2.urid);
    });

    test("should handle collision detection with Aadhaar data", async () => {
      const result = await URIDService.generateUniqueURID(
        mockAadhaarVerifiedData,
      );

      expect(result.urid).toMatch(/^[A-F0-9]{16}$/);
      expect(result.attempts).toBe(1);
      expect(result.collisionDetected).toBe(false);
      expect(result.finalTimestamp).toBeDefined();
    });
  });
});
