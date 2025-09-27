'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { 
  ContractContextType, 
  TransactionResult, 
  EligibilityResult, 
  DistributionParams,
  AidType,
  ContractConfig
} from '@/types';
import { getContractConfig, getNetworkConfig } from '@/config/contracts';

interface ContractProviderProps {
  children: React.ReactNode;
  network?: 'testnet' | 'mainnet';
}

interface ContractState {
  isConnected: boolean;
  networkId: number;
  contractAddresses: ContractConfig['contractAddresses'];
  blockNumber: number;
  gasPrice: bigint;
  isLoading: boolean;
  error: string | null;
}

const ContractContext = createContext<ContractContextType | null>(null);

export const ContractProvider: React.FC<ContractProviderProps> = ({ 
  children, 
  network = 'testnet' 
}) => {
  const [state, setState] = useState<ContractState>({
    isConnected: false,
    networkId: 0,
    contractAddresses: {
      uridRegistry: '',
      distributionTracker: ''
    },
    blockNumber: 0,
    gasPrice: 0n,
    isLoading: true,
    error: null
  });

  const [config] = useState(() => getContractConfig(network));
  const [networkConfig] = useState(() => getNetworkConfig());

  // Initialize contract connection
  const initializeConnection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if contract addresses are configured
      if (!config.contractAddresses.uridRegistry || !config.contractAddresses.distributionTracker) {
        throw new Error('Contract addresses not configured. Please deploy contracts first.');
      }

      // Test connection to RPC
      const response = await fetch('/api/contract/stats');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to connect to contract');
      }

      setState(prev => ({
        ...prev,
        isConnected: true,
        networkId: config.chainId,
        contractAddresses: config.contractAddresses,
        blockNumber: data.stats?.networkInfo?.blockNumber || 0,
        gasPrice: BigInt(data.stats?.networkInfo?.gasPrice || '0'),
        isLoading: false
      }));

    } catch (error) {
      console.error('Contract connection failed:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, [config]);

  // Update block number and gas price periodically
  const updateNetworkInfo = useCallback(async () => {
    if (!state.isConnected) return;

    try {
      const response = await fetch('/api/contract/stats');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setState(prev => ({
          ...prev,
          blockNumber: data.stats?.networkInfo?.blockNumber || prev.blockNumber,
          gasPrice: BigInt(data.stats?.networkInfo?.gasPrice || prev.gasPrice.toString())
        }));
      }
    } catch (error) {
      console.warn('Failed to update network info:', error);
    }
  }, [state.isConnected]);

  // Contract operation: Register Family
  const registerFamily = useCallback(async (params: { 
    uridHash: string; 
    familySize: number 
  }): Promise<TransactionResult> => {
    try {
      if (!state.isConnected) {
        throw new Error('Contract not connected');
      }

      const response = await fetch('/api/families/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // This would typically come from the family registration form
          volunteerSession: 'mock_session', // TODO: Get from volunteer context
          familyDetails: {
            headOfFamily: 'Mock Name',
            familySize: params.familySize,
            location: 'Mock Location',
            contactNumber: 'Mock Contact'
          },
          aadhaarProof: {
            hashedIdentifier: 'mock_hash_' + Date.now()
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Registration failed'
        };
      }

      return {
        success: true,
        transactionHash: data.transactionHash
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }, [state.isConnected]);

  // Contract operation: Record Distribution
  const recordDistribution = useCallback(async (params: DistributionParams): Promise<TransactionResult> => {
    try {
      if (!state.isConnected) {
        throw new Error('Contract not connected');
      }

      const response = await fetch('/api/distributions/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uridHash: params.uridHash,
          volunteerSession: 'mock_session', // TODO: Get from volunteer context
          distribution: {
            aidType: params.aidType,
            quantity: params.quantity,
            location: params.location
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Distribution recording failed'
        };
      }

      return {
        success: true,
        transactionHash: data.transactionHash
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Distribution recording failed'
      };
    }
  }, [state.isConnected]);

  // Contract operation: Validate Family
  const validateFamily = useCallback(async (uridHash: string): Promise<boolean> => {
    try {
      if (!state.isConnected) {
        return false;
      }

      const response = await fetch(`/api/families/validate?uridHash=${encodeURIComponent(uridHash)}`);
      const data = await response.json();
      
      return response.ok && data.isValid;

    } catch (error) {
      console.error('Family validation failed:', error);
      return false;
    }
  }, [state.isConnected]);

  // Contract operation: Check Eligibility
  const checkEligibility = useCallback(async (
    uridHash: string, 
    aidType: AidType
  ): Promise<EligibilityResult> => {
    try {
      if (!state.isConnected) {
        throw new Error('Contract not connected');
      }

      const response = await fetch(
        `/api/distributions/record?uridHash=${encodeURIComponent(uridHash)}&aidType=${aidType}`
      );
      const data = await response.json();
      
      if (!response.ok) {
        return {
          eligible: false,
          timeUntilEligible: 0
        };
      }

      return {
        eligible: data.eligible,
        timeUntilEligible: data.timeUntilEligible || 0
      };

    } catch (error) {
      console.error('Eligibility check failed:', error);
      return {
        eligible: false,
        timeUntilEligible: 0
      };
    }
  }, [state.isConnected]);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  // Update network info periodically
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(updateNetworkInfo, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [state.isConnected, updateNetworkInfo]);

  // Retry connection if failed
  useEffect(() => {
    if (state.error && !state.isConnected) {
      const timeout = setTimeout(() => {
        console.log('Retrying contract connection...');
        initializeConnection();
      }, 10000); // Retry after 10 seconds
      
      return () => clearTimeout(timeout);
    }
  }, [state.error, state.isConnected, initializeConnection]);

  const contextValue: ContractContextType = {
    isConnected: state.isConnected,
    networkId: state.networkId,
    contractAddresses: state.contractAddresses,
    blockNumber: state.blockNumber,
    gasPrice: state.gasPrice,
    registerFamily,
    recordDistribution,
    validateFamily,
    checkEligibility
  };

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
      {state.isLoading && (
        <div className=\"fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50\">
          <div className=\"flex items-center gap-2\">
            <div className=\"animate-spin rounded-full h-4 w-4 border-b-2 border-white\" />
            <span>Connecting to blockchain...</span>
          </div>
        </div>
      )}
      {state.error && (
        <div className=\"fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50\">
          <div className=\"flex items-center gap-2\">
            <span>⚠️</span>
            <span>{state.error}</span>
          </div>
        </div>
      )}
    </ContractContext.Provider>
  );
};

// Hook to use contract context
export const useContract = (): ContractContextType => {
  const context = useContext(ContractContext);
  
  if (!context) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  
  return context;
};

// Hook to get contract connection status
export const useContractStatus = () => {
  const { isConnected, networkId, blockNumber, gasPrice } = useContract();
  
  return {
    isConnected,
    networkId,
    blockNumber,
    gasPrice,
    networkName: networkId === 480 ? 'World Chain' : networkId === 4801 ? 'World Chain Sepolia' : 'Unknown',
    formattedGasPrice: gasPrice > 0n ? `${Number(gasPrice) / 1e9} gwei` : 'N/A'
  };
};

export default ContractProvider;