"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth/context";
import { isActivePath, NAV, type Role } from "@/lib/nav";
import { AccountMenu } from "./AccountMenu";
import { BottomNav } from "./BottomNav";
import { InstallPrompt } from "./InstallPrompt";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { OfflineBanner } from "./OfflineBanner";
import { ThemeToggle } from "./ThemeToggle";

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex items-center gap-1 rounded-full border border-brand bg-brand px-3 py-1 font-medium text-white shadow-sm"
          : "inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
      }
    >
      <span aria-hidden>{icon}</span>
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const nav = useTranslations("nav");
  const app = useTranslations("app");
  const common = useTranslations("common");
  const role = me?.user.user_type as Role | undefined;

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

      {/* Desktop/tablet pill nav; mobile uses the bottom tab bar instead. */}
      {role && (
        <nav
          className="mb-5 hidden flex-wrap gap-2 pt-3 text-sm sm:flex"
          aria-label={nav("primary")}
        >
          {NAV[role].map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={nav(item.key as never)}
            />
          ))}
        </nav>
      )}

      <main id="main-content" className="pt-2">
        <OfflineBanner />
        {me && <InstallPrompt />}
        {children}
      </main>

      {me && <BottomNav />}
    </div>
  );
}
