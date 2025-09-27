// Contract configuration for World Chain deployment
import type { ContractConfig } from "@/types";

// World Chain Network Configuration
export const WORLD_CHAIN_CONFIG = {
  mainnet: {
    chainId: 480,
    name: "World Chain",
    rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
    blockExplorer: "https://worldchain.blockscout.com",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
  sepolia: {
    chainId: 4801,
    name: "World Chain Sepolia",
    rpcUrl: "https://worldchain-sepolia.g.alchemy.com/public",
    blockExplorer: "https://worldchain-sepolia.blockscout.com",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
} as const;

// Contract deployment addresses - Updated with deployed contracts
export const CONTRACT_ADDRESSES = {
  testnet: {
    uridRegistry:
      process.env.NEXT_PUBLIC_URID_REGISTRY_ADDRESS ||
      "0xb246Ce2A290B6752aa0D4DFbD7038ce2B7683883",
    distributionTracker:
      process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS ||
      "0x0E3359b1C711710B65F56cFE059B57755219F6B3",
  },
  mainnet: {
    uridRegistry:
      process.env.NEXT_PUBLIC_URID_REGISTRY_ADDRESS_MAINNET ||
      "0x0000000000000000000000000000000000000000",
    distributionTracker:
      process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS_MAINNET ||
      "0x0000000000000000000000000000000000000000",
  },
} as const;

// Gas configuration for different networks
export const GAS_SETTINGS = {
  testnet: {
    gasLimit: 500000,
    maxFeePerGas: "20000000000", // 20 gwei
    maxPriorityFeePerGas: "2000000000", // 2 gwei
  },
  mainnet: {
    gasLimit: 300000,
    maxFeePerGas: "30000000000", // 30 gwei
    maxPriorityFeePerGas: "2000000000", // 2 gwei
  },
} as const;

// Get contract configuration for the current environment
export const getContractConfig = (
  network: "testnet" | "mainnet" = "testnet",
): ContractConfig => {
  const chainConfig =
    network === "mainnet"
      ? WORLD_CHAIN_CONFIG.mainnet
      : WORLD_CHAIN_CONFIG.sepolia;

  return {
    rpcUrl: process.env.NEXT_PUBLIC_WORLD_CHAIN_RPC || chainConfig.rpcUrl,
    privateKey: process.env.WORLD_CHAIN_PRIVATE_KEY,
    contractAddresses: CONTRACT_ADDRESSES[network],
    gasSettings: GAS_SETTINGS[network],
    chainId: chainConfig.chainId,
  };
};

// Contract method names for event filtering
export const CONTRACT_EVENTS = {
  uridRegistry: {
    FamilyRegistered: "FamilyRegistered",
    FamilyStatusUpdated: "FamilyStatusUpdated",
  },
  distributionTracker: {
    DistributionRecorded: "DistributionRecorded",
    DistributionConfirmed: "DistributionConfirmed",
    CooldownPeriodUpdated: "CooldownPeriodUpdated",
  },
} as const;

// Cooldown periods in seconds (matching smart contract)
export const COOLDOWN_PERIODS = {
  FOOD: 24 * 60 * 60, // 24 hours
  MEDICAL: 1 * 60 * 60, // 1 hour
  SHELTER: 7 * 24 * 60 * 60, // 7 days
  CLOTHING: 30 * 24 * 60 * 60, // 30 days
  WATER: 12 * 60 * 60, // 12 hours
  CASH: 30 * 24 * 60 * 60, // 30 days
} as const;

// Contract validation constants
export const CONTRACT_LIMITS = {
  MAX_FAMILY_SIZE: 20,
  MIN_FAMILY_SIZE: 1,
  MAX_BATCH_SIZE: 50,
  MAX_DISTRIBUTION_BATCH: 20,
  MAX_QUANTITY: 1000000, // Maximum aid quantity
  MIN_QUANTITY: 1,
} as const;

// Network configuration helper
export const isMainnet = () => {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_NETWORK === "mainnet"
  );
};

export const getNetworkConfig = () => {
  return isMainnet() ? WORLD_CHAIN_CONFIG.mainnet : WORLD_CHAIN_CONFIG.sepolia;
};

export const getChainId = () => {
  return getNetworkConfig().chainId;
};

export const getRpcUrl = () => {
  return process.env.NEXT_PUBLIC_WORLD_CHAIN_RPC || getNetworkConfig().rpcUrl;
};

export const getBlockExplorer = () => {
  return getNetworkConfig().blockExplorer;
};

// Transaction URL helper
export const getTransactionUrl = (txHash: string) => {
  return `${getBlockExplorer()}/tx/${txHash}`;
};

export const getAddressUrl = (address: string) => {
  return `${getBlockExplorer()}/address/${address}`;
};
