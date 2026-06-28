"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/lib/auth/context";

// Header account chip + dropdown: shows the current account and lets the user
// switch to another remembered account (one tap in fake mode), add a new one,
// or log out. Remembered accounts persist across reloads on the device.
export function AccountMenu() {
  const { me, accounts, switchAccount, forgetAccount, logout, authMode } = useAuth();
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!me) return null;
  const others = accounts.filter((a) => a.phone !== me.user.phone_number);

  const pick = async (phone: string) => {
    setOpen(false);
    if (authMode === "firebase") {
      router.push("/login");
      return;
    }
    const { needsSignup } = await switchAccount(phone);
    router.replace(needsSignup ? "/onboarding" : "/");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="font-medium text-gray-800">{me.user.display_name}</span>
        <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-500">
          {me.user.user_type}
        </span>
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-gray-200 bg-white p-1 text-sm shadow-lg">
            {others.length > 0 && (
              <>
                <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400">
                  {t("switchAccount")}
                </p>
                {others.map((a) => (
                  <div key={a.phone} className="flex items-center justify-between">
                    <button
                      onClick={() => pick(a.phone)}
                      className="flex-1 rounded px-2 py-1 text-left hover:bg-gray-100"
                    >
                      <span className="font-medium">{a.displayName}</span>{" "}
                      <span className="text-xs text-gray-500">{a.role}</span>
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
                <hr className="my-1 border-gray-100" />
              </>
            )}
            <button
              onClick={() => {
                setOpen(false);
                router.push("/login");
              }}
              className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
            >
              {t("addAccount")}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                logout();
                router.replace("/login");
              }}
              className="w-full rounded px-2 py-1 text-left text-red-600 hover:bg-red-50"
            >
              {common("logout")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
