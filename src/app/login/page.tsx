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
    loginWithIdentifier,
    forgetAccount,
    completeSignup,
    accounts,
  } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  // Signup starts by choosing a role — that is the first decision, before details.
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  // Login: a single identifier (username / email / phone).
  const [identifier, setIdentifier] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const goAfterLogin = (needsSignup: boolean) =>
    router.replace(needsSignup ? "/onboarding" : "/");

  const reset = () => {
    setRole(null);
    setName("");
    setUsername("");
    setEmail("");
    setPhone("");
    setPassword("");
    setIdentifier("");
    setCode("");
    setCodeSent(false);
    setError("");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    reset();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await loginWithIdentifier(identifier, password);
        router.replace("/");
        return;
      }
      // Signup: OTP proves phone ownership, then we register the credentials.
      const { needsSignup } = await loginWithPhone(phone, code);
      if (needsSignup && role) {
        await completeSignup({
          user_type: role,
          display_name: name,
          username,
          email,
          password,
        });
        router.replace("/onboarding");
      } else {
        // Phone already has an account → straight in.
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
                      onClick={() => setIdentifier(a.phone)}
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

              {mode === "login" ? (
                <>
                  <div>
                    <label className="field-label" htmlFor="identifier">
                      {t("identifierLabel")}
                    </label>
                    <input
                      id="identifier"
                      className="field-input"
                      placeholder={t("identifierPlaceholder")}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
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
                    disabled={busy || !identifier || !password}
                  >
                    {busy ? common("loading") : t("verify")}
                  </button>
                </>
              ) : (
                <>
                  {/* Signup: collect identity + credentials, then verify phone by SMS. */}
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
                  <div>
                    <label className="field-label" htmlFor="username">
                      {t("usernameLabel")}
                    </label>
                    <input
                      id="username"
                      className="field-input"
                      placeholder={t("usernamePlaceholder")}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoCapitalize="none"
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="email">
                      {t("emailLabel")}
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="field-input"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoCapitalize="none"
                      required
                    />
                  </div>
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
                  <div>
                    <label className="field-label" htmlFor="signup-password">
                      {t("passwordLabel")}
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      className="field-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {!codeSent ? (
                    <button
                      type="button"
                      className="btn-primary w-full"
                      disabled={!name || !username || !email || !phone || !password}
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
                        {busy ? common("loading") : t("createAccount")}
                      </button>
                    </>
                  )}
                </>
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
