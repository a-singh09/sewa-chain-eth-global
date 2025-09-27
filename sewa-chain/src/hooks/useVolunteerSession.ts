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
    const initializeSession = async () => {
      const storedSession = getVolunteerSession();
      console.log("Loading volunteer session from localStorage:", {
        hasSession: !!storedSession,
        sessionId: storedSession?.volunteerId,
        hasToken: !!storedSession?.sessionToken,
        tokenPreview: storedSession?.sessionToken?.substring(0, 10) + "...",
      });

      if (storedSession) {
        setSession(storedSession);
        setTimeRemaining(getSessionTimeRemaining(storedSession));

        // Restore session to server-side store if needed
        console.log("🔄 Attempting to restore session to server store...");
        try {
          const restoreResponse = await fetch(
            "/api/volunteer-session/restore",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                volunteerSession: storedSession,
              }),
            },
          );

          console.log("📡 Restore response status:", restoreResponse.status);

          if (!restoreResponse.ok) {
            const errorData = await restoreResponse.json();
            console.error("❌ Session restoration failed:", errorData);
            if (errorData.error?.code === "SESSION_EXPIRED") {
              console.log(
                "⏰ Session expired during initialization, logging out...",
              );
              clearVolunteerSession();
              setSession(null);
              setTimeRemaining(0);
            } else {
              console.warn(
                "⚠️ Session restoration failed but keeping session:",
                errorData,
              );
              // Don't clear session for other errors, user can retry
            }
          } else {
            const successData = await restoreResponse.json();
            console.log(
              "✅ Session successfully restored to server store:",
              successData,
            );
          }
        } catch (error) {
          console.error("🌐 Session restoration network error:", error);
          // Don't clear session for network errors, user can retry
        }
      }
      setIsLoading(false);
    };

    initializeSession();
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

      // Ensure session is also registered in server-side store
      // This handles the case where localStorage has the session but server store doesn't
      try {
        const restoreResponse = await fetch("/api/volunteer-session/restore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            volunteerSession: currentSession,
          }),
        });

        if (!restoreResponse.ok) {
          const errorData = await restoreResponse.json();
          if (errorData.error?.code === "SESSION_EXPIRED") {
            console.log("Session expired, logging out...");
            logout();
          } else {
            console.warn("Session restoration failed:", errorData);
          }
        } else {
          console.log("Session restored to server store");
        }
      } catch (error) {
        console.warn("Session restoration failed:", error);
      }
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
