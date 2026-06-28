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
import {
  ACCOUNTS_STORAGE_KEY,
  forgetAccount as forgetAccountStore,
  loadAccounts,
  rememberAccount,
  type RememberedAccount,
} from "./accounts";
import { makeFakeToken } from "./fakeToken";

const TOKEN_KEY = "crafton.token";
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "fake";

type AuthContextValue = {
  token: string | null;
  me: Me | null;
  loading: boolean;
  api: ApiClient;
  authMode: string;
  accounts: RememberedAccount[];
  loginWithPhone: (phone: string, code: string) => Promise<{ needsSignup: boolean }>;
  switchAccount: (phone: string) => Promise<{ needsSignup: boolean }>;
  forgetAccount: (phone: string) => void;
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
  const [accounts, setAccounts] = useState<RememberedAccount[]>([]);

  const api = useMemo(() => new ApiClient(token), [token]);

  // Record the signed-in identity (non-secret) so it can be re-used later.
  const remember = useCallback((m: Me) => {
    setAccounts(
      rememberAccount({
        phone: m.user.phone_number,
        displayName: m.user.display_name,
        role: m.user.user_type,
      }),
    );
  }, []);

  const fetchMe = useCallback(
    async (t: string): Promise<Me | null> => {
      try {
        const m = await new ApiClient(t).me();
        setMe(m);
        remember(m);
        return m;
      } catch {
        setMe(null);
        return null;
      }
    },
    [remember],
  );

  // Hydrate from localStorage on mount.
  useEffect(() => {
    setAccounts(loadAccounts());
    const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    void fetchMe(stored).finally(() => setLoading(false));
  }, [fetchMe]);

  // Keep tabs in sync (login/logout/account changes in another tab).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        const next = e.newValue;
        if (!next) {
          setToken(null);
          setMe(null);
        } else {
          setToken(next);
          void fetchMe(next);
        }
      } else if (e.key === ACCOUNTS_STORAGE_KEY) {
        setAccounts(loadAccounts());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchMe]);

  const loginWithPhone = useCallback(
    async (phone: string, code: string) => {
      const prevToken =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      const t = await obtainToken(phone, code);
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      let m: Me;
      try {
        m = await new ApiClient(t).me();
      } catch (e) {
        // Valid token but no app user yet → needs signup. Keep the new token (the
        // onboarding step uses it) but clear any stale identity from a prior account.
        if (e instanceof ApiError && e.status === 401) {
          setMe(null);
          return { needsSignup: true };
        }
        // Unexpected failure (network/5xx): roll back so a failed switch doesn't
        // strand the app with a new token but the previous account's `me`.
        if (prevToken) {
          localStorage.setItem(TOKEN_KEY, prevToken);
          setToken(prevToken);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
        throw e;
      }
      setMe(m);
      remember(m);
      return { needsSignup: false };
    },
    [remember],
  );

  // Switch to a remembered account. In fake mode this is a no-OTP re-login; in
  // firebase mode obtainToken throws and the caller falls back to the phone form.
  const switchAccount = useCallback(
    (phone: string) => loginWithPhone(phone, ""),
    [loginWithPhone],
  );

  const forgetAccount = useCallback(
    (phone: string) => {
      setAccounts(forgetAccountStore(phone));
      // Forgetting the active account also ends its session — otherwise the next
      // /me fetch would silently re-add it and the device would stay signed in.
      if (me?.user.phone_number === phone) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setMe(null);
      }
    },
    [me],
  );

  const completeSignup = useCallback(
    async (body: SessionCreate) => {
      // Fall back to the freshly-stored token: when signup runs right after
      // loginWithPhone in the same handler, the `token` state hasn't re-rendered
      // yet, but localStorage was already set synchronously.
      const t =
        token ?? (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
      if (!t) throw new Error("no token");
      await new ApiClient(t).createSession(body);
      await fetchMe(t);
    },
    [token, fetchMe],
  );

  const refresh = useCallback(async () => {
    if (token) await fetchMe(token);
  }, [token, fetchMe]);

  // Ends the active session; keeps the remembered-accounts list for quick re-login.
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
    authMode: AUTH_MODE,
    accounts,
    loginWithPhone,
    switchAccount,
    forgetAccount,
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
