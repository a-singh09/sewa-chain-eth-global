'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getTransactionUrl } from '@/config/contracts';

export interface TransactionMonitorProps {
  transactionHash?: string;
  onConfirmed?: (receipt: any) => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
  timeout?: number; // in milliseconds
  className?: string;
}

interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed' | 'timeout';
  confirmations: number;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

export const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  transactionHash,
  onConfirmed,
  onError,
  onTimeout,
  timeout = 300000, // 5 minutes default
  className = ''
}) => {
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    status: 'pending',
    confirmations: 0
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Poll transaction status
  const pollTransactionStatus = useCallback(async () => {
    if (!transactionHash) return;

    try {
      // Mock transaction status check - in production, use ethers.js provider
      const response = await fetch(`/api/contract/transaction/${transactionHash}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.receipt) {
          setTxStatus({
            status: 'confirmed',
            confirmations: data.confirmations || 1,
            blockNumber: data.receipt.blockNumber,
            gasUsed: data.receipt.gasUsed?.toString()
          });
          
          onConfirmed?.(data.receipt);
          return true; // Stop polling
        }
      }
      
      // Transaction still pending
      setTxStatus(prev => ({
        ...prev,
        status: 'pending'
      }));
      
      return false; // Continue polling
      
    } catch (error) {
      console.error('Transaction status check failed:', error);
      
      setTxStatus({
        status: 'failed',
        confirmations: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      onError?.(error instanceof Error ? error : new Error('Transaction failed'));
      return true; // Stop polling
    }
  }, [transactionHash, onConfirmed, onError]);

  // Start monitoring when transaction hash is provided
  useEffect(() => {
    if (!transactionHash) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setTxStatus({ status: 'pending', confirmations: 0 });
    setElapsedTime(0);

    let pollInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;

    // Start polling immediately
    pollTransactionStatus();
    
    // Set up polling interval
    pollInterval = setInterval(async () => {
      const shouldStop = await pollTransactionStatus();
      if (shouldStop) {
        clearInterval(pollInterval);
        clearInterval(timeInterval);
      }
    }, 3000); // Poll every 3 seconds

    // Set up timeout
    timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
      
      setTxStatus(prev => ({
        ...prev,
        status: 'timeout'
      }));
      
      onTimeout?.();
    }, timeout);

    // Track elapsed time
    timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
      clearInterval(timeInterval);
    };
  }, [transactionHash, timeout, pollTransactionStatus, onTimeout]);

  // Auto-hide after successful confirmation
  useEffect(() => {
    if (txStatus.status === 'confirmed') {
      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // Hide after 5 seconds
      
      return () => clearTimeout(hideTimeout);
    }
  }, [txStatus.status]);

  if (!isVisible || !transactionHash) {
    return null;
  }

  const getStatusIcon = () => {
    switch (txStatus.status) {
      case 'pending':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        );
      case 'confirmed':
        return (
          <div className="text-green-500 text-xl">✓</div>
        );
      case 'failed':
        return (
          <div className="text-red-500 text-xl">✗</div>
        );
      case 'timeout':
        return (
          <div className="text-yellow-500 text-xl">⏱</div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (txStatus.status) {
      case 'pending':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'confirmed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'timeout':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusMessage = () => {
    switch (txStatus.status) {
      case 'pending':
        return (
          <div>
            <div className="font-medium">Transaction Pending</div>
            <div className="text-sm opacity-75">
              Waiting for confirmation... ({elapsedTime}s)
            </div>
          </div>
        );
      case 'confirmed':
        return (
          <div>
            <div className="font-medium">Transaction Confirmed!</div>
            <div className="text-sm opacity-75">
              {txStatus.confirmations} confirmation{txStatus.confirmations !== 1 ? 's' : ''}
              {txStatus.blockNumber && ` • Block ${txStatus.blockNumber}`}
            </div>
          </div>
        );
      case 'failed':
        return (
          <div>
            <div className="font-medium">Transaction Failed</div>
            <div className="text-sm opacity-75">
              {txStatus.error || 'Unknown error occurred'}
            </div>
          </div>
        );
      case 'timeout':
        return (
          <div>
            <div className="font-medium">Transaction Timeout</div>
            <div className="text-sm opacity-75">
              Still pending after {Math.floor(timeout / 1000)}s. Check manually.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const formatTxHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <div className={`fixed bottom-4 right-4 max-w-sm w-full z-50 ${className}`}>
      <div className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm ${getStatusColor()}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            {getStatusMessage()}
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                {formatTxHash(transactionHash)}
              </span>
              
              <a
                href={getTransactionUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline"
              >
                View
              </a>
            </div>
            
            {txStatus.gasUsed && (
              <div className="text-xs opacity-75 mt-1">
                Gas used: {Number(txStatus.gasUsed).toLocaleString()}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
        
        {/* Progress bar for pending transactions */}
        {txStatus.status === 'pending' && (
          <div className="mt-3">
            <div className="h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-current opacity-50 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min((elapsedTime / (timeout / 1000)) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for managing multiple transactions
export const useTransactionMonitor = () => {
  const [transactions, setTransactions] = useState<Map<string, TransactionStatus>>(new Map());

  const addTransaction = useCallback((txHash: string) => {
    setTransactions(prev => {
      const newMap = new Map(prev);
      newMap.set(txHash, { status: 'pending', confirmations: 0 });
      return newMap;
    });
  }, []);

  const updateTransaction = useCallback((txHash: string, status: TransactionStatus) => {
    setTransactions(prev => {
      const newMap = new Map(prev);
      newMap.set(txHash, status);
      return newMap;
    });
  }, []);

  const removeTransaction = useCallback((txHash: string) => {
    setTransactions(prev => {
      const newMap = new Map(prev);
      newMap.delete(txHash);
      return newMap;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setTransactions(prev => {
      const newMap = new Map();
      for (const [hash, status] of prev.entries()) {
        if (status.status === 'pending' || status.status === 'timeout') {
          newMap.set(hash, status);
        }
      }
      return newMap;
    });
  }, []);

  return {
    transactions: Array.from(transactions.entries()),
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearCompleted
  };
};

export default TransactionMonitor;