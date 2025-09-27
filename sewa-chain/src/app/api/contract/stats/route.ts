import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/services/ContractService';

export interface ContractStatsResponse {
  success: boolean;
  stats?: {
    totalFamilies: number;
    activeFamilies: number;
    totalDistributions: number;
    contractBalance: string;
    networkInfo: {
      chainId: number;
      blockNumber?: number;
      gasPrice?: string;
    };
    lastUpdated: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface VolunteerStatsResponse {
  success: boolean;
  stats?: {
    distributionCount: number;
    verificationLevel: string;
    lastDistribution?: number;
    lastDistributionDate?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Contract Statistics API Route
 * Retrieves overall contract statistics for dashboard
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const volunteerNullifier = url.searchParams.get('volunteerNullifier');
  
  try {
    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );

    // If volunteer nullifier is provided, return volunteer-specific stats
    if (volunteerNullifier) {
      if (volunteerNullifier === '0x' || volunteerNullifier.length !== 66) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_NULLIFIER',
            message: 'Invalid volunteer nullifier format'
          }
        } as VolunteerStatsResponse, { status: 400 });
      }

      const volunteerStats = await contractService.getVolunteerStats(volunteerNullifier);
      
      return NextResponse.json({
        success: true,
        stats: {
          distributionCount: volunteerStats.distributionCount,
          verificationLevel: volunteerStats.verificationLevel,
          lastDistribution: volunteerStats.lastDistribution,
          lastDistributionDate: volunteerStats.lastDistribution 
            ? new Date(volunteerStats.lastDistribution * 1000).toISOString()
            : undefined
        }
      } as VolunteerStatsResponse, { status: 200 });
    }

    // Get overall contract statistics
    const [contractStats, provider] = await Promise.all([
      contractService.getContractStats(),
      contractService.getProvider()
    ]);

    // Get additional network info
    let blockNumber: number | undefined;
    let gasPrice: string | undefined;
    
    try {
      [blockNumber, gasPrice] = await Promise.all([
        provider.getBlockNumber(),
        provider.getFeeData().then(fee => fee.gasPrice?.toString())
      ]);
    } catch (error) {
      console.warn('Failed to get network info:', error);
    }

    console.log('Contract stats retrieved:', {
      totalFamilies: contractStats.totalFamilies,
      activeFamilies: contractStats.activeFamilies,
      contractBalance: contractStats.contractBalance,
      blockNumber,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalFamilies: contractStats.totalFamilies,
        activeFamilies: contractStats.activeFamilies,
        totalDistributions: 0, // TODO: Get from distribution tracker
        contractBalance: contractStats.contractBalance,
        networkInfo: {
          chainId: contractService.getChainId(),
          blockNumber,
          gasPrice
        },
        lastUpdated: new Date().toISOString()
      }
    } as ContractStatsResponse, { status: 200 });

  } catch (error) {
    console.error('Contract stats error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'STATS_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during stats retrieval'
      }
    } as ContractStatsResponse, { status: 500 });
  }
}

/**
 * POST endpoint for detailed statistics with filters
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      includeRecentDistributions = false,
      distributionLimit = 10,
      volunteerNullifiers = [],
      timeRange
    } = await req.json();

    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );

    // Get basic contract stats
    const contractStats = await contractService.getContractStats();
    
    const response: any = {
      success: true,
      stats: {
        totalFamilies: contractStats.totalFamilies,
        activeFamilies: contractStats.activeFamilies,
        contractBalance: contractStats.contractBalance,
        networkInfo: {
          chainId: contractService.getChainId()
        },
        lastUpdated: new Date().toISOString()
      }
    };

    // Add volunteer stats if requested
    if (volunteerNullifiers.length > 0) {
      if (volunteerNullifiers.length > 50) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'TOO_MANY_VOLUNTEERS',
            message: 'Maximum 50 volunteer nullifiers allowed'
          }
        }, { status: 400 });
      }

      const volunteerStats = await Promise.all(
        volunteerNullifiers.map(async (nullifier: string) => {
          try {
            if (!nullifier || nullifier === '0x' || nullifier.length !== 66) {
              return {
                nullifier,
                error: 'Invalid nullifier format'
              };
            }

            const stats = await contractService.getVolunteerStats(nullifier);
            return {
              nullifier,
              distributionCount: stats.distributionCount,
              verificationLevel: stats.verificationLevel,
              lastDistribution: stats.lastDistribution
            };
          } catch (error) {
            return {
              nullifier,
              error: error instanceof Error ? error.message : 'Stats retrieval failed'
            };
          }
        })
      );

      response.volunteerStats = volunteerStats;
    }

    // Add recent distributions if requested
    if (includeRecentDistributions) {
      // TODO: Implement recent distributions retrieval
      // This would require additional contract methods or event parsing
      response.recentDistributions = [];
    }

    // Add network information
    try {
      const provider = contractService.getProvider();
      const [blockNumber, feeData] = await Promise.all([
        provider.getBlockNumber(),
        provider.getFeeData()
      ]);

      response.stats.networkInfo.blockNumber = blockNumber;
      response.stats.networkInfo.gasPrice = feeData.gasPrice?.toString();
      response.stats.networkInfo.maxFeePerGas = feeData.maxFeePerGas?.toString();
    } catch (error) {
      console.warn('Failed to get network info:', error);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Detailed stats error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'DETAILED_STATS_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during detailed stats retrieval'
      }
    }, { status: 500 });
  }
}