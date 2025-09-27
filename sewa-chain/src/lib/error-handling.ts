import { VerificationErrorCode, ERROR_MESSAGES } from '@/types';

export class ErrorHandlingService {
  // Log errors with proper categorization
  static logError(error: Error, context: string, metadata?: any) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    // In production, send to error tracking service
    console.error('[ERROR]', errorData);
  }

  // Format user-friendly error messages
  static formatUserError(error: any, fallbackMessage: string = 'An error occurred'): string {
    if (typeof error === 'string') {
      return ERROR_MESSAGES[error as VerificationErrorCode] || error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.code && ERROR_MESSAGES[error.code as VerificationErrorCode]) {
      return ERROR_MESSAGES[error.code as VerificationErrorCode];
    }
    
    return fallbackMessage;
  }

  // Handle network errors specifically
  static handleNetworkError(error: any): string {
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
      return 'Network connection failed. Please check your internet connection and try again.';
    }
    
    if (error?.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    return 'Network error occurred. Please try again.';
  }

  // Handle blockchain/contract errors
  static handleContractError(error: any): string {
    if (error?.message?.includes('insufficient funds')) {
      return 'Insufficient funds for transaction. Please check your wallet balance.';
    }
    
    if (error?.message?.includes('user rejected')) {
      return 'Transaction was cancelled by user.';
    }
    
    if (error?.message?.includes('nonce')) {
      return 'Transaction nonce error. Please try again.';
    }
    
    return 'Blockchain transaction failed. Please try again.';
  }

  // Retry mechanism for failed operations
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logError(error as Error, `Retry attempt ${attempt}/${maxRetries}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError;
  }
}