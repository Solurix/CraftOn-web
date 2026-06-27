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

  useEffect(() => {
    if (!loading && !me) router.replace("/login");
  }, [loading, me, router]);

  if (loading) {
    return (
      <AppShell>
        <Spinner />
      </AppShell>
    );
  }
  if (!me) return null;

  if (role && me.user.user_type !== role) {
    return (
      <AppShell>
        <p className="text-sm text-gray-600">403</p>
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
