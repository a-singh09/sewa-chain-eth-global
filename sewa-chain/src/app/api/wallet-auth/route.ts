import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'ethers';

export interface WalletAuthRequest {
  address: string;
  signature: string;
  message: string;
  nonce: string;
}

export interface WalletAuthResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: number;
  error?: {
    code: string;
    message: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as WalletAuthRequest;
    
    if (!body.address || !body.signature || !body.message || !body.nonce) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required authentication fields'
        }
      } as WalletAuthResponse, { status: 400 });
    }

    // Verify the signature
    try {
      const recoveredAddress = verifyMessage(body.message, body.signature);
      
      if (recoveredAddress.toLowerCase() !== body.address.toLowerCase()) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Signature verification failed'
          }
        } as WalletAuthResponse, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'SIGNATURE_ERROR',
          message: 'Failed to verify signature'
        }
      } as WalletAuthResponse, { status: 401 });
    }

    // Generate session token
    const sessionToken = Buffer.from(JSON.stringify({
      address: body.address,
      nonce: body.nonce,
      timestamp: Date.now()
    })).toString('base64');

    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt
    } as WalletAuthResponse);

  } catch (error) {
    console.error('Wallet authentication error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Internal server error during authentication'
      }
    } as WalletAuthResponse, { status: 500 });
  }
}