import {
  ISuccessResult,
  IVerifyResponse,
  verifyCloudProof,
} from '@worldcoin/minikit-js';
import { NextRequest, NextResponse } from 'next/server';
import { 
  VerifyVolunteerRequest, 
  VerifyVolunteerResponse,
  VolunteerSession,
  VerificationLevel,
  VolunteerPermission
} from '@/types';
import { sign } from 'jsonwebtoken';

// In-memory storage for demo purposes - replace with database in production
const registeredVolunteers = new Set<string>();
const volunteerSessions = new Map<string, VolunteerSession>();

/**
 * Volunteer World ID Verification Route
 * Handles Orb-level verification for volunteers with session management
 */
export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as VerifyVolunteerRequest;
    
    if (action !== 'verify-volunteer') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Invalid action for volunteer verification'
        }
      } as VerifyVolunteerResponse, { status: 400 });
    }

    const app_id = process.env.NEXT_PUBLIC_APP_ID as `app_${string}`;
    
    if (!app_id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'App ID not configured'
        }
      } as VerifyVolunteerResponse, { status: 500 });
    }

    // Verify the proof using World ID
    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal,
    )) as IVerifyResponse;

    if (!verifyRes.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PROOF',
          message: 'World ID verification failed'
        }
      } as VerifyVolunteerResponse, { status: 400 });
    }

    const nullifierHash = payload.nullifier_hash;
    
    // Check if this nullifier is already registered (prevent duplicate registrations)
    if (registeredVolunteers.has(nullifierHash)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALREADY_REGISTERED',
          message: 'This identity is already registered as a volunteer'
        }
      } as VerifyVolunteerResponse, { status: 409 });
    }

    // Create volunteer session
    const now = Date.now();
    const sessionToken = sign(
      { 
        nullifierHash, 
        volunteerId: generateVolunteerId(nullifierHash),
        iat: Math.floor(now / 1000)
      },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '24h' }
    );

    const volunteerSession: VolunteerSession = {
      nullifierHash,
      sessionToken,
      verificationLevel: VerificationLevel.Orb,
      timestamp: now,
      volunteerId: generateVolunteerId(nullifierHash),
      permissions: [
        VolunteerPermission.DISTRIBUTE_AID,
        VolunteerPermission.VERIFY_BENEFICIARIES,
        VolunteerPermission.VIEW_DISTRIBUTION_DATA
      ],
      expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours
      verifiedAt: now
    };

    // Store volunteer registration and session
    registeredVolunteers.add(nullifierHash);
    volunteerSessions.set(sessionToken, volunteerSession);

    console.log(`New volunteer registered: ${volunteerSession.volunteerId}`);

    return NextResponse.json({
      success: true,
      volunteerSession
    } as VerifyVolunteerResponse, { status: 200 });

  } catch (error) {
    console.error('Volunteer verification error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'VERIFICATION_FAILED',
        message: 'Internal server error during verification'
      }
    } as VerifyVolunteerResponse, { status: 500 });
  }
}

/**
 * Generate a unique volunteer ID from nullifier hash
 */
function generateVolunteerId(nullifierHash: string): string {
  // Use first 8 characters of nullifier hash for volunteer ID
  return `VOL_${nullifierHash.slice(0, 8).toUpperCase()}`;
}

/**
 * GET endpoint to check volunteer session status
 */
export async function GET(req: NextRequest) {
  const sessionToken = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return NextResponse.json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'No session token provided' }
    }, { status: 401 });
  }

  const session = volunteerSessions.get(sessionToken);
  
  if (!session || session.expiresAt < Date.now()) {
    return NextResponse.json({
      success: false,
      error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' }
    }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    volunteerSession: session
  });
}