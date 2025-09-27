import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/services/ContractService';
import { URIDService } from '@/lib/urid-service';
import type { AidType, DistributionParams } from '@/types';

export interface RecordDistributionRequest {
  urid?: string;
  uridHash?: string;
  volunteerSession: string;
  distribution: {
    aidType: AidType;
    quantity: number;
    location: string;
    notes?: string;
  };
}

export interface RecordDistributionResponse {
  success: boolean;
  distributionId?: string;
  transactionHash?: string;
  nextEligibleTime?: number;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Distribution Recording API Route
 * Records aid distribution on smart contract with eligibility checks
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RecordDistributionRequest;
    
    // Validate required fields
    if (!body.volunteerSession || !body.distribution) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: volunteerSession, distribution'
        }
      } as RecordDistributionResponse, { status: 400 });
    }

    if (!body.urid && !body.uridHash) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_IDENTIFIER',
          message: 'Either URID or URID hash is required'
        }
      } as RecordDistributionResponse, { status: 400 });
    }

    const { distribution } = body;

    // Validate distribution details
    if (!distribution.aidType || !distribution.quantity || !distribution.location) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_DISTRIBUTION',
          message: 'Missing distribution details: aidType, quantity, location required'
        }
      } as RecordDistributionResponse, { status: 400 });
    }

    if (distribution.quantity <= 0 || distribution.quantity > 1000000) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_QUANTITY',
          message: 'Quantity must be between 1 and 1,000,000'
        }
      } as RecordDistributionResponse, { status: 400 });
    }

    if (distribution.location.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_LOCATION',
          message: 'Location cannot be empty'
        }
      } as RecordDistributionResponse, { status: 400 });
    }

    // Validate aid type
    const validAidTypes = ['FOOD', 'MEDICAL', 'SHELTER', 'CLOTHING', 'WATER', 'CASH'];
    if (!validAidTypes.includes(distribution.aidType)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_AID_TYPE',
          message: `Invalid aid type. Must be one of: ${validAidTypes.join(', ')}`
        }
      } as RecordDistributionResponse, { status: 400 });
    }

    // TODO: Validate volunteer session and extract nullifier
    // const volunteerData = await validateVolunteerSession(body.volunteerSession);
    // if (!volunteerData) {
    //   return NextResponse.json({
    //     success: false,
    //     error: {
    //       code: 'INVALID_VOLUNTEER',
    //       message: 'Invalid volunteer session'
    //     }
    //   } as RecordDistributionResponse, { status: 401 });
    // }
    
    // Mock volunteer nullifier for now
    const volunteerNullifier = '0x' + Buffer.from('mock_volunteer_' + Date.now()).toString('hex').padStart(64, '0');

    // Get URID hash
    let uridHash = body.uridHash;
    if (body.urid && !uridHash) {
      if (!URIDService.validateURID(body.urid)) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_URID_FORMAT',
            message: 'Invalid URID format'
          }
        } as RecordDistributionResponse, { status: 400 });
      }
      uridHash = URIDService.hashURID(body.urid);
    }

    if (!uridHash || uridHash === '0x' || uridHash.length !== 66) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_HASH_FORMAT',
          message: 'Invalid URID hash format'
        }
      } as RecordDistributionResponse, { status: 400 });
    }

    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );

    // Validate family exists and is active
    const isValidFamily = await contractService.validateFamily(uridHash);
    if (!isValidFamily) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FAMILY_NOT_FOUND',
          message: 'Family not found or inactive'
        }
      } as RecordDistributionResponse, { status: 404 });
    }

    // Check eligibility (cooldown period)
    const eligibility = await contractService.checkEligibility(uridHash, distribution.aidType);
    if (!eligibility.eligible) {
      const hoursRemaining = Math.ceil(eligibility.timeUntilEligible / 3600);
      const nextEligibleTime = Date.now() + (eligibility.timeUntilEligible * 1000);
      
      return NextResponse.json({
        success: false,
        nextEligibleTime,
        error: {
          code: 'NOT_ELIGIBLE',
          message: `Family not eligible for ${distribution.aidType}. Please wait ${hoursRemaining} hours.`
        }
      } as RecordDistributionResponse, { status: 409 });
    }

    // Record distribution on smart contract
    const distributionParams: DistributionParams = {
      uridHash,
      volunteerNullifier,
      aidType: distribution.aidType,
      quantity: distribution.quantity,
      location: distribution.location.trim()
    };

    const result = await contractService.recordDistribution(distributionParams);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CONTRACT_ERROR',
          message: result.error || 'Smart contract recording failed'
        }
      } as RecordDistributionResponse, { status: 500 });
    }

    // Generate distribution ID from transaction hash
    const distributionId = result.transactionHash?.substring(0, 18) || 
      'DIST_' + Math.random().toString(36).substring(2, 12).toUpperCase();

    // Store additional distribution metadata locally if needed
    try {
      await storeDistributionMetadata({
        distributionId,
        urid: body.urid,
        uridHash,
        transactionHash: result.transactionHash,
        volunteerSession: body.volunteerSession,
        notes: distribution.notes,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to store local metadata:', error);
      // Continue even if local storage fails
    }

    console.log('Distribution recorded successfully:', {
      distributionId,
      urid: body.urid || 'N/A',
      aidType: distribution.aidType,
      quantity: distribution.quantity,
      location: distribution.location,
      transactionHash: result.transactionHash,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      distributionId,
      transactionHash: result.transactionHash
    } as RecordDistributionResponse, { status: 200 });

  } catch (error) {
    console.error('Distribution recording error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'RECORDING_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during distribution recording'
      }
    } as RecordDistributionResponse, { status: 500 });
  }
}

/**
 * GET endpoint to check distribution eligibility
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const urid = url.searchParams.get('urid');
  const uridHash = url.searchParams.get('uridHash');
  const aidType = url.searchParams.get('aidType') as AidType;
  
  if (!urid && !uridHash) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'MISSING_IDENTIFIER',
        message: 'Either URID or URID hash is required'
      }
    }, { status: 400 });
  }

  if (!aidType) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'MISSING_AID_TYPE',
        message: 'Aid type is required'
      }
    }, { status: 400 });
  }

  try {
    let queryHash = uridHash;
    if (urid && !uridHash) {
      if (!URIDService.validateURID(urid)) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_URID_FORMAT',
            message: 'Invalid URID format'
          }
        }, { status: 400 });
      }
      queryHash = URIDService.hashURID(urid);
    }

    if (!queryHash) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_HASH_FORMAT',
          message: 'Invalid URID hash format'
        }
      }, { status: 400 });
    }

    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );

    const eligibility = await contractService.checkEligibility(queryHash, aidType);
    
    return NextResponse.json({
      success: true,
      eligible: eligibility.eligible,
      timeUntilEligible: eligibility.timeUntilEligible,
      nextEligibleTime: eligibility.eligible ? null : Date.now() + (eligibility.timeUntilEligible * 1000),
      aidType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'ELIGIBILITY_CHECK_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during eligibility check'
      }
    }, { status: 500 });
  }
}

/**
 * Store additional distribution metadata locally
 */
async function storeDistributionMetadata(metadata: any): Promise<void> {
  // In production, store in database
  // For now, just log the metadata
  console.log('Distribution metadata:', metadata);
}