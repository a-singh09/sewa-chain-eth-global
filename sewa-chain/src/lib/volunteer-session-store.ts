import { VolunteerSession } from "@/types";

/**
 * Shared volunteer session store for demo purposes
 * In production, this should be replaced with a proper database or Redis
 */
class VolunteerSessionStore {
  private sessions = new Map<string, VolunteerSession>();

  /**
   * Store a volunteer session
   */
  setSession(sessionToken: string, session: VolunteerSession): void {
    console.log("💾 Storing session in server store:", {
      token: sessionToken?.substring(0, 10) + "...",
      volunteerId: session.volunteerId,
      totalSessions: this.sessions.size + 1,
    });
    this.sessions.set(sessionToken, session);
  }

  /**
   * Retrieve a volunteer session by token
   */
  getSession(sessionToken: string): VolunteerSession | undefined {
    return this.sessions.get(sessionToken);
  }

  /**
   * Remove a volunteer session
   */
  removeSession(sessionToken: string): boolean {
    return this.sessions.delete(sessionToken);
  }

  /**
   * Check if a session exists and is valid
   */
  isValidSession(sessionToken: string): boolean {
    console.log("Validating session token:", {
      token: sessionToken?.substring(0, 10) + "...",
      hasToken: !!sessionToken,
      totalSessions: this.sessions.size,
    });

    if (!sessionToken) {
      console.log("No session token provided");
      return false;
    }

    const session = this.sessions.get(sessionToken);
    if (!session) {
      console.log("Session not found in store");
      return false;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      console.log("Session expired, cleaning up");
      // Clean up expired session
      this.sessions.delete(sessionToken);
      return false;
    }

    console.log("Session is valid");
    return true;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get all active sessions (for debugging)
   */
  getActiveSessions(): VolunteerSession[] {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      (session) => now <= session.expiresAt,
    );
  }
}

// Export singleton instance
export const volunteerSessionStore = new VolunteerSessionStore();
