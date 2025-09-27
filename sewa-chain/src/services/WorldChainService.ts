"use client";

import { MiniKit } from "@worldcoin/minikit-js";

/**
 * World Chain Service for integrating with World Chain APIs and MiniKit
 * Based on World Chain LLM documentation functions
 */
export class WorldChainService {
  private static readonly BASE_URL = "https://developer.worldcoin.org";
  private static readonly APP_ID = process.env.NEXT_PUBLIC_APP_ID;
  private static readonly API_KEY = process.env.DEV_PORTAL_API_KEY;

  /**
   * Get current token prices from World Chain
   * Uses: GET /public/v1/miniapps/prices
   */
  static async getTokenPrices(
    currencies: string[] = ["USD", "EUR"],
  ): Promise<any> {
    try {
      const currencyParams = currencies.map((c) => `currencies=${c}`).join("&");
      const response = await fetch(
        `${this.BASE_URL}/public/v1/miniapps/prices?${currencyParams}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch token prices: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching token prices:", error);
      throw error;
    }
  }

  /**
   * Get transaction status from World Chain
   * Uses: GET /api/v2/minikit/transaction/{transaction_id}
   */
  static async getTransactionStatus(transactionId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/api/v2/minikit/transaction/${transactionId}?app_id=${this.APP_ID}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch transaction status: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching transaction status:", error);
      throw error;
    }
  }

  /**
   * Get transaction debug URL for failed transactions
   * Uses: GET /api/v2/minikit/transaction/debug
   */
  static async getTransactionDebugUrl(transactionId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/api/v2/minikit/transaction/debug?transaction_id=${transactionId}&app_id=${this.APP_ID}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch debug URL: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching transaction debug URL:", error);
      throw error;
    }
  }

  /**
   * Send notification to users
   * Uses: POST /api/v2/minikit/send-notification
   */
  static async sendNotification(
    walletAddresses: string[],
    title: string,
    message: string,
    miniAppPath?: string,
  ): Promise<any> {
    try {
      const payload = {
        app_id: this.APP_ID,
        wallet_addresses: walletAddresses,
        localisations: [
          {
            language: "en",
            title: title,
            message: message,
          },
        ],
        ...(miniAppPath && { mini_app_path: miniAppPath }),
      };

      const response = await fetch(
        `${this.BASE_URL}/api/v2/minikit/send-notification`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  /**
   * Verify World ID proof
   * Uses: POST /api/v2/verify/{app_id}
   */
  static async verifyWorldIdProof(
    proof: string,
    merkleRoot: string,
    nullifierHash: string,
    action: string,
    signal?: string,
  ): Promise<any> {
    try {
      const payload = {
        proof,
        merkle_root: merkleRoot,
        nullifier_hash: nullifierHash,
        action,
        ...(signal && { signal }),
      };

      const response = await fetch(
        `${this.BASE_URL}/api/v2/verify/${this.APP_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to verify World ID proof: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error verifying World ID proof:", error);
      throw error;
    }
  }

  /**
   * Create incognito action
   * Uses: POST /api/v2/create-action/{app_id}
   */
  static async createIncognitoAction(
    actionName: string,
    description: string,
    maxVerifications?: number,
  ): Promise<any> {
    try {
      const payload = {
        name: actionName,
        description: description,
        ...(maxVerifications && { max_verifications: maxVerifications }),
      };

      const response = await fetch(
        `${this.BASE_URL}/api/v2/create-action/${this.APP_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create incognito action: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating incognito action:", error);
      throw error;
    }
  }

  /**
   * Get user grant cycle information
   * Uses: GET /api/v2/minikit/user-grant-cycle
   */
  static async getUserGrantCycle(walletAddress: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/api/v2/minikit/user-grant-cycle?wallet_address=${walletAddress}&app_id=${this.APP_ID}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch user grant cycle: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user grant cycle:", error);
      throw error;
    }
  }

  /**
   * Enhanced transaction monitoring with World Chain API
   */
  static async monitorTransactionWithWorldChain(
    transactionId: string,
    onStatusUpdate?: (status: any) => void,
    maxRetries: number = 30,
    retryInterval: number = 2000,
  ): Promise<any> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const status = await this.getTransactionStatus(transactionId);

        if (onStatusUpdate) {
          onStatusUpdate(status);
        }

        // Check if transaction is completed (success or failed)
        if (
          status.transactionStatus === "mined" ||
          status.transactionStatus === "failed"
        ) {
          return status;
        }

        // Wait before next retry
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
        retries++;
      } catch (error) {
        console.error(
          `Error monitoring transaction (attempt ${retries + 1}):`,
          error,
        );

        // If we can't get status, try debug URL for failed transactions
        if (retries > 5) {
          try {
            const debugInfo = await this.getTransactionDebugUrl(transactionId);
            console.log("Transaction debug info:", debugInfo);
          } catch (debugError) {
            console.error("Error getting debug info:", debugError);
          }
        }

        retries++;
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }

    throw new Error(
      `Transaction monitoring timed out after ${maxRetries} attempts`,
    );
  }

  /**
   * Send aid distribution notification to family
   */
  static async notifyAidDistribution(
    walletAddress: string,
    aidType: string,
    quantity: number,
    location: string,
  ): Promise<any> {
    const title = "🎁 Aid Distribution Received";
    const message = `You received ${quantity} units of ${aidType} aid at ${location}. Thank you for using SewaChain!`;
    const miniAppPath = `worldapp://mini-app?app_id=${this.APP_ID}&path=/distribution-history`;

    return this.sendNotification([walletAddress], title, message, miniAppPath);
  }

  /**
   * Send volunteer verification success notification
   */
  static async notifyVolunteerVerified(walletAddress: string): Promise<any> {
    const title = "✅ Volunteer Verification Complete";
    const message =
      "You're now verified as a SewaChain volunteer! Start distributing aid to families in need.";
    const miniAppPath = `worldapp://mini-app?app_id=${this.APP_ID}&path=/volunteer/dashboard`;

    return this.sendNotification([walletAddress], title, message, miniAppPath);
  }

  /**
   * Send family registration success notification
   */
  static async notifyFamilyRegistered(
    walletAddress: string,
    urid: string,
  ): Promise<any> {
    const title = "🏠 Family Registration Complete";
    const message = `Your family is now registered with URID: ${urid}. You can now receive aid distributions.`;
    const miniAppPath = `worldapp://mini-app?app_id=${this.APP_ID}&path=/family-status`;

    return this.sendNotification([walletAddress], title, message, miniAppPath);
  }

  /**
   * Get WLD token price in USD for aid calculations
   */
  static async getWLDPrice(): Promise<number> {
    try {
      const prices = await this.getTokenPrices(["USD"]);
      return prices?.WLD?.USD || 0;
    } catch (error) {
      console.error("Error fetching WLD price:", error);
      return 0;
    }
  }

  /**
   * Calculate aid value in USD based on WLD price
   */
  static async calculateAidValueUSD(wldAmount: number): Promise<number> {
    const wldPrice = await this.getWLDPrice();
    return wldAmount * wldPrice;
  }

  /**
   * Validate World Chain configuration
   */
  static validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.APP_ID) {
      errors.push("World ID App ID not configured");
    }

    if (!this.API_KEY) {
      errors.push("Developer Portal API Key not configured");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if World Chain services are available
   */
  static async checkServiceHealth(): Promise<boolean> {
    try {
      // Try to fetch token prices as a health check
      await this.getTokenPrices(["USD"]);
      return true;
    } catch (error) {
      console.error("World Chain service health check failed:", error);
      return false;
    }
  }

  /**
   * Get formatted transaction URL for World Chain explorer
   */
  static getTransactionUrl(transactionHash: string): string {
    const network = process.env.NEXT_PUBLIC_NETWORK || "testnet";
    const baseUrl =
      network === "mainnet"
        ? "https://worldchain.blockscout.com"
        : "https://worldchain-sepolia.blockscout.com";

    return `${baseUrl}/tx/${transactionHash}`;
  }

  /**
   * Format wallet address for notifications
   */
  static formatWalletAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}
