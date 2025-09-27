import { URIDService, FamilyData } from '@/lib/urid-service';

describe('URIDService', () => {
  const mockFamilyData: FamilyData = {
    hashedAadhaar: 'a1b2c3d4e5f6g7h8',
    location: 'Delhi',
    familySize: 4,
    contactInfo: '+919876543210',
    registrationTimestamp: 1640995200000 // Fixed timestamp for testing
  };

  describe('generateURID', () => {
    test('should generate valid 16-character hex URID', () => {
      const urid = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        mockFamilyData.location,
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp
      );
      
      expect(urid).toMatch(/^[A-F0-9]{16}$/);
      expect(urid.length).toBe(16);
    });

    test('should generate same URID for same input data', () => {
      const urid1 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        mockFamilyData.location,
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp
      );
      
      const urid2 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        mockFamilyData.location,
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp
      );
      
      expect(urid1).toBe(urid2);
    });

    test('should generate different URIDs for different input data', () => {
      const urid1 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        'Mumbai',
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp
      );
      
      const urid2 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        'Delhi',
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp
      );
      
      expect(urid1).not.toBe(urid2);
    });

    test('should normalize location consistently', () => {
      const urid1 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        'New Delhi',
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp
      );
      
      const urid2 = URIDService.generateURID(
        mockFamilyData.hashedAadhaar,
        'NEW DELHI',
        mockFamilyData.familySize,
        mockFamilyData.registrationTimestamp
      );
      
      expect(urid1).toBe(urid2);
    });
  });

  describe('validateURID', () => {
    test('should accept valid 16-character hex URID', () => {
      const validURID = 'A1B2C3D4E5F6G7H8';
      expect(URIDService.validateURID(validURID)).toBe(true);
    });

    test('should reject invalid URID formats', () => {
      expect(URIDService.validateURID('invalid')).toBe(false);
      expect(URIDService.validateURID('A1B2C3D4E5F6G7H')).toBe(false); // 15 chars
      expect(URIDService.validateURID('A1B2C3D4E5F6G7H89')).toBe(false); // 17 chars
      expect(URIDService.validateURID('a1b2c3d4e5f6g7h8')).toBe(false); // lowercase
      expect(URIDService.validateURID('G1H2I3J4K5L6M7N8')).toBe(false); // invalid hex chars
      expect(URIDService.validateURID('')).toBe(false); // empty
    });
  });

  describe('hashURID', () => {
    test('should generate consistent hash for same URID', () => {
      const urid = 'A1B2C3D4E5F6G7H8';
      const hash1 = URIDService.hashURID(urid);
      const hash2 = URIDService.hashURID(urid);
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex string
    });

    test('should generate different hashes for different URIDs', () => {
      const urid1 = 'A1B2C3D4E5F6G7H8';
      const urid2 = 'B1C2D3E4F5G6H7I8';
      
      const hash1 = URIDService.hashURID(urid1);
      const hash2 = URIDService.hashURID(urid2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateQRCode', () => {
    test('should generate valid QR code data URL', async () => {
      const urid = 'A1B2C3D4E5F6G7H8';
      const qrCode = await URIDService.generateQRCode(urid);
      
      expect(qrCode).toMatch(/^data:image\\/png;base64,/);
      expect(qrCode.length).toBeGreaterThan(100); // QR codes are substantial
    });

    test('should generate same QR code for same URID', async () => {
      const urid = 'A1B2C3D4E5F6G7H8';
      const qrCode1 = await URIDService.generateQRCode(urid);
      const qrCode2 = await URIDService.generateQRCode(urid);
      
      expect(qrCode1).toBe(qrCode2);
    });

    test('should handle QR code generation errors', async () => {
      // Test with invalid input that might cause QR generation to fail
      const invalidURID = '';
      
      await expect(URIDService.generateQRCode(invalidURID))
        .rejects
        .toThrow('Failed to generate QR code for URID');
    });
  });

  describe('generateURIDPackage', () => {
    test('should generate complete URID package', async () => {
      const result = await URIDService.generateURIDPackage(mockFamilyData);
      
      expect(result.urid).toMatch(/^[A-F0-9]{16}$/);
      expect(result.qrCodeDataURL).toMatch(/^data:image\\/png;base64,/);
      expect(result.uridHash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should generate consistent package for same family data', async () => {
      const result1 = await URIDService.generateURIDPackage(mockFamilyData);
      const result2 = await URIDService.generateURIDPackage(mockFamilyData);
      
      expect(result1.urid).toBe(result2.urid);
      expect(result1.qrCodeDataURL).toBe(result2.qrCodeDataURL);
      expect(result1.uridHash).toBe(result2.uridHash);
    });
  });

  describe('parseURID', () => {
    test('should correctly parse valid URID', () => {
      const validURID = 'A1B2C3D4E5F6G7H8';
      const parseResult = URIDService.parseURID(validURID);
      
      expect(parseResult.isValid).toBe(true);
      expect(parseResult.length).toBe(16);
      expect(parseResult.format).toBe('hex');
    });

    test('should correctly parse invalid URID', () => {
      const invalidURID = 'invalid-urid';
      const parseResult = URIDService.parseURID(invalidURID);
      
      expect(parseResult.isValid).toBe(false);
      expect(parseResult.length).toBe(12);
      expect(parseResult.format).toBe('invalid');
    });
  });

  describe('storeURIDMapping', () => {
    test('should store URID mapping without errors', async () => {
      const urid = 'A1B2C3D4E5F6G7H8';
      
      // Should not throw any errors
      await expect(URIDService.storeURIDMapping(urid, mockFamilyData))
        .resolves
        .toBeUndefined();
    });
  });

  describe('checkURIDExists', () => {
    test('should return false for demo implementation', async () => {
      const urid = 'A1B2C3D4E5F6G7H8';
      const exists = await URIDService.checkURIDExists(urid);
      
      expect(exists).toBe(false);
    });
  });

  describe('generateUniqueURID', () => {
    test('should generate unique URID with collision detection', async () => {
      const result = await URIDService.generateUniqueURID(mockFamilyData);
      
      expect(result.urid).toMatch(/^[A-F0-9]{16}$/);
      expect(result.qrCodeDataURL).toMatch(/^data:image\\/png;base64,/);
      expect(result.uridHash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should handle collision detection attempts', async () => {
      // Mock checkURIDExists to return true for first few attempts
      const originalCheckURIDExists = URIDService.checkURIDExists;
      let attemptCount = 0;
      
      URIDService.checkURIDExists = jest.fn().mockImplementation(async () => {
        attemptCount++;
        return attemptCount <= 2; // Return true for first 2 attempts, false after
      });
      
      const result = await URIDService.generateUniqueURID(mockFamilyData);
      
      expect(result.urid).toMatch(/^[A-F0-9]{16}$/);
      expect(URIDService.checkURIDExists).toHaveBeenCalledTimes(3);
      
      // Restore original function
      URIDService.checkURIDExists = originalCheckURIDExists;
    });
  });

  describe('Integration Tests', () => {
    test('should complete full URID generation workflow', async () => {
      // Test the complete workflow from family data to final URID
      const familyData: FamilyData = {
        hashedAadhaar: 'test-hashed-aadhaar-123',
        location: 'Maharashtra',
        familySize: 5,
        contactInfo: '+919123456789',
        registrationTimestamp: Date.now()
      };
      
      // Generate URID package
      const result = await URIDService.generateUniqueURID(familyData);
      
      // Validate all components
      expect(URIDService.validateURID(result.urid)).toBe(true);
      expect(result.qrCodeDataURL).toMatch(/^data:image\\/png;base64,/);
      expect(result.uridHash).toMatch(/^[a-f0-9]{64}$/);
      
      // Verify hash consistency
      const manualHash = URIDService.hashURID(result.urid);
      expect(result.uridHash).toBe(manualHash);
      
      // Store mapping
      await URIDService.storeURIDMapping(result.urid, familyData);
      
      // Verify parse result
      const parseResult = URIDService.parseURID(result.urid);
      expect(parseResult.isValid).toBe(true);
    });

    test('should handle edge cases gracefully', async () => {
      const edgeCaseFamilyData: FamilyData = {
        hashedAadhaar: '1',
        location: 'A',
        familySize: 1,
        contactInfo: '1',
        registrationTimestamp: 1
      };
      
      const result = await URIDService.generateUniqueURID(edgeCaseFamilyData);
      
      expect(URIDService.validateURID(result.urid)).toBe(true);
      expect(result.qrCodeDataURL).toMatch(/^data:image\\/png;base64,/);
    });
  });
});

// Mock QRCode module
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockImplementation((text) => {
    if (!text) {
      throw new Error('Invalid input');
    }
    return Promise.resolve(`data:image/png;base64,mock-qr-code-for-${text}`);
  })
}));"}