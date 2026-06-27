"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiClient, ApiError } from "@/lib/api/client";
import type { Me, SessionCreate } from "@/lib/api/models";
import { makeFakeToken } from "./fakeToken";

const TOKEN_KEY = "crafton.token";
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "fake";

type AuthContextValue = {
  token: string | null;
  me: Me | null;
  loading: boolean;
  api: ApiClient;
  loginWithPhone: (phone: string, code: string) => Promise<{ needsSignup: boolean }>;
  completeSignup: (body: SessionCreate) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function obtainToken(phone: string, _code: string): Promise<string> {
  if (AUTH_MODE === "firebase") {
    // Integration point: run Firebase phone-OTP here and return the ID token.
    // Phase 1 dev/CI/E2E use the fake verifier; wire firebase-web when going live.
    throw new ApiError(0, "auth_mode", "Firebase auth mode is not bundled in this build.");
  }
  return makeFakeToken(phone);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const api = useMemo(() => new ApiClient(token), [token]);

  const fetchMe = useCallback(async (t: string) => {
    try {
      setMe(await new ApiClient(t).me());
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    void fetchMe(stored).finally(() => setLoading(false));
  }, [fetchMe]);

  const loginWithPhone = useCallback(
    async (phone: string, code: string) => {
      const t = await obtainToken(phone, code);
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      try {
        setMe(await new ApiClient(t).me());
        return { needsSignup: false };
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return { needsSignup: true };
        throw e;
      }
    },
    [],
  );

  const completeSignup = useCallback(
    async (body: SessionCreate) => {
      if (!token) throw new Error("no token");
      await new ApiClient(token).createSession(body);
      await fetchMe(token);
    },
    [token, fetchMe],
  );

  const refresh = useCallback(async () => {
    if (token) await fetchMe(token);
  }, [token, fetchMe]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setMe(null);
  }, []);

  const value: AuthContextValue = {
    token,
    me,
    loading,
    api,
    loginWithPhone,
    completeSignup,
    refresh,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
