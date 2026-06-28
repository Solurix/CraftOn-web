"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ErrorText } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";

export default function LoginPage() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const { loginWithPhone, switchAccount, forgetAccount, accounts, authMode } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const goAfterLogin = (needsSignup: boolean) =>
    router.replace(needsSignup ? "/onboarding" : "/");

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

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { needsSignup } = await loginWithPhone(phone, code);
      goAfterLogin(needsSignup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-sm space-y-4">
        <h1 className="text-xl font-bold">{t("loginTitle")}</h1>

        {accounts.length > 0 && (
          <div className="card space-y-2">
            <p className="text-xs uppercase tracking-wide text-gray-400">{t("recentAccounts")}</p>
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
                  aria-label={t("forget")}
                  className="px-2 text-gray-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={verify} className="card space-y-4">
          {accounts.length > 0 && (
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {t("useAnotherNumber")}
            </p>
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

          {!codeSent ? (
            <button
              type="button"
              className="btn-primary w-full"
              disabled={!phone}
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
              <button type="submit" className="btn-primary w-full" disabled={busy || !code}>
                {busy ? common("loading") : t("verify")}
              </button>
            </>
          )}
          <ErrorText message={error} />
        </form>
      </div>
    </AppShell>
  );
}
