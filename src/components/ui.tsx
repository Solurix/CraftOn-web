"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function Spinner() {
  const t = useTranslations("common");
  return (
    <div
      className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand"
        aria-hidden
      />
      {t("loading")}
    </div>
  );
}

export function ErrorText({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-600">
      {message}
    </p>
  );
}

// A single shimmer block; size it via className (height/width).
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

// Placeholder rows that mimic a list of cards while data loads.
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="card space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </li>
      ))}
    </ul>
  );
}

// Placeholder for a single detail page (header card + a couple of blocks).
export function DetailSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <div className="card space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="card space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

// Friendly empty state with an optional icon glyph and call-to-action.
export function EmptyState({
  title,
  hint,
  icon = "✦",
  action,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-12 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-xl text-brand"
        aria-hidden
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {hint && <p className="max-w-xs text-xs text-gray-500">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Page heading with optional right-aligned action slot.
export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      {action}
    </div>
  );
}

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  open: "bg-blue-100 text-blue-800",
  filled: "bg-gray-200 text-gray-700",
  closed: "bg-gray-200 text-gray-700",
  canceled: "bg-red-100 text-red-700",
  applied: "bg-blue-100 text-blue-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  checked_in: "bg-teal-100 text-teal-800",
  completed: "bg-green-100 text-green-800",
  noshow: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-200 text-gray-600",
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("status");
  const cls = STATUS_CLASS[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {t(status as never)}
    </span>
  );
}
