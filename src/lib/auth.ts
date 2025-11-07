// TODO: Move credentials to environment variables for production
// For now, hardcoded as requested

const CREDENTIALS = {
  email: "gundluru.mahammadwahab@nxtwave.co.in",
  password: "NxtWave%5405@",
};

export interface AuthSession {
  email: string;
  expiresAt: number;
}

const SESSION_KEY = "dash_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export const authService = {
  login(email: string, password: string): boolean {
    if (email === CREDENTIALS.email && password === CREDENTIALS.password) {
      const session: AuthSession = {
        email,
        expiresAt: Date.now() + SESSION_DURATION,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession(): AuthSession | null {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    try {
      const session: AuthSession = JSON.parse(sessionStr);
      if (session.expiresAt < Date.now()) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  },
};
