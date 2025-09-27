'use client';

import { useState, useEffect, useCallback } from 'react';
import { VolunteerSession, VerificationError } from '@/types';
import {
  getVolunteerSession,
  storeVolunteerSession,
  clearVolunteerSession,
  isVolunteerAuthenticated,
  isSessionExpired,
  validateVolunteerSession,
  getSessionTimeRemaining
} from '@/lib/volunteer-session';

interface UseVolunteerSessionReturn {
  session: VolunteerSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: VerificationError | null;
  timeRemaining: number;
  login: (session: VolunteerSession) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

/**
 * React hook for managing volunteer session state
 */
export function useVolunteerSession(): UseVolunteerSessionReturn {
  const [session, setSession] = useState<VolunteerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<VerificationError | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Initialize session from localStorage on mount
  useEffect(() => {
    const storedSession = getVolunteerSession();
    if (storedSession) {
      setSession(storedSession);
      setTimeRemaining(getSessionTimeRemaining(storedSession));
    }
    setIsLoading(false);
  }, []);

  // Update time remaining every minute
  useEffect(() => {
    if (!session) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = getSessionTimeRemaining(session);
      setTimeRemaining(remaining);
      
      // Auto-logout if session expired
      if (remaining <= 0) {
        logout();
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, [session]);

  // Validate session with backend periodically
  useEffect(() => {
    if (!session) return;

    const validateSession = async () => {
      const result = await validateVolunteerSession(session);
      if (!result.valid) {
        setError(result.error || null);
        logout();
      }
    };

    // Validate immediately and then every 5 minutes
    validateSession();
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session]);

  const login = useCallback((newSession: VolunteerSession) => {
    storeVolunteerSession(newSession);
    setSession(newSession);
    setTimeRemaining(getSessionTimeRemaining(newSession));
    setError(null);
  }, []);

  const logout = useCallback(() => {
    clearVolunteerSession();
    setSession(null);
    setTimeRemaining(0);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const result = await validateVolunteerSession(session);
      if (!result.valid) {
        setError(result.error || null);
        logout();
      } else {
        setError(null);
      }
    } catch (err) {
      setError({
        code: 'REFRESH_FAILED',
        message: 'Failed to refresh session'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, logout]);

  return {
    session,
    isAuthenticated: session !== null && !isSessionExpired(session),
    isLoading,
    error,
    timeRemaining,
    login,
    logout,
    refresh
  };
}

/**
 * Hook for checking if volunteer has specific permissions
 */
export function useVolunteerPermissions(requiredPermissions: string[] = []) {
  const { session, isAuthenticated } = useVolunteerSession();
  
  const hasPermissions = useCallback((permissions: string[]) => {
    if (!session || !isAuthenticated) return false;
    
    return permissions.every(permission => 
      session.permissions.includes(permission as any)
    );
  }, [session, isAuthenticated]);
  
  const hasAllRequiredPermissions = hasPermissions(requiredPermissions);
  
  return {
    session,
    isAuthenticated,
    hasPermissions,
    hasAllRequiredPermissions,
    permissions: session?.permissions || []
  };
}