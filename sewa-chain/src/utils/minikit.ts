import { MiniKit } from "@worldcoin/minikit-js";

/**
 * Check if MiniKit is properly installed and available
 */
export const checkMiniKitAvailability = (): {
  isAvailable: boolean;
  error?: string;
} => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return {
        isAvailable: false,
        error: "Not running in browser environment",
      };
    }

    // Check if MiniKit is installed
    if (!MiniKit.isInstalled()) {
      return {
        isAvailable: false,
        error: "World App is required. Please open this app inside World App.",
      };
    }

    return { isAvailable: true };
  } catch (error) {
    return {
      isAvailable: false,
      error: error instanceof Error ? error.message : "Unknown MiniKit error",
    };
  }
};

/**
 * Validate that required environment variables are set
 */
export const validateEnvironment = (): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_URID_REGISTRY_ADDRESS) {
    errors.push("URID Registry contract address not configured");
  }

  if (!process.env.NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS) {
    errors.push("Distribution Tracker contract address not configured");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate URID hash from UUID (consistent across the app)
 */
export const generateURIDHash = (uuid: string): string => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hashHex = Math.abs(hash).toString(16).padStart(64, "0");
  return "0x" + hashHex;
};
