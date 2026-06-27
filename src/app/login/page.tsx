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
  const { loginWithPhone } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { needsSignup } = await loginWithPhone(phone, code);
      router.replace(needsSignup ? "/onboarding" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-sm">
        <h1 className="mb-4 text-xl font-bold">{t("loginTitle")}</h1>
        <form onSubmit={verify} className="card space-y-4">
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
