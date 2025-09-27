import { NextRequest, NextResponse } from 'next/server';
import { MiniKit } from '@worldcoin/minikit-js';

export interface PaymentRequest {
  urid: string;
  amount: string;
  currency: 'WLD' | 'ETH';
  description: string;
  volunteerSession: string;
}

export interface PaymentResponse {
  success: boolean;
  reference?: string;
  transactionHash?: string;
  error?: {
    code: string;
    message: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PaymentRequest;
    
    // Validate required fields
    if (!body.urid || !body.amount || !body.currency || !body.volunteerSession) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields'
        }
      } as PaymentResponse, { status: 400 });
    }

    // Generate payment reference
    const reference = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Prepare payment for MiniKit
    const paymentData = {
      reference,
      to: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0x742d35Cc6634C0532925a3b8D4321f92f',
      tokens: [{
        symbol: body.currency,
        token_amount: body.amount
      }],
      description: body.description || `Aid distribution payment for URID: ${body.urid}`
    };

    // For now, return success with mock data
    // In production, this would integrate with MiniKit.commandsAsync.pay()
    return NextResponse.json({
      success: true,
      reference,
      transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
    } as PaymentResponse);

  } catch (error) {
    console.error('Payment processing error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PAYMENT_FAILED',
        message: 'Internal server error during payment processing'
      }
    } as PaymentResponse, { status: 500 });
  }
}