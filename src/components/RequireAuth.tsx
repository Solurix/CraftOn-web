"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth/context";
import { AppShell } from "./AppShell";
import { Spinner } from "./ui";

type Role = "worker" | "contractor" | "admin";

// Guards a page: redirects to /login when unauthenticated, and shows a pending
// notice for non-approved accounts (the API also enforces this server-side).
export function RequireAuth({
  role,
  requireApproved = true,
  children,
}: {
  role?: Role;
  requireApproved?: boolean;
  children: ReactNode;
}) {
  const { me, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("onboarding");

  const roleMismatch = !!me && !!role && me.user.user_type !== role;

  useEffect(() => {
    if (loading) return;
    if (!me) router.replace("/login");
    // Role changed under us (e.g. switched accounts in another tab) → route home,
    // which redirects to the new role's landing instead of stranding on a 403.
    else if (roleMismatch) router.replace("/");
  }, [loading, me, roleMismatch, router]);

  if (loading) {
    return (
      <AppShell>
        <Spinner />
      </AppShell>
    );
  }
  if (!me || roleMismatch) {
    return (
      <AppShell>
        <Spinner />
      </AppShell>
    );
  }

  if (requireApproved && me.user.status !== "approved") {
    return (
      <AppShell>
        <div className="card">
          <p className="text-sm text-gray-700">{t("pendingReview")}</p>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
