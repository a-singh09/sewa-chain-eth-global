// Smart Contract Service for SewaChain
import {
  ethers,
  JsonRpcProvider,
  Contract,
  Wallet,
  TransactionReceipt,
  formatEther,
} from "ethers";
import type {
  IContractService,
  TransactionResult,
  Family,
  ContractDistribution,
  EligibilityResult,
  ContractStats,
  VolunteerStats,
  DistributionParams,
  ContractError,
  ContractErrorType,
  AidType,
  VerificationLevel,
} from "@/types";
import {
  getContractConfig,
  CONTRACT_LIMITS,
  COOLDOWN_PERIODS,
} from "@/config/contracts";
import URIDRegistryABI from "@/abi/URIDRegistry.json";
import DistributionTrackerABI from "@/abi/DistributionTracker.json";

export class ContractService implements IContractService {
  private provider: JsonRpcProvider;
  private signer?: Wallet;
  private uridRegistry: Contract;
  private distributionTracker: Contract;
  private config: ReturnType<typeof getContractConfig>;

  constructor(network: "testnet" | "mainnet" = "testnet") {
    this.config = getContractConfig(network);
    this.provider = new JsonRpcProvider(this.config.rpcUrl);

    // Initialize signer if private key is available (for server-side operations)
    if (this.config.privateKey) {
      this.signer = new Wallet(this.config.privateKey, this.provider);
    }

    // Initialize contracts
    this.uridRegistry = new Contract(
      this.config.contractAddresses.uridRegistry,
      URIDRegistryABI,
      this.signer || this.provider,
    );

    this.distributionTracker = new Contract(
      this.config.contractAddresses.distributionTracker,
      DistributionTrackerABI,
      this.signer || this.provider,
    );
  }

  // Set external signer (for client-side wallet connections)
  setSigner(signer: any) {
    this.signer = signer;
    this.uridRegistry = this.uridRegistry.connect(signer);
    this.distributionTracker = this.distributionTracker.connect(signer);
  }

  // URID Registry Operations
  async registerFamily(
    uridHash: string,
    familySize: number,
  ): Promise<TransactionResult> {
    try {
      // Validate inputs
      if (!uridHash || uridHash === "0x" || uridHash.length !== 66) {
        throw new Error("Invalid URID hash format");
      }

      if (
        familySize < CONTRACT_LIMITS.MIN_FAMILY_SIZE ||
        familySize > CONTRACT_LIMITS.MAX_FAMILY_SIZE
      ) {
        throw new Error(
          `Family size must be between ${CONTRACT_LIMITS.MIN_FAMILY_SIZE} and ${CONTRACT_LIMITS.MAX_FAMILY_SIZE}`,
        );
      }

      // Check if family already exists
      const exists = await this.uridRegistry.isURIDRegistered(uridHash);
      if (exists) {
        throw new Error("Family with this URID is already registered");
      }

      // Estimate gas
      const gasEstimate = await this.uridRegistry.registerFamily.estimateGas(
        uridHash,
        familySize,
      );
      const gasLimit = gasEstimate + gasEstimate / 5n; // Add 20% buffer

      // Execute transaction
      const tx = await this.uridRegistry.registerFamily(uridHash, familySize, {
        gasLimit: gasLimit,
        maxFeePerGas: this.config.gasSettings.maxFeePerGas,
        maxPriorityFeePerGas: this.config.gasSettings.maxPriorityFeePerGas,
      });

      const receipt = await this.waitForConfirmation(tx);

      return {
        success: true,
        transactionHash: receipt.hash,
        receipt,
      };
    } catch (error) {
      return this.handleTransactionError(error);
    }
  }

  async validateFamily(uridHash: string): Promise<boolean> {
    try {
      if (!uridHash || uridHash === "0x" || uridHash.length !== 66) {
        return false;
      }

      return await this.uridRegistry.isValidFamily(uridHash);
    } catch (error) {
      console.error("Error validating family:", error);
      return false;
    }
  }

