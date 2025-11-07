import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, AuthSession } from "@/lib/auth";

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const currentSession = authService.getSession();
    setSession(currentSession);
  }, []);

  const login = (email: string, password: string): boolean => {
    const success = authService.login(email, password);
    if (success) {
      setSession(authService.getSession());
    }
    return success;
  };

  const logout = () => {
    authService.logout();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, isAuthenticated: !!session, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
