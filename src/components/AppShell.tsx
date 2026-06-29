"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth/context";
import { AccountMenu } from "./AccountMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-full border border-brand bg-brand px-3 py-1 font-medium text-white shadow-sm"
          : "rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
      }
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const nav = useTranslations("nav");
  const app = useTranslations("app");
  const common = useTranslations("common");
  const role = me?.user.user_type;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-24">
      <a href="#main-content" className="skip-link">
        {common("skipToContent")}
      </a>
      <header className="sticky top-0 z-20 -mx-4 mb-1 flex items-center justify-between border-b border-gray-200/70 bg-gray-50/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-lg font-bold tracking-tight text-brand">
            {app("name")}
          </span>
          <span className="text-[10px] text-gray-400">{app("tagline")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {me && <NotificationBell />}
          {me && <AccountMenu />}
        </div>
      </header>

      {me && (
        <nav className="mb-5 flex flex-wrap gap-2 pt-3 text-sm">
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

      <main id="main-content">{children}</main>
    </div>
  );
}