  async getFamilyInfo(uridHash: string): Promise<Family | null> {
    try {
      if (!uridHash || uridHash === "0x" || uridHash.length !== 66) {
        return null;
      }

      const familyData = await this.uridRegistry.getFamilyInfo(uridHash);

      return {
        uridHash: familyData.uridHash,
        familySize: Number(familyData.familySize),
        registrationTime: Number(familyData.registrationTime),
        registeredBy: familyData.registeredBy,
        isActive: familyData.isActive,
        exists: familyData.exists,
      };
    } catch (error) {
      console.error("Error getting family info:", error);
      return null;
    }
  }

  // Distribution Tracker Operations
  async recordDistribution(
    params: DistributionParams,
  ): Promise<TransactionResult> {
    try {
      // Validate inputs
      if (
        !params.uridHash ||
        params.uridHash === "0x" ||
        params.uridHash.length !== 66
      ) {
        throw new Error("Invalid URID hash format");
      }

      if (
        !params.volunteerNullifier ||
        params.volunteerNullifier === "0x" ||
        params.volunteerNullifier.length !== 66
      ) {
        throw new Error("Invalid volunteer nullifier format");
      }

      if (
        params.quantity < CONTRACT_LIMITS.MIN_QUANTITY ||
        params.quantity > CONTRACT_LIMITS.MAX_QUANTITY
      ) {
        throw new Error(
          `Quantity must be between ${CONTRACT_LIMITS.MIN_QUANTITY} and ${CONTRACT_LIMITS.MAX_QUANTITY}`,
        );
      }

      if (!params.location || params.location.trim().length === 0) {
        throw new Error("Location cannot be empty");
      }

      // Check family validity
      const isValid = await this.validateFamily(params.uridHash);
      if (!isValid) {
        throw new Error("Family not found or inactive");
      }

      // Check eligibility
      const eligibility = await this.checkEligibility(
        params.uridHash,
        params.aidType,
      );
      if (!eligibility.eligible) {
        const hoursRemaining = Math.ceil(eligibility.timeUntilEligible / 3600);
        throw new Error(
          `Family not eligible for ${params.aidType}. Please wait ${hoursRemaining} hours.`,
        );
      }

      // Convert aid type to enum value
      const aidTypeValue = this.getAidTypeValue(params.aidType);

      // Estimate gas
      const gasEstimate =
        await this.distributionTracker.recordDistribution.estimateGas(
          params.uridHash,
          params.volunteerNullifier,
          aidTypeValue,
          params.quantity,
          params.location,
        );
      const gasLimit = gasEstimate + gasEstimate / 5n; // Add 20% buffer

      // Execute transaction
      const tx = await this.distributionTracker.recordDistribution(
        params.uridHash,
        params.volunteerNullifier,
        aidTypeValue,
        params.quantity,
        params.location,
        {
          gasLimit: gasLimit,
          maxFeePerGas: this.config.gasSettings.maxFeePerGas,
          maxPriorityFeePerGas: this.config.gasSettings.maxPriorityFeePerGas,
        },
      );

      const receipt = await this.waitForConfirmation(tx);

      return {
        success: true,
        transactionHash: receipt.hash,
        receipt,
      };
    } catch (error) {
      return this.handleTransactionError(error);
    }
  }

  async checkEligibility(
    uridHash: string,
    aidType: AidType,
  ): Promise<EligibilityResult> {
    try {
      if (!uridHash || uridHash === "0x" || uridHash.length !== 66) {
        throw new Error("Invalid URID hash format");
      }

      const aidTypeValue = this.getAidTypeValue(aidType);
      const result = await this.distributionTracker.checkEligibility(
        uridHash,
        aidTypeValue,
      );

      return {
        eligible: result.eligible,
        timeUntilEligible: Number(result.timeUntilEligible),
      };
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return {
        eligible: false,
        timeUntilEligible: 0,
      };
    }
  }

  async getDistributionHistory(
    uridHash: string,
  ): Promise<ContractDistribution[]> {
    try {
      if (!uridHash || uridHash === "0x" || uridHash.length !== 66) {
        return [];
      }

      const distributions =
        await this.distributionTracker.getDistributionHistory(uridHash);

      return distributions.map((dist: any) => ({
        uridHash: dist.uridHash,
        volunteerNullifier: dist.volunteerNullifier,
        aidType: this.getAidTypeName(Number(dist.aidType)),
        timestamp: Number(dist.timestamp),
        quantity: Number(dist.quantity),
        location: dist.location,
        confirmed: dist.confirmed,
        exists: dist.exists,
      }));
    } catch (error) {
      console.error("Error getting distribution history:", error);
      return [];
    }
  }

