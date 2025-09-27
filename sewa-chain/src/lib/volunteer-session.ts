import { VolunteerSession, VerificationError } from "@/types";

/**
 * Volunteer Session Management Utilities
 * Handles client-side session storage and validation
 */

const VOLUNTEER_SESSION_KEY = "volunteer_session";
const SESSION_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer

/**
 * Store volunteer session in localStorage
 */
export function storeVolunteerSession(session: VolunteerSession): void {
  try {
    localStorage.setItem(VOLUNTEER_SESSION_KEY, JSON.stringify(session));
    console.log("Volunteer session stored:", session.volunteerId);
  } catch (error) {
    console.error("Failed to store volunteer session:", error);
  }
}

/**
 * Retrieve volunteer session from localStorage
 */
export function getVolunteerSession(): VolunteerSession | null {
  try {
    const stored = localStorage.getItem(VOLUNTEER_SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as VolunteerSession;

    // Check if session is expired
    if (isSessionExpired(session)) {
      clearVolunteerSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to retrieve volunteer session:", error);
    return null;
  }
}

/**
 * Clear volunteer session from localStorage
 */
export function clearVolunteerSession(): void {
  try {
    localStorage.removeItem(VOLUNTEER_SESSION_KEY);
    console.log("Volunteer session cleared");
  } catch (error) {
    console.error("Failed to clear volunteer session:", error);
  }
}

/**
 * Check if the volunteer is currently authenticated
 */
export function isVolunteerAuthenticated(): boolean {
  const session = getVolunteerSession();
  return session !== null && !isSessionExpired(session);
}

/**
 * Check if a session is expired (with buffer)
 */
export function isSessionExpired(session: VolunteerSession): boolean {
  const now = Date.now();
  return now >= session.expiresAt - SESSION_EXPIRY_BUFFER;
}

/**
 * Get time remaining until session expires (in milliseconds)
 */
export function getSessionTimeRemaining(session: VolunteerSession): number {
  const now = Date.now();
  return Math.max(0, session.expiresAt - now);
}

/**
 * Format session time remaining as human-readable string
 */
export function formatSessionTimeRemaining(session: VolunteerSession): string {
  const remaining = getSessionTimeRemaining(session);

  if (remaining <= 0) {
    return "Expired";
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}

// validateVolunteerSession removed - no server validation needed for hackathon demo

/**
 * Check if volunteer has specific permission
 */
export function hasPermission(
  session: VolunteerSession,
  permission: string,
): boolean {
  return session.permissions.includes(permission as any);
}

/**
 * Get volunteer display information
 */
export function getVolunteerDisplayInfo(session: VolunteerSession) {
  return {
    id: session.volunteerId,
    verificationLevel: session.verificationLevel,
    verifiedAt: new Date(session.verifiedAt).toLocaleDateString(),
    timeRemaining: formatSessionTimeRemaining(session),
    permissions: session.permissions,
    organizationId: session.organizationId,
  };
}

/**
 * Create a session refresh hook for React components
 * @deprecated Use useVolunteerSession hook instead for centralized session management
 */
export function useSessionRefresh(session: VolunteerSession | null) {
  console.warn(
    "useSessionRefresh is deprecated. Use useVolunteerSession hook instead.",
  );
  return () => {};
}
