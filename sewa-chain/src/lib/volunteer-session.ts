import { VolunteerSession, VerificationError } from '@/types';

/**
 * Volunteer Session Management Utilities
 * Handles client-side session storage and validation
 */

const VOLUNTEER_SESSION_KEY = 'volunteer_session';
const SESSION_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer

/**
 * Store volunteer session in localStorage
 */
export function storeVolunteerSession(session: VolunteerSession): void {
  try {
    localStorage.setItem(VOLUNTEER_SESSION_KEY, JSON.stringify(session));
    console.log('Volunteer session stored:', session.volunteerId);
  } catch (error) {
    console.error('Failed to store volunteer session:', error);
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
    console.error('Failed to retrieve volunteer session:', error);
    return null;
  }
}

/**
 * Clear volunteer session from localStorage
 */
export function clearVolunteerSession(): void {
  try {
    localStorage.removeItem(VOLUNTEER_SESSION_KEY);
    console.log('Volunteer session cleared');
  } catch (error) {
    console.error('Failed to clear volunteer session:', error);
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
  return now >= (session.expiresAt - SESSION_EXPIRY_BUFFER);
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
    return 'Expired';
  }
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}

/**
 * Validate volunteer session with backend
 */
export async function validateVolunteerSession(
  session: VolunteerSession
): Promise<{ valid: boolean; error?: VerificationError }> {
  try {
    const response = await fetch('/api/verify-volunteer', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.sessionToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return { valid: true };
    } else {
      return {
        valid: false,
        error: {
          code: data.error?.code || 'VALIDATION_FAILED',
          message: data.error?.message || 'Session validation failed'
        }
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to validate session with server'
      }
    };
  }
}

/**
 * Check if volunteer has specific permission
 */
export function hasPermission(
  session: VolunteerSession,
  permission: string
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
    organizationId: session.organizationId
  };
}

/**
 * Create a session refresh hook for React components
 */
export function useSessionRefresh(session: VolunteerSession | null) {
  if (typeof window === 'undefined') return;
  
  // Set up automatic session validation every 5 minutes
  const interval = setInterval(async () => {
    if (session) {
      const result = await validateVolunteerSession(session);
      if (!result.valid) {
        clearVolunteerSession();
        // Optionally trigger a page refresh or redirect
        window.location.reload();
      }
    }
  }, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}"
