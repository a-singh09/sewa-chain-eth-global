import * as crypto from "crypto";
import * as QRCode from "qrcode";

export interface FamilyData {
  hashedAadhaar: string;
  location: string;
  familySize: number;
  contactInfo: string;
  registrationTimestamp: number;
}

export interface AadhaarVerifiedFamilyData extends FamilyData {
  credentialSubject: {
    nationality: string;
    gender: string;
    minimumAge: boolean;
  };
  verificationTimestamp: number;
}

export interface URIDGenerationResult {
  urid: string;
  qrCodeDataURL: string;
  uridHash: string;
}

export interface URIDCollisionInfo {
  attempts: number;
  finalTimestamp: number;
  collisionDetected: boolean;
}

export class URIDService {
  // In-memory storage for demo purposes (production would use database)
  private static uridRegistry = new Set<string>();
  private static aadhaarRegistry = new Map<string, string>(); // hashedAadhaar -> URID mapping

  /**
   * Generate a unique URID based on family data
   * Supports both legacy format and Aadhaar-verified format
   */
  static generateURID(
    hashedAadhaar: string,
    location: string,
    familySize: number,
    credentialSubjectOrTimestamp?:
      | {
          nationality: string;
          gender: string;
          minimumAge: boolean;
        }
      | number,
    timestamp?: number,
  ): string {
    const normalizedLocation = this.normalizeLocation(location);

    // Handle backward compatibility - if credentialSubjectOrTimestamp is a number, it's the old API
    let credentialSubject: {
      nationality: string;
      gender: string;
      minimumAge: boolean;
    } | null = null;
    let actualTimestamp: number;

    if (typeof credentialSubjectOrTimestamp === "number") {
      // Legacy API: generateURID(hashedAadhaar, location, familySize, timestamp)
      actualTimestamp = credentialSubjectOrTimestamp;
    } else if (
      credentialSubjectOrTimestamp &&
      typeof credentialSubjectOrTimestamp === "object"
    ) {
      // New API: generateURID(hashedAadhaar, location, familySize, credentialSubject, timestamp)
      credentialSubject = credentialSubjectOrTimestamp;
      actualTimestamp = timestamp || Date.now();
    } else {
      // Default case
      actualTimestamp = Date.now();
    }

    const timestampStr = actualTimestamp.toString();

    let uridData: string;

    if (credentialSubject) {
      // Create deterministic URID from Aadhaar-verified components
      // Include credential subject data for additional uniqueness and verification
      uridData = [
        hashedAadhaar, // Self Protocol privacy-preserving Aadhaar hash
        normalizedLocation,
        familySize.toString(),
        credentialSubject.nationality,
        credentialSubject.gender,
        credentialSubject.minimumAge ? "1" : "0",
        timestampStr,
      ].join("|");
    } else {
      // Legacy format for backward compatibility
      uridData = `${hashedAadhaar}-${normalizedLocation}-${familySize}-${timestampStr}`;
    }

    // Generate simple hash using browser-compatible method
    let hash = 0;
    for (let i = 0; i < uridData.length; i++) {
      const char = uridData.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to hex and take first 16 characters
    const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
    const timestampHex = Date.now().toString(16).slice(-8);
    return (hexHash + timestampHex).substring(0, 16).toUpperCase();
  }

  /**
   * Check if a family with the same Aadhaar is already registered
   * Prevents duplicate registrations using the same Aadhaar identity
   */
  static checkAadhaarDuplicate(hashedAadhaar: string): {
    isDuplicate: boolean;
    existingURID?: string;
  } {
    const existingURID = this.aadhaarRegistry.get(hashedAadhaar);
    return {
      isDuplicate: !!existingURID,
      existingURID,
    };
  }

  /**
   * Generate QR code for URID with enhanced mobile scanning optimization
   * Uses high error correction and optimal sizing for mobile cameras
   */
  static async generateQRCode(urid: string): Promise<string> {
    try {
      // Validate URID format before generating QR code
      if (!this.validateURID(urid)) {
        throw new Error(`Invalid URID format: ${urid}`);
      }

      // Generate QR code optimized for mobile scanning
      const qrCodeDataURL = await QRCode.toDataURL(urid, {
        errorCorrectionLevel: "H", // High error correction for damaged/dirty screens
        margin: 4, // Larger margin for better camera detection
        color: {
          dark: "#000000", // Pure black for maximum contrast
          light: "#FFFFFF", // Pure white background
        },
        width: 300, // Larger size for better mobile scanning
        scale: 8, // Higher scale for crisp rendering
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error("QR code generation failed:", error);
      throw new Error(
        `Failed to generate QR code for URID: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Validate URID format (16 character hex string)
   */
  static validateURID(urid: string): boolean {
    const uridRegex = /^[A-F0-9]{16}$/;
    return uridRegex.test(urid);
  }

  /**
   * Generate hash of URID for blockchain storage
   * Returns a 66-character hash (0x + 64 hex characters) compatible with Ethereum
   */
  static hashURID(urid: string): string {
    // Create a more robust hash using multiple rounds of simple hashing
    // This is browser-compatible and doesn't require crypto libraries

    let hash1 = 0;
    let hash2 = 0;

    // First hash pass
    for (let i = 0; i < urid.length; i++) {
      const char = urid.charCodeAt(i);
      hash1 = (hash1 << 5) - hash1 + char;
      hash1 = hash1 & hash1; // Convert to 32-bit integer
    }

    // Second hash pass with different seed
    const seed = urid + hash1.toString();
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash2 = (hash2 << 7) - hash2 + char;
      hash2 = hash2 & hash2; // Convert to 32-bit integer
    }

    // Combine hashes and extend to 64 characters
    const combinedHash =
      Math.abs(hash1).toString(16) + Math.abs(hash2).toString(16);

    // Extend to exactly 64 characters by repeating and truncating
    let extendedHash = combinedHash;
    while (extendedHash.length < 64) {
      extendedHash += combinedHash;
    }
    extendedHash = extendedHash.substring(0, 64);

    return `0x${extendedHash}`;
  }

  /**
   * Generate complete URID package with Aadhaar verification integration
   * Uses Self Protocol verified data for enhanced security and privacy
   */
  static async generateURIDPackage(
    familyData: AadhaarVerifiedFamilyData,
  ): Promise<URIDGenerationResult> {
    // Check for existing Aadhaar registration first
    const duplicateCheck = this.checkAadhaarDuplicate(familyData.hashedAadhaar);
    if (duplicateCheck.isDuplicate) {
      throw new Error(
        `Family already registered with URID: ${duplicateCheck.existingURID}`,
      );
    }

    // Generate the URID using Aadhaar-verified data
    const urid = this.generateURID(
      familyData.hashedAadhaar,
      familyData.location,
      familyData.familySize,
      familyData.credentialSubject,
      familyData.registrationTimestamp,
    );

    // Generate QR code optimized for mobile scanning
    const qrCodeDataURL = await this.generateQRCode(urid);

    // Generate hash for blockchain storage
    const uridHash = this.hashURID(urid);

    // Register the URID and Aadhaar mapping
    this.uridRegistry.add(urid);
    this.aadhaarRegistry.set(familyData.hashedAadhaar, urid);

    return {
      urid,
      qrCodeDataURL,
      uridHash,
    };
  }

  // In-memory storage for family data (demo purposes)
  private static familyDataRegistry = new Map<string, any>();

  /**
   * Store URID mapping with Aadhaar verification data (mock implementation)
   * In production, this would store in PostgreSQL with proper encryption
   */
  static async storeURIDMapping(
    urid: string,
    familyData: AadhaarVerifiedFamilyData & { [key: string]: any },
  ): Promise<void> {
    // In production, this would store in PostgreSQL with proper encryption
    // For demo purposes, we'll log the privacy-preserving data
    console.log("Storing Aadhaar-verified URID mapping:", {
      urid,
      hashedAadhaar: this.maskSensitiveData(familyData.hashedAadhaar),
      location: familyData.location,
      familySize: familyData.familySize,
      contactInfo: this.maskContactInfo(familyData.contactInfo),
      nationality: familyData.credentialSubject.nationality,
      minimumAge: familyData.credentialSubject.minimumAge,
      registrationTimestamp: familyData.registrationTimestamp,
      verificationTimestamp: familyData.verificationTimestamp,
    });

    // Store in in-memory registries for demo
    this.uridRegistry.add(urid);
    this.aadhaarRegistry.set(familyData.hashedAadhaar, urid);
    this.familyDataRegistry.set(urid, familyData);

    return Promise.resolve();
  }

  /**
   * Get family data by URID (for lookup purposes)
   */
  static async getFamilyData(
    urid: string,
  ): Promise<AadhaarVerifiedFamilyData | null> {
    return this.familyDataRegistry.get(urid) || null;
  }

  /**
   * Normalize location string for consistent URID generation
   */
  private static normalizeLocation(location: string): string {
    return location
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "") // Remove special characters
      .substring(0, 20); // Limit length
  }

  /**
   * Mask contact information for logging
   */
  private static maskContactInfo(contactInfo: string): string {
    if (contactInfo.length <= 4) return "***";

    const start = contactInfo.substring(0, 2);
    const end = contactInfo.substring(contactInfo.length - 2);
    const middle = "*".repeat(contactInfo.length - 4);

    return `${start}${middle}${end}`;
  }

  /**
   * Check if URID already exists in registry
   * Uses in-memory storage for demo (production would use database)
   */
  static async checkURIDExists(urid: string): Promise<boolean> {
    return Promise.resolve(this.uridRegistry.has(urid));
  }

  /**
   * Generate URID with Aadhaar-based collision detection
   * Implements robust collision handling with Aadhaar verification
   */
  static async generateUniqueURID(
    familyData: AadhaarVerifiedFamilyData,
  ): Promise<URIDGenerationResult & URIDCollisionInfo> {
    let attempts = 0;
    const maxAttempts = 5;
    let collisionDetected = false;

    // First check if this Aadhaar is already registered
    const duplicateCheck = this.checkAadhaarDuplicate(familyData.hashedAadhaar);
    if (duplicateCheck.isDuplicate) {
      throw new Error(
        `Family already registered with URID: ${duplicateCheck.existingURID}. Each Aadhaar can only be registered once.`,
      );
    }

    while (attempts < maxAttempts) {
      try {
        // Add attempt counter to timestamp for uniqueness in case of collision
        const timestampWithAttempt =
          familyData.registrationTimestamp + attempts;

        const modifiedFamilyData: AadhaarVerifiedFamilyData = {
          ...familyData,
          registrationTimestamp: timestampWithAttempt,
        };

        // Generate URID with modified timestamp
        const urid = this.generateURID(
          modifiedFamilyData.hashedAadhaar,
          modifiedFamilyData.location,
          modifiedFamilyData.familySize,
          modifiedFamilyData.credentialSubject,
          modifiedFamilyData.registrationTimestamp,
        );

        // Check if URID already exists
        const exists = await this.checkURIDExists(urid);

        if (!exists) {
          // Generate complete package
          const qrCodeDataURL = await this.generateQRCode(urid);
          const uridHash = this.hashURID(urid);

          // Register the URID and Aadhaar mapping
          this.uridRegistry.add(urid);
          this.aadhaarRegistry.set(familyData.hashedAadhaar, urid);

          return {
            urid,
            qrCodeDataURL,
            uridHash,
            attempts: attempts + 1,
            finalTimestamp: timestampWithAttempt,
            collisionDetected,
          };
        }

        collisionDetected = true;
        attempts++;
      } catch (error) {
        console.error(`URID generation attempt ${attempts + 1} failed:`, error);
        attempts++;
      }
    }

    throw new Error(
      `Failed to generate unique URID after ${maxAttempts} attempts. This may indicate a system issue.`,
    );
  }

  /**
   * Parse URID components (for debugging)
   */
  static parseURID(urid: string): {
    isValid: boolean;
    length: number;
    format: string;
  } {
    return {
      isValid: this.validateURID(urid),
      length: urid.length,
      format: urid.match(/^[A-F0-9]+$/) ? "hex" : "invalid",
    };
  }

  /**
   * Mask sensitive data for logging (enhanced privacy protection)
   */
  private static maskSensitiveData(data: string): string {
    if (data.length <= 8) return "***";

    const start = data.substring(0, 4);
    const end = data.substring(data.length - 4);
    const middle = "*".repeat(data.length - 8);

    return `${start}${middle}${end}`;
  }

  /**
   * Get URID by Aadhaar hash (for duplicate checking)
   */
  static getURIDByAadhaar(hashedAadhaar: string): string | undefined {
    return this.aadhaarRegistry.get(hashedAadhaar);
  }

  /**
   * Get registration statistics (for monitoring)
   */
  static getRegistrationStats(): {
    totalURIDs: number;
    totalAadhaarRegistrations: number;
    registrySize: number;
  } {
    return {
      totalURIDs: this.uridRegistry.size,
      totalAadhaarRegistrations: this.aadhaarRegistry.size,
      registrySize: this.uridRegistry.size,
    };
  }

  /**
   * Clear registries (for testing purposes only)
   */
  static clearRegistries(): void {
    this.uridRegistry.clear();
    this.aadhaarRegistry.clear();
    this.familyDataRegistry.clear();
    console.log("URID registries cleared (testing mode)");
  }

  /**
   * Validate Aadhaar verification data structure
   */
  static validateAadhaarVerificationData(
    data: any,
  ): data is AadhaarVerifiedFamilyData {
    return (
      data &&
      typeof data.hashedAadhaar === "string" &&
      typeof data.location === "string" &&
      typeof data.familySize === "number" &&
      typeof data.contactInfo === "string" &&
      typeof data.registrationTimestamp === "number" &&
      typeof data.verificationTimestamp === "number" &&
      data.credentialSubject &&
      typeof data.credentialSubject.nationality === "string" &&
      typeof data.credentialSubject.gender === "string" &&
      typeof data.credentialSubject.minimumAge === "boolean"
    );
  }
}
