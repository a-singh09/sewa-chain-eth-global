import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/services/ContractService';
import { URIDService } from '@/lib/urid-service';

export interface DistributionHistoryResponse {
  success: boolean;
  distributions?: Array<{
    uridHash: string;
    volunteerNullifier: string;
    aidType: string;
    quantity: number;
    location: string;
    timestamp: number;
    confirmed: boolean;
    formattedDate: string;
  }>;
  totalCount?: number;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Distribution History API Route
 * Retrieves distribution history for a family from smart contract
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const urid = url.searchParams.get('urid');
  const uridHash = url.searchParams.get('uridHash');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  if (!urid && !uridHash) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'MISSING_IDENTIFIER',
        message: 'Either URID or URID hash is required'
      }
    } as DistributionHistoryResponse, { status: 400 });
  }

  if (limit > 100 || limit < 1) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_LIMIT',
        message: 'Limit must be between 1 and 100'
      }
    } as DistributionHistoryResponse, { status: 400 });
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
        } as DistributionHistoryResponse, { status: 400 });
      }
      queryHash = URIDService.hashURID(urid);
    }

    if (!queryHash || queryHash === '0x' || queryHash.length !== 66) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_HASH_FORMAT',
          message: 'Invalid URID hash format'
        }
      } as DistributionHistoryResponse, { status: 400 });
    }

    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );

    // Validate family exists
    const isValidFamily = await contractService.validateFamily(queryHash);
    if (!isValidFamily) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FAMILY_NOT_FOUND',
          message: 'Family not found or inactive'
        }
      } as DistributionHistoryResponse, { status: 404 });
    }

    // Get distribution history from smart contract
    const contractDistributions = await contractService.getDistributionHistory(queryHash);
    
    // Format distributions for response
    const formattedDistributions = contractDistributions
      .map(dist => ({
        uridHash: dist.uridHash,
        volunteerNullifier: dist.volunteerNullifier,
        aidType: dist.aidType,
        quantity: dist.quantity,
        location: dist.location,
        timestamp: dist.timestamp,
        confirmed: dist.confirmed,
        formattedDate: new Date(dist.timestamp * 1000).toISOString()
      }))
      .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
      .slice(offset, offset + limit); // Apply pagination

    console.log('Distribution history retrieved:', {
      urid: urid || 'N/A',
      uridHash: queryHash.substring(0, 10) + '...',
      totalCount: contractDistributions.length,
      returnedCount: formattedDistributions.length,
      limit,
      offset,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      distributions: formattedDistributions,
      totalCount: contractDistributions.length
    } as DistributionHistoryResponse, { status: 200 });

  } catch (error) {
    console.error('Distribution history error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'HISTORY_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during history retrieval'
      }
    } as DistributionHistoryResponse, { status: 500 });
  }
}

/**
 * POST endpoint for batch history retrieval
 */
export async function POST(req: NextRequest) {
  try {
    const { urids, uridHashes, limit = 50 } = await req.json();
    
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

    if (identifiers.length > 20) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TOO_MANY_IDENTIFIERS',
          message: 'Maximum 20 identifiers allowed per batch'
        }
      }, { status: 400 });
    }

    if (limit > 100 || limit < 1) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'Limit must be between 1 and 100'
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
                success: false,
                error: 'Invalid URID format',
                distributions: []
              };
            }
            queryHash = URIDService.hashURID(identifier);
          }

          // Validate family exists
          const isValidFamily = await contractService.validateFamily(queryHash);
          if (!isValidFamily) {
            return {
              identifier,
              success: false,
              error: 'Family not found or inactive',
              distributions: []
            };
          }

          // Get distribution history
          const contractDistributions = await contractService.getDistributionHistory(queryHash);
          
          const formattedDistributions = contractDistributions
            .map(dist => ({
              uridHash: dist.uridHash,
              volunteerNullifier: dist.volunteerNullifier,
              aidType: dist.aidType,
              quantity: dist.quantity,
              location: dist.location,
              timestamp: dist.timestamp,
              confirmed: dist.confirmed,
              formattedDate: new Date(dist.timestamp * 1000).toISOString()
            }))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);

          return {
            identifier,
            success: true,
            distributions: formattedDistributions,
            totalCount: contractDistributions.length
          };

        } catch (error) {
          return {
            identifier,
            success: false,
            error: error instanceof Error ? error.message : 'History retrieval error',
            distributions: []
          };
        }
      })
    );

    const successfulResults = results.filter(r => r.success);
    const totalDistributions = successfulResults.reduce((sum, r) => sum + r.distributions.length, 0);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalRequests: identifiers.length,
        successfulRequests: successfulResults.length,
        totalDistributions,
        limit
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch history error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'BATCH_HISTORY_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during batch history retrieval'
      }
    }, { status: 500 });
  }
}