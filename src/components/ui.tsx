"use client";

import { useTranslations } from "next-intl";

export function Spinner() {
  const t = useTranslations("common");
  return <p className="py-8 text-center text-sm text-gray-500">{t("loading")}</p>;
}

export function ErrorText({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm text-red-600">{message}</p>;
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
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {t(status as never)}
    </span>
  );
}
