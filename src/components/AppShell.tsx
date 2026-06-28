"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth/context";
import { AccountMenu } from "./AccountMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-700 hover:bg-gray-100"
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const nav = useTranslations("nav");
  const app = useTranslations("app");
  const role = me?.user.user_type;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-20">
      <header className="flex items-center justify-between py-4">
        <Link href="/" className="flex flex-col">
          <span className="text-lg font-bold text-brand">{app("name")}</span>
          <span className="text-[10px] text-gray-400">{app("tagline")}</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {me && <NotificationBell />}
          {me && <AccountMenu />}
        </div>
      </header>

      {me && (
        <nav className="mb-5 flex flex-wrap gap-2 text-sm">
          {role === "worker" && (
            <>
              <NavLink href="/jobs" label={nav("jobs")} />
              <NavLink href="/saved" label={nav("saved")} />
              <NavLink href="/applications" label={nav("myApplications")} />
              <NavLink href="/matchings" label={nav("matchings")} />
              <NavLink href="/history" label={nav("history")} />
              <NavLink href="/profile" label={nav("profile")} />
            </>
          )}
          {role === "contractor" && (
            <>
              <NavLink href="/post-job" label={nav("postJob")} />
              <NavLink href="/my-jobs" label={nav("myJobs")} />
              <NavLink href="/matchings" label={nav("matchings")} />
              <NavLink href="/profile" label={nav("profile")} />
            </>
          )}
          {role === "admin" && (
            <>
              <NavLink href="/admin" label={nav("vetting")} />
            </>
          )}
        </nav>
      )}

      <main>{children}</main>
    </div>
  );
}
