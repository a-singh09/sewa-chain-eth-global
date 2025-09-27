import { NextRequest, NextResponse } from 'next/server';
import { SelfBackendVerifier } from '@selfxyz/core';

export interface AadhaarVerificationRequest {
  attestationId: string;
  proof: object;
  publicSignals: string[];
  userContextData: {
    familySize: number;
    location: string;
    contactInfo: string;
  };
}

export interface AadhaarVerificationResponse {
  status: 'success' | 'error';
  result: boolean;
  hashedIdentifier?: string;
  credentialSubject?: {
    nationality: string;
    gender: string;
    minimumAge: boolean;
  };
  message?: string;
}

/**
 * Aadhaar Verification Route using Self Protocol
 * Handles privacy-preserving Aadhaar verification and generates hashed identifiers
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as AadhaarVerificationRequest;
    
    // Validate required fields
    if (!body.attestationId || !body.proof || !body.publicSignals) {
      return NextResponse.json({
        status: 'error',
        result: false,
        message: 'Missing required verification data'
      } as AadhaarVerificationResponse, { status: 400 });
    }

    // Initialize Self Protocol backend verifier
    const selfVerifier = new SelfBackendVerifier({
      scope: process.env.SELF_BACKEND_SCOPE || 'sewachain-aadhaar',
      apiKey: process.env.SELF_API_KEY
    });

    // Verify the proof from Self Protocol
    const verificationResult = await selfVerifier.verifyProof({
      attestationId: body.attestationId,
      proof: body.proof,
      publicSignals: body.publicSignals
    });

    if (!verificationResult.isValid) {
      return NextResponse.json({
        status: 'error',
        result: false,
        message: 'Invalid Aadhaar verification proof'
      } as AadhaarVerificationResponse, { status: 400 });
    }

    // Extract credential subject from verification result
    const credentialSubject = verificationResult.credentialSubject;
    
    // Generate hashed identifier from the proof (no raw Aadhaar data)
    const hashedIdentifier = generateHashedIdentifier(
      body.publicSignals,
      body.userContextData.location
    );

    // Log successful verification (for demo purposes)
    console.log('Aadhaar verification successful:', {
      hashedIdentifier,
      location: body.userContextData.location,
      familySize: body.userContextData.familySize,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      status: 'success',
      result: true,
      hashedIdentifier,
      credentialSubject: {
        nationality: credentialSubject?.nationality || 'IN',
        gender: credentialSubject?.gender || 'M',
        minimumAge: credentialSubject?.minimumAge || true
      }
    } as AadhaarVerificationResponse, { status: 200 });

  } catch (error) {
    console.error('Aadhaar verification error:', error);
    
    return NextResponse.json({
      status: 'error',
      result: false,
      message: 'Internal server error during Aadhaar verification'
    } as AadhaarVerificationResponse, { status: 500 });
  }
}

/**
 * Generate hashed identifier from public signals and location
 * This ensures privacy while creating a unique family identifier
 */
function generateHashedIdentifier(publicSignals: string[], location: string): string {
  const crypto = require('crypto');
  
  // Combine relevant public signals with location for uniqueness
  const identifierData = `${publicSignals.join('')}-${location}-${Date.now()}`;
  
  // Generate SHA-256 hash and take first 16 characters
  return crypto
    .createHash('sha256')
    .update(identifierData)
    .digest('hex')
    .substring(0, 16);
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'Aadhaar verification endpoint is running',
    timestamp: new Date().toISOString()
  });
}