"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ErrorText } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";

type Mode = "login" | "signup";
type Role = "worker" | "contractor";

export default function LoginPage() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const {
    loginWithPhone,
    loginWithPassword,
    switchAccount,
    forgetAccount,
    completeSignup,
    accounts,
    authMode,
  } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  // Signup starts by choosing a role — that is the first decision, before phone.
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const goAfterLogin = (needsSignup: boolean) =>
    router.replace(needsSignup ? "/onboarding" : "/");

  const reset = () => {
    setRole(null);
    setName("");
    setPhone("");
    setCode("");
    setCodeSent(false);
    setUsePassword(false);
    setPassword("");
    setError("");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    reset();
  };

  const pickAccount = async (accountPhone: string) => {
    setError("");
    // Firebase mode can't skip OTP — pre-fill the phone and ask for the code.
    if (authMode === "firebase") {
      setPhone(accountPhone);
      setCodeSent(true);
      return;
    }
    setBusy(true);
    try {
      const { needsSignup } = await switchAccount(accountPhone);
      goAfterLogin(needsSignup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login" && usePassword) {
        await loginWithPassword(phone, password);
        router.replace("/");
        return;
      }
      const { needsSignup } = await loginWithPhone(phone, code);
      if (mode === "signup" && needsSignup && role) {
        // Role was chosen up front; create the account, then go finish the profile.
        await completeSignup({ user_type: role, display_name: name });
        router.replace("/onboarding");
      } else {
        // Existing account (or login mode) → straight in.
        goAfterLogin(needsSignup);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-sm space-y-4">
        <h1 className="text-xl font-bold">
          {mode === "login" ? t("loginTitle") : t("signupTab")}
        </h1>

        {/* Sign up: choose role FIRST, before entering any details. */}
        {mode === "signup" && !role ? (
          <div className="card space-y-3">
            <h1 className="text-lg font-bold">{t("chooseRole")}</h1>
            <div className="flex flex-col gap-2">
              <button className="btn-primary" onClick={() => setRole("worker")}>
                {t("roleWorker")}
              </button>
              <button className="btn-secondary" onClick={() => setRole("contractor")}>
                {t("roleContractor")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {mode === "login" && accounts.length > 0 && (
              <div className="card space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {t("recentAccounts")}
                </p>
                {accounts.map((a) => (
                  <div key={a.phone} className="flex items-center justify-between">
                    <button
                      onClick={() => pickAccount(a.phone)}
                      disabled={busy}
                      className="flex-1 rounded px-2 py-2 text-left hover:bg-gray-100"
                    >
                      <span className="font-medium">{a.displayName}</span>{" "}
                      <span className="text-xs text-gray-500">{a.role}</span>
                      <span className="block text-xs text-gray-400">{a.phone}</span>
                    </button>
                    <button
                      onClick={() => forgetAccount(a.phone)}
                      aria-label={t("forgetNamed", { name: a.displayName })}
                      className="px-3 py-2 text-gray-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={submit} className="card space-y-4">
              {mode === "signup" && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ← {t("chooseRole")}
                </button>
              )}
              {mode === "login" && accounts.length > 0 && (
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {t("useAnotherNumber")}
                </p>
              )}

              {mode === "signup" && (
                <div>
                  <label className="field-label" htmlFor="name">
                    {t("displayName")}
                  </label>
                  <input
                    id="name"
                    className="field-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="field-label" htmlFor="phone">
                  {t("phoneLabel")}
                </label>
                <input
                  id="phone"
                  className="field-input"
                  placeholder={t("phonePlaceholder")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {mode === "login" && usePassword ? (
                <>
                  <div>
                    <label className="field-label" htmlFor="password">
                      {t("passwordLabel")}
                    </label>
                    <input
                      id="password"
                      type="password"
                      className="field-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={busy || !phone || !password}
                  >
                    {busy ? common("loading") : t("verify")}
                  </button>
                </>
              ) : !codeSent ? (
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={!phone || (mode === "signup" && !name)}
                  onClick={() => setCodeSent(true)}
                >
                  {t("sendCode")}
                </button>
              ) : (
                <>
                  <div>
                    <label className="field-label" htmlFor="code">
                      {t("codeLabel")}
                    </label>
                    <input
                      id="code"
                      className="field-input"
                      placeholder={t("codePlaceholder")}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-400">{t("devHint")}</p>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={busy || !code}
                  >
                    {busy
                      ? common("loading")
                      : mode === "signup"
                        ? t("createAccount")
                        : t("verify")}
                  </button>
                </>
              )}
              {/* Toggle OTP ⇄ password for returning logins. */}
              {mode === "login" && (
                <button
                  type="button"
                  className="text-xs text-brand underline"
                  onClick={() => {
                    setUsePassword((v) => !v);
                    setCode("");
                    setCodeSent(false);
                    setPassword("");
                    setError("");
                  }}
                >
                  {usePassword ? t("useSmsCode") : t("usePassword")}
                </button>
              )}
              <ErrorText message={error} />
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500">
          {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
          <button
            type="button"
            className="font-medium text-brand underline"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? t("signupTab") : t("loginTitle")}
          </button>
        </p>
      </div>
    </AppShell>
  );
}
