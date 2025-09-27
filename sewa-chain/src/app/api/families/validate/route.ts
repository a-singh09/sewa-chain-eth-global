import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/services/ContractService';
import { URIDService } from '@/lib/urid-service';

export interface ValidateFamilyResponse {
  isValid: boolean;
  familyInfo?: {
    familySize: number;
    registrationTime: number;
    registeredBy: string;
    isActive: boolean;
  };
  localData?: any;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Family Validation API Route
 * Validates family existence and status in smart contract
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const urid = url.searchParams.get('urid');
  const uridHash = url.searchParams.get('uridHash');
  
  if (!urid && !uridHash) {
    return NextResponse.json({
      isValid: false,
      error: {
        code: 'MISSING_IDENTIFIER',
        message: 'Either URID or URID hash is required'
      }
    } as ValidateFamilyResponse, { status: 400 });
  }

  try {
    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );

    let queryHash = uridHash;
    if (urid && !uridHash) {
      // Validate URID format first
      if (!URIDService.validateURID(urid)) {
        return NextResponse.json({
          isValid: false,
          error: {
            code: 'INVALID_URID_FORMAT',
            message: 'Invalid URID format'
          }
        } as ValidateFamilyResponse, { status: 400 });
      }
      
      queryHash = URIDService.hashURID(urid);
    }

    if (!queryHash || queryHash === '0x' || queryHash.length !== 66) {
      return NextResponse.json({
        isValid: false,
        error: {
          code: 'INVALID_HASH_FORMAT',
          message: 'Invalid URID hash format'
        }
      } as ValidateFamilyResponse, { status: 400 });
    }

    // Check family validity on smart contract
    const isValid = await contractService.validateFamily(queryHash);
    
    if (!isValid) {
      return NextResponse.json({
        isValid: false,
        error: {
          code: 'FAMILY_NOT_FOUND',
          message: 'Family not found or inactive'
        }
      } as ValidateFamilyResponse, { status: 404 });
    }

    // Get detailed family info
    const familyInfo = await contractService.getFamilyInfo(queryHash);
    
    if (!familyInfo) {
      return NextResponse.json({
        isValid: false,
        error: {
          code: 'FAMILY_INFO_ERROR',
          message: 'Could not retrieve family information'
        }
      } as ValidateFamilyResponse, { status: 500 });
    }

    // Get local data if URID is provided
    let localData = null;
    if (urid) {
      try {
        localData = await URIDService.getFamilyData(urid);
      } catch (error) {
        // Local data is optional, continue if not found
        console.warn('Local family data not found:', error);
      }
    }

    console.log('Family validation successful:', {
      urid: urid || 'N/A',
      uridHash: queryHash.substring(0, 10) + '...',
      isValid,
      familySize: familyInfo.familySize,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      isValid: true,
      familyInfo: {
        familySize: familyInfo.familySize,
        registrationTime: familyInfo.registrationTime,
        registeredBy: familyInfo.registeredBy,
        isActive: familyInfo.isActive
      },
      localData
    } as ValidateFamilyResponse, { status: 200 });

  } catch (error) {
    console.error('Family validation error:', error);
    
    return NextResponse.json({
      isValid: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during family validation'
      }
    } as ValidateFamilyResponse, { status: 500 });
  }
}

/**
 * POST endpoint for batch validation
 */
export async function POST(req: NextRequest) {
  try {
    const { urids, uridHashes } = await req.json();
    
    if (!urids && !uridHashes) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_IDENTIFIERS',
          message: 'Either URIDs or URID hashes array is required'
        }
      }, { status: 400 });
    }

    const identifiers = urids || uridHashes;
    const isUridFormat = !!urids;

    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Identifiers must be a non-empty array'
        }
      }, { status: 400 });
    }

    if (identifiers.length > 50) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TOO_MANY_IDENTIFIERS',
          message: 'Maximum 50 identifiers allowed per batch'
        }
      }, { status: 400 });
    }

    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );

    const results = await Promise.all(
      identifiers.map(async (identifier: string) => {
        try {
          let queryHash = identifier;
          
          if (isUridFormat) {
            if (!URIDService.validateURID(identifier)) {
              return {
                identifier,
                isValid: false,
                error: 'Invalid URID format'
              };
            }
            queryHash = URIDService.hashURID(identifier);
          }

          const isValid = await contractService.validateFamily(queryHash);
          
          if (isValid) {
            const familyInfo = await contractService.getFamilyInfo(queryHash);
            return {
              identifier,
              isValid: true,
              familyInfo: familyInfo ? {
                familySize: familyInfo.familySize,
                registrationTime: familyInfo.registrationTime,
                registeredBy: familyInfo.registeredBy,
                isActive: familyInfo.isActive
              } : null
            };
          } else {
            return {
              identifier,
              isValid: false,
              error: 'Family not found or inactive'
            };
          }
        } catch (error) {
          return {
            identifier,
            isValid: false,
            error: error instanceof Error ? error.message : 'Validation error'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
      totalCount: identifiers.length,
      validCount: results.filter(r => r.isValid).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch validation error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'BATCH_VALIDATION_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during batch validation'
      }
    }, { status: 500 });
  }
}