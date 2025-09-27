import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    worldchain: {
      url: process.env.NEXT_PUBLIC_WORLD_CHAIN_RPC || "https://worldchain-mainnet.g.alchemy.com/public",
      accounts: process.env.WORLD_CHAIN_PRIVATE_KEY ? [process.env.WORLD_CHAIN_PRIVATE_KEY] : [],
      chainId: 480,
    },
    worldchainSepolia: {
      url: "https://worldchain-sepolia.g.alchemy.com/public",
      accounts: process.env.WORLD_CHAIN_PRIVATE_KEY ? [process.env.WORLD_CHAIN_PRIVATE_KEY] : [],
      chainId: 4801,
    },
  },
  etherscan: {
    apiKey: {
      worldchain: "PLACEHOLDER", // World Chain uses different verification
      worldchainSepolia: "PLACEHOLDER",
    },
    customChains: [
      {
        network: "worldchain",
        chainId: 480,
        urls: {
          apiURL: "https://worldchain.blockscout.com/api",
          browserURL: "https://worldchain.blockscout.com",
        },
      },
      {
        network: "worldchainSepolia",
        chainId: 4801,
        urls: {
          apiURL: "https://worldchain-sepolia.blockscout.com/api",
          browserURL: "https://worldchain-sepolia.blockscout.com",
        },
      },
    ],
  },
};

export default config;