  // Analytics & Statistics
  async getContractStats(): Promise<ContractStats> {
    try {
      const [registryStats, distributionStats] = await Promise.all([
        this.uridRegistry.getContractStats(),
        this.distributionTracker.getDistributionStats(),
      ]);

      return {
        totalFamilies: Number(registryStats.totalFamilies_),
        activeFamilies: Number(registryStats.activeFamilies),
        contractBalance: formatEther(registryStats.contractBalance),
      };
    } catch (error) {
      console.error("Error getting contract stats:", error);
      return {
        totalFamilies: 0,
        activeFamilies: 0,
        contractBalance: "0",
      };
    }
  }

  async getVolunteerStats(nullifier: string): Promise<VolunteerStats> {
    try {
      if (!nullifier || nullifier === "0x" || nullifier.length !== 66) {
        throw new Error("Invalid volunteer nullifier format");
      }

      const distributionCount =
        await this.distributionTracker.getVolunteerDistributionCount(nullifier);

      return {
        distributionCount: Number(distributionCount),
        verificationLevel: VerificationLevel.Orb, // Default for volunteers
      };
    } catch (error) {
      console.error("Error getting volunteer stats:", error);
      return {
        distributionCount: 0,
        verificationLevel: VerificationLevel.Device,
      };
    }
  }

  // Utility methods
  private async waitForConfirmation(tx: any): Promise<TransactionReceipt> {
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error("Transaction failed");
    }
    return receipt;
  }

  private handleTransactionError(error: any): TransactionResult {
    console.error("Contract transaction error:", error);

    let errorType: ContractErrorType = ContractErrorType.NETWORK_ERROR;
    let message = "Transaction failed";

    if (error.code === "INSUFFICIENT_FUNDS") {
      errorType = ContractErrorType.INSUFFICIENT_FUNDS;
      message = "Insufficient funds for transaction";
    } else if (error.code === "CALL_EXCEPTION" || error.reason) {
      errorType = ContractErrorType.CONTRACT_REVERT;
      message = error.reason || error.message || "Contract execution reverted";
    } else if (error.code === "TIMEOUT") {
      errorType = ContractErrorType.TIMEOUT;
      message = "Transaction timeout";
    } else if (error.message) {
      if (
        error.message.includes("invalid") ||
        error.message.includes("Invalid")
      ) {
        errorType = ContractErrorType.VALIDATION_FAILED;
      }
      message = error.message;
    }

    const contractError: ContractError = {
      type: errorType,
      message,
      originalError: error,
    };

    return {
      success: false,
      error: message,
    };
  }

  private getAidTypeValue(aidType: AidType): number {
    const aidTypeMap: Record<AidType, number> = {
      [AidType.FOOD]: 0,
      [AidType.MEDICAL]: 1,
      [AidType.SHELTER]: 2,
      [AidType.CLOTHING]: 3,
      [AidType.WATER]: 4,
      [AidType.CASH]: 5,
    };
    return aidTypeMap[aidType] ?? 0;
  }

  private getAidTypeName(aidTypeValue: number): AidType {
    const aidTypeMap: Record<number, AidType> = {
      0: AidType.FOOD,
      1: AidType.MEDICAL,
      2: AidType.SHELTER,
      3: AidType.CLOTHING,
      4: AidType.WATER,
      5: AidType.CASH,
    };
    return aidTypeMap[aidTypeValue] ?? AidType.FOOD;
  }

  // Public utility methods
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  getSigner(): Wallet | undefined {
    return this.signer;
  }

  getContractAddresses() {
    return this.config.contractAddresses;
  }

  getChainId(): number {
    return this.config.chainId;
  }
}

// Singleton instance
let contractServiceInstance: ContractService | null = null;

export const getContractService = (
  network: "testnet" | "mainnet" = "testnet",
): ContractService => {
  if (!contractServiceInstance) {
    contractServiceInstance = new ContractService(network);
  }
  return contractServiceInstance;
};

export default ContractService;
