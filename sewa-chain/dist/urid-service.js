"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URIDService = void 0;
const crypto = require("crypto");
const QRCode = require("qrcode");
class URIDService {
    /**
     * Generate a unique URID based on Aadhaar-verified family data
     * Uses Self Protocol hashed Aadhaar identifiers for privacy and uniqueness
     */
    static generateURID(hashedAadhaar, location, familySize, credentialSubject, timestamp) {
        const normalizedLocation = this.normalizeLocation(location);
        const timestampStr = (timestamp || Date.now()).toString();
        // Create deterministic URID from Aadhaar-verified components
        // Include credential subject data for additional uniqueness and verification
        const uridData = [
            hashedAadhaar, // Self Protocol privacy-preserving Aadhaar hash
            normalizedLocation,
            familySize.toString(),
            credentialSubject.nationality,
            credentialSubject.gender,
            credentialSubject.minimumAge ? "1" : "0",
            timestampStr,
        ].join("|");
        // Generate SHA-256 hash and take first 16 characters as hex
        const hash = crypto.createHash("sha256").update(uridData).digest("hex");
        return hash.substring(0, 16).toUpperCase();
    }
    /**
     * Check if a family with the same Aadhaar is already registered
     * Prevents duplicate registrations using the same Aadhaar identity
     */
    static checkAadhaarDuplicate(hashedAadhaar) {
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
    static async generateQRCode(urid) {
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
        }
        catch (error) {
            console.error("QR code generation failed:", error);
            throw new Error(`Failed to generate QR code for URID: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Validate URID format (16 character hex string)
     */
    static validateURID(urid) {
        const uridRegex = /^[A-F0-9]{16}$/;
        return uridRegex.test(urid);
    }
    /**
     * Generate hash of URID for blockchain storage
     */
    static hashURID(urid) {
        return crypto.createHash("sha256").update(urid).digest("hex");
    }
    /**
     * Generate complete URID package with Aadhaar verification integration
     * Uses Self Protocol verified data for enhanced security and privacy
     */
    static async generateURIDPackage(familyData) {
        // Check for existing Aadhaar registration first
        const duplicateCheck = this.checkAadhaarDuplicate(familyData.hashedAadhaar);
        if (duplicateCheck.isDuplicate) {
            throw new Error(`Family already registered with URID: ${duplicateCheck.existingURID}`);
        }
        // Generate the URID using Aadhaar-verified data
        const urid = this.generateURID(familyData.hashedAadhaar, familyData.location, familyData.familySize, familyData.credentialSubject, familyData.registrationTimestamp);
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
    /**
     * Store URID mapping with Aadhaar verification data (mock implementation)
     * In production, this would store in PostgreSQL with proper encryption
     */
    static async storeURIDMapping(urid, familyData) {
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
        return Promise.resolve();
    }
    /**
     * Normalize location string for consistent URID generation
     */
    static normalizeLocation(location) {
        return location
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, "") // Remove special characters
            .substring(0, 20); // Limit length
    }
    /**
     * Mask contact information for logging
     */
    static maskContactInfo(contactInfo) {
        if (contactInfo.length <= 4)
            return "***";
        const start = contactInfo.substring(0, 2);
        const end = contactInfo.substring(contactInfo.length - 2);
        const middle = "*".repeat(contactInfo.length - 4);
        return `${start}${middle}${end}`;
    }
    /**
     * Check if URID already exists in registry
     * Uses in-memory storage for demo (production would use database)
     */
    static async checkURIDExists(urid) {
        return Promise.resolve(this.uridRegistry.has(urid));
    }
    /**
     * Generate URID with Aadhaar-based collision detection
     * Implements robust collision handling with Aadhaar verification
     */
    static async generateUniqueURID(familyData) {
        let attempts = 0;
        const maxAttempts = 5;
        let collisionDetected = false;
        // First check if this Aadhaar is already registered
        const duplicateCheck = this.checkAadhaarDuplicate(familyData.hashedAadhaar);
        if (duplicateCheck.isDuplicate) {
            throw new Error(`Family already registered with URID: ${duplicateCheck.existingURID}. Each Aadhaar can only be registered once.`);
        }
        while (attempts < maxAttempts) {
            try {
                // Add attempt counter to timestamp for uniqueness in case of collision
                const timestampWithAttempt = familyData.registrationTimestamp + attempts;
                const modifiedFamilyData = {
                    ...familyData,
                    registrationTimestamp: timestampWithAttempt,
                };
                // Generate URID with modified timestamp
                const urid = this.generateURID(modifiedFamilyData.hashedAadhaar, modifiedFamilyData.location, modifiedFamilyData.familySize, modifiedFamilyData.credentialSubject, modifiedFamilyData.registrationTimestamp);
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
            }
            catch (error) {
                console.error(`URID generation attempt ${attempts + 1} failed:`, error);
                attempts++;
            }
        }
        throw new Error(`Failed to generate unique URID after ${maxAttempts} attempts. This may indicate a system issue.`);
    }
    /**
     * Parse URID components (for debugging)
     */
    static parseURID(urid) {
        return {
            isValid: this.validateURID(urid),
            length: urid.length,
            format: urid.match(/^[A-F0-9]+$/) ? "hex" : "invalid",
        };
    }
    /**
     * Mask sensitive data for logging (enhanced privacy protection)
     */
    static maskSensitiveData(data) {
        if (data.length <= 8)
            return "***";
        const start = data.substring(0, 4);
        const end = data.substring(data.length - 4);
        const middle = "*".repeat(data.length - 8);
        return `${start}${middle}${end}`;
    }
    /**
     * Get URID by Aadhaar hash (for duplicate checking)
     */
    static getURIDByAadhaar(hashedAadhaar) {
        return this.aadhaarRegistry.get(hashedAadhaar);
    }
    /**
     * Get registration statistics (for monitoring)
     */
    static getRegistrationStats() {
        return {
            totalURIDs: this.uridRegistry.size,
            totalAadhaarRegistrations: this.aadhaarRegistry.size,
            registrySize: this.uridRegistry.size,
        };
    }
    /**
     * Clear registries (for testing purposes only)
     */
    static clearRegistries() {
        this.uridRegistry.clear();
        this.aadhaarRegistry.clear();
        console.log("URID registries cleared (testing mode)");
    }
    /**
     * Validate Aadhaar verification data structure
     */
    static validateAadhaarVerificationData(data) {
        return (data &&
            typeof data.hashedAadhaar === "string" &&
            typeof data.location === "string" &&
            typeof data.familySize === "number" &&
            typeof data.contactInfo === "string" &&
            typeof data.registrationTimestamp === "number" &&
            typeof data.verificationTimestamp === "number" &&
            data.credentialSubject &&
            typeof data.credentialSubject.nationality === "string" &&
            typeof data.credentialSubject.gender === "string" &&
            typeof data.credentialSubject.minimumAge === "boolean");
    }
}
exports.URIDService = URIDService;
// In-memory storage for demo purposes (production would use database)
URIDService.uridRegistry = new Set();
URIDService.aadhaarRegistry = new Map(); // hashedAadhaar -> URID mapping
