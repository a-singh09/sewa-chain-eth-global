import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/services/ContractService';

export interface TransactionStatusResponse {
  success: boolean;
  receipt?: {
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
    status: number;
    confirmations: number;
  };
  confirmations?: number;
  isPending?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Transaction Status API Route
 * Checks the status of a blockchain transaction
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { transactionHash: string } }
) {
  const { transactionHash } = params;
  
  if (!transactionHash) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'MISSING_TX_HASH',
        message: 'Transaction hash is required'
      }
    } as TransactionStatusResponse, { status: 400 });
  }

  if (!transactionHash.startsWith('0x') || transactionHash.length !== 66) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_TX_HASH',
        message: 'Invalid transaction hash format'
      }
    } as TransactionStatusResponse, { status: 400 });
  }

  try {
    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );
    
    const provider = contractService.getProvider();
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt) {
      // Transaction is still pending
      return NextResponse.json({
        success: true,
        isPending: true,
        confirmations: 0
      } as TransactionStatusResponse, { status: 200 });
    }

    // Get current block number to calculate confirmations
    const currentBlockNumber = await provider.getBlockNumber();
    const confirmations = currentBlockNumber - receipt.blockNumber + 1;

    console.log('Transaction status retrieved:', {
      transactionHash: transactionHash.substring(0, 10) + '...',
      blockNumber: receipt.blockNumber,
      confirmations,
      status: receipt.status,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      receipt: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status || 0,
        confirmations
      },
      confirmations,
      isPending: false
    } as TransactionStatusResponse, { status: 200 });

  } catch (error) {
    console.error('Transaction status error:', error);
    
    // Check if it's a network error vs transaction not found
    let errorCode = 'STATUS_CHECK_FAILED';
    let errorMessage = 'Failed to check transaction status';
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('CALL_EXCEPTION')) {
        errorCode = 'TX_NOT_FOUND';
        errorMessage = 'Transaction not found. It may still be pending or invalid.';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorCode = 'NETWORK_ERROR';
        errorMessage = 'Network error while checking transaction status';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    } as TransactionStatusResponse, { status: 500 });
  }
}

/**
 * POST endpoint for batch transaction status checks
 */
export async function POST(req: NextRequest) {
  try {
    const { transactionHashes } = await req.json();
    
    if (!Array.isArray(transactionHashes)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'transactionHashes must be an array'
        }
      }, { status: 400 });
    }

    if (transactionHashes.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'EMPTY_ARRAY',
          message: 'At least one transaction hash is required'
        }
      }, { status: 400 });
    }

    if (transactionHashes.length > 20) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TOO_MANY_TRANSACTIONS',
          message: 'Maximum 20 transaction hashes allowed per batch'
        }
      }, { status: 400 });
    }

    // Validate all transaction hashes
    for (const txHash of transactionHashes) {
      if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x') || txHash.length !== 66) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_TX_HASH',
            message: `Invalid transaction hash format: ${txHash}`
          }
        }, { status: 400 });
      }
    }

    const contractService = getContractService(
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    );
    
    const provider = contractService.getProvider();
    const currentBlockNumber = await provider.getBlockNumber();

    const results = await Promise.all(
      transactionHashes.map(async (txHash: string) => {
        try {
          const receipt = await provider.getTransactionReceipt(txHash);
          
          if (!receipt) {
            return {
              transactionHash: txHash,
              success: true,
              isPending: true,
              confirmations: 0
            };
          }

          const confirmations = currentBlockNumber - receipt.blockNumber + 1;
          
          return {
            transactionHash: txHash,
            success: true,
            receipt: {
              transactionHash: receipt.hash,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              status: receipt.status || 0,
              confirmations
            },
            confirmations,
            isPending: false
          };
          
        } catch (error) {
          return {
            transactionHash: txHash,
            success: false,
            error: {
              code: 'STATUS_CHECK_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error'
            }
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const pendingCount = results.filter(r => r.success && r.isPending).length;
    const confirmedCount = results.filter(r => r.success && !r.isPending).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: transactionHashes.length,
        successful: successCount,
        pending: pendingCount,
        confirmed: confirmedCount,
        failed: transactionHashes.length - successCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch transaction status error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'BATCH_STATUS_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error during batch status check'
      }
    }, { status: 500 });
  }
}