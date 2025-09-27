"use client";

import { useState, useEffect, useCallback } from "react";
import { VolunteerSession, VerificationError } from "@/types";
import {
  getVolunteerSession,
  storeVolunteerSession,
  clearVolunteerSession,
  isVolunteerAuthenticated,
  isSessionExpired,
  getSessionTimeRemaining,
} from "@/lib/volunteer-session";

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
 * Simplified React hook for managing volunteer session state
 * No periodic validation - just check localStorage
 */
export function useVolunteerSession(): UseVolunteerSessionReturn {
  const [session, setSession] = useState<VolunteerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<VerificationError | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

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
  }, [session, logout]);

  const refresh = useCallback(async () => {
    // For hackathon: just refresh from localStorage, no API calls
    const currentSession = getVolunteerSession();
    if (currentSession) {
      setSession(currentSession);
      setTimeRemaining(getSessionTimeRemaining(currentSession));
      setError(null);
    } else {
      logout();
    }
  }, [logout]);

  return {
    session,
    isAuthenticated: session !== null && !isSessionExpired(session),
    isLoading,
    error,
    timeRemaining,
    login,
    logout,
    refresh,
  };
}

/**
 * Hook for checking if volunteer has specific permissions
 */
export function useVolunteerPermissions(requiredPermissions: string[] = []) {
  const { session, isAuthenticated } = useVolunteerSession();

  const hasPermissions = useCallback(
    (permissions: string[]) => {
      if (!session || !isAuthenticated) return false;

      return permissions.every((permission) =>
        session.permissions.includes(permission as any),
      );
    },
    [session, isAuthenticated],
  );

  const hasAllRequiredPermissions = hasPermissions(requiredPermissions);

  return {
    session,
    isAuthenticated,
    hasPermissions,
    hasAllRequiredPermissions,
    permissions: session?.permissions || [],
  };
}
