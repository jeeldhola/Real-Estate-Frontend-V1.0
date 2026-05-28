import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, subscribeUnauthorized } from "./api";
import { authStorage } from "./auth-storage";
import type { User } from "./api-types";

type AuthState = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ user: null, token: null, hydrated: false });

  // Hydrate from localStorage on mount (SSR-safe — runs only in browser).
  useEffect(() => {
    setState({
      user: authStorage.getUser(),
      token: authStorage.getToken(),
      hydrated: true,
    });
  }, []);

  // Global 401 listener — clear local state if the API rejects our token.
  useEffect(() => {
    return subscribeUnauthorized(() => {
      authStorage.clear();
      setState((s) => ({ ...s, user: null, token: null }));
      queryClient.clear();
    });
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ token: string; user: User }>("/api/auth/login", {
        email,
        password,
      });
      authStorage.set(res.token, res.user);
      setState({ user: res.user, token: res.token, hydrated: true });
      queryClient.clear();
      return res.user;
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    authStorage.clear();
    setState({ user: null, token: null, hydrated: true });
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
