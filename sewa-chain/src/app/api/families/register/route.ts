import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/services/ContractService';
import { URIDService } from '@/lib/urid-service';
import type { DistributionParams } from '@/types';

export interface RegisterFamilyRequest {
  volunteerSession: string;
  familyDetails: {
    headOfFamily: string;
    familySize: number;
    location: string;
    contactNumber: string;
  };
  aadhaarProof: {
    hashedIdentifier: string;
    credentialSubject?: any;
  };
}

export interface RegisterFamilyResponse {
  success: boolean;
  urid?: string;
  uridHash?: string;
  qrCodeDataURL?: string;
  transactionHash?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Family Registration API Route
 * Integrates URID generation with smart contract registration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RegisterFamilyRequest;
    
    // Validate required fields
    if (!body.volunteerSession || !body.familyDetails || !body.aadhaarProof) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: volunteerSession, familyDetails, aadhaarProof'
        }
      } as RegisterFamilyResponse, { status: 400 });
    }

    const { familyDetails, aadhaarProof } = body;

    // Validate family details
    if (!familyDetails.headOfFamily || !familyDetails.location || !familyDetails.contactNumber) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_FAMILY_DETAILS',
          message: 'Missing family details: headOfFamily, location, contactNumber required'
        }
      } as RegisterFamilyResponse, { status: 400 });
    }

    if (familyDetails.familySize < 1 || familyDetails.familySize > 20) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_FAMILY_SIZE',
          message: 'Family size must be between 1 and 20'
        }
      } as RegisterFamilyResponse, { status: 400 });
    }

    // Validate Aadhaar proof
    if (!aadhaarProof.hashedIdentifier) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_AADHAAR_PROOF',
          message: 'Aadhaar verification required - hashedIdentifier missing'
        }
      } as RegisterFamilyResponse, { status: 400 });
    }

    // TODO: Validate volunteer session
    // const volunteerValid = await validateVolunteerSession(body.volunteerSession);
    // if (!volunteerValid) {
    //   return NextResponse.json({
    //     success: false,
    //     error: {
    //       code: 'INVALID_VOLUNTEER',
    //       message: 'Invalid volunteer session'
    //     }
    //   } as RegisterFamilyResponse, { status: 401 });
    // }

    // Generate URID
    const familyData = {
      hashedAadhaar: aadhaarProof.hashedIdentifier,
      location: familyDetails.location.trim(),
      familySize: familyDetails.familySize,
      contactInfo: familyDetails.contactNumber.trim(),
      registrationTimestamp: Date.now()
    };

    const uridResult = await URIDService.generateUniqueURID(familyData);
    
    // Register family on smart contract
    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );

    const registrationResult = await contractService.registerFamily(
      uridResult.uridHash,
      familyDetails.familySize
    );

    if (!registrationResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CONTRACT_ERROR',
          message: registrationResult.error || 'Smart contract registration failed'
        }
      } as RegisterFamilyResponse, { status: 500 });
    }

    // Store URID mapping in local database
    await URIDService.storeURIDMapping(uridResult.urid, {
      ...familyData,
      headOfFamily: familyDetails.headOfFamily,
      transactionHash: registrationResult.transactionHash,
      registeredAt: new Date().toISOString()
    });

    console.log('Family registered successfully:', {
      urid: uridResult.urid,
      familySize: familyDetails.familySize,
      location: familyDetails.location,
      transactionHash: registrationResult.transactionHash,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      urid: uridResult.urid,
      uridHash: uridResult.uridHash,
      qrCodeDataURL: uridResult.qrCodeDataURL,
      transactionHash: registrationResult.transactionHash
    } as RegisterFamilyResponse, { status: 200 });

  } catch (error) {
    console.error('Family registration error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during family registration'
      }
    } as RegisterFamilyResponse, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve family registration status
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const urid = url.searchParams.get('urid');
  const uridHash = url.searchParams.get('uridHash');
  
  if (!urid && !uridHash) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'MISSING_IDENTIFIER',
        message: 'Either URID or URID hash is required'
      }
    }, { status: 400 });
  }

  try {
    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );

    let queryHash = uridHash;
    if (urid && !uridHash) {
      queryHash = URIDService.hashURID(urid);
    }

    if (!queryHash) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_IDENTIFIER',
          message: 'Invalid URID or URID hash format'
        }
      }, { status: 400 });
    }

    // Get family info from contract
    const familyInfo = await contractService.getFamilyInfo(queryHash);
    
    if (!familyInfo) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FAMILY_NOT_FOUND',
          message: 'Family not found in registry'
        }
      }, { status: 404 });
    }

    // Get local family data if available
    let localData = null;
    if (urid) {
      localData = await URIDService.getFamilyData(urid);
    }

    return NextResponse.json({
      success: true,
      familyInfo,
      localData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Family lookup error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'LOOKUP_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during family lookup'
      }
    }, { status: 500 });
  }
}