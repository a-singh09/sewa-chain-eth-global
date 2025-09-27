import crypto from 'crypto';
import QRCode from 'qrcode';

export interface FamilyData {
  hashedAadhaar: string;
  location: string;
  familySize: number;
  contactInfo: string;
  registrationTimestamp: number;
}

export interface URIDGenerationResult {
  urid: string;
  qrCodeDataURL: string;
  uridHash: string;
}

export class URIDService {
  /**
   * Generate a unique URID based on family data
   * Uses deterministic algorithm for consistent generation
   */
  static generateURID(
    hashedAadhaar: string,
    location: string,
    familySize: number,
    timestamp?: number
  ): string {
    const normalizedLocation = this.normalizeLocation(location);
    const timestampStr = (timestamp || Date.now()).toString();
    
    // Create deterministic URID from hash components
    const uridData = `${hashedAadhaar}-${normalizedLocation}-${familySize}-${timestampStr}`;
    
    // Generate SHA-256 hash and take first 16 characters as hex
    const hash = crypto.createHash('sha256').update(uridData).digest('hex');
    return hash.substring(0, 16).toUpperCase();
  }

  /**
   * Generate QR code for URID with error correction
   */
  static async generateQRCode(urid: string): Promise<string> {
    try {
      // Generate QR code with high error correction level
      const qrCodeDataURL = await QRCode.toDataURL(urid, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('QR code generation failed:', error);
      throw new Error('Failed to generate QR code for URID');
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
   */
  static hashURID(urid: string): string {
    return crypto.createHash('sha256').update(urid).digest('hex');
  }

  /**
   * Generate complete URID package (URID + QR code + hash)
   */
  static async generateURIDPackage(familyData: FamilyData): Promise<URIDGenerationResult> {
    // Generate the URID
    const urid = this.generateURID(
      familyData.hashedAadhaar,
      familyData.location,
      familyData.familySize,
      familyData.registrationTimestamp
    );

    // Generate QR code
    const qrCodeDataURL = await this.generateQRCode(urid);

    // Generate hash for blockchain
    const uridHash = this.hashURID(urid);

    return {
      urid,
      qrCodeDataURL,
      uridHash
    };
  }

  /**
   * Store URID mapping in database (mock implementation)
   */
  static async storeURIDMapping(urid: string, familyData: FamilyData): Promise<void> {
    // In production, this would store in PostgreSQL
    // For demo purposes, we'll log the data
    console.log('Storing URID mapping:', {
      urid,
      hashedAadhaar: familyData.hashedAadhaar,
      location: familyData.location,
      familySize: familyData.familySize,
      contactInfo: this.maskContactInfo(familyData.contactInfo),
      registrationTimestamp: familyData.registrationTimestamp
    });

    // Mock database storage
    return Promise.resolve();
  }

  /**
   * Normalize location string for consistent URID generation
   */
  private static normalizeLocation(location: string): string {
    return location
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .substring(0, 20); // Limit length
  }

  /**
   * Mask contact information for logging
   */
  private static maskContactInfo(contactInfo: string): string {
    if (contactInfo.length <= 4) return '***';
    
    const start = contactInfo.substring(0, 2);
    const end = contactInfo.substring(contactInfo.length - 2);
    const middle = '*'.repeat(contactInfo.length - 4);
    
    return `${start}${middle}${end}`;
  }

  /**
   * Check if URID already exists (mock implementation)
   */
  static async checkURIDExists(urid: string): Promise<boolean> {
    // In production, this would query the database
    // For demo purposes, return false (URID is unique)
    return Promise.resolve(false);
  }

  /**
   * Generate URID with collision detection
   */
  static async generateUniqueURID(familyData: FamilyData): Promise<URIDGenerationResult> {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        // Add attempt counter to timestamp for uniqueness
        const timestampWithAttempt = familyData.registrationTimestamp + attempts;
        
        const modifiedFamilyData = {
          ...familyData,
          registrationTimestamp: timestampWithAttempt
        };

        const result = await this.generateURIDPackage(modifiedFamilyData);
        
        // Check if URID already exists
        const exists = await this.checkURIDExists(result.urid);
        
        if (!exists) {
          return result;
        }
        
        attempts++;
      } catch (error) {
        console.error(`URID generation attempt ${attempts + 1} failed:`, error);
        attempts++;
      }
    }

    throw new Error('Failed to generate unique URID after maximum attempts');
  }

  /**
   * Parse URID components (for debugging)
   */
  static parseURID(urid: string): { isValid: boolean; length: number; format: string } {
    return {
      isValid: this.validateURID(urid),
      length: urid.length,
      format: urid.match(/^[A-F0-9]+$/) ? 'hex' : 'invalid'
    };
  }
}