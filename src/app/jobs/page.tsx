"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { formatTime, formatYen } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

function JobsList() {
  const t = useTranslations("jobs");
  const { api } = useAuth();
  const [trade, setTrade] = useState("");
  const [prefecture, setPrefecture] = useState("");

  const { data, loading, error } = useAsync(
    () => api.jobs({ trade: trade || undefined, prefecture: prefecture || undefined }),
    [trade, prefecture],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("listTitle")}</h1>
      <div className="flex gap-2">
        <input
          className="field-input"
          placeholder={t("filterTrade")}
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
        />
        <input
          className="field-input"
          placeholder={t("filterPrefecture")}
          value={prefecture}
          onChange={(e) => setPrefecture(e.target.value)}
        />
      </div>
      <ErrorText message={error} />
      {loading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {data.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="card block hover:border-brand">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{job.trades.join(", ")}</span>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {job.prefecture} · {job.work_date} · {formatTime(job.start_time)}–
                  {formatTime(job.end_time)}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand">{formatYen(job.daily_wage)}</p>
                {job.contractor_company_name && (
                  <p className="text-xs text-gray-400">{job.contractor_company_name}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <RequireAuth role="worker">
      <JobsList />
    </RequireAuth>
  );
}
