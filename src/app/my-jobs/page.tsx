"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { formatTime, formatYen } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

function MyJobs() {
  const t = useTranslations("jobs");
  const nav = useTranslations("nav");
  const { api } = useAuth();
  const { data, loading, error } = useAsync(() => api.myJobs(), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{nav("myJobs")}</h1>
        <Link href="/post-job" className="btn-primary">
          {nav("postJob")}
        </Link>
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
              <Link href={`/my-jobs/${job.id}`} className="card block hover:border-brand">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{job.trades.join(", ")}</span>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {job.prefecture} · {job.work_date} · {formatTime(job.start_time)}–
                  {formatTime(job.end_time)}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand">{formatYen(job.daily_wage)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MyJobsPage() {
  return (
    <RequireAuth role="contractor">
      <MyJobs />
    </RequireAuth>
  );
}
