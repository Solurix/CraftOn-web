"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { formatTime, formatYen } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

function JobApplicants() {
  const t = useTranslations("applications");
  const ob = useTranslations("onboarding");
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const router = useRouter();
  const job = useAsync(() => api.job(id), [id]);
  const apps = useAsync(() => api.applicants(id), [id]);
  const [error, setError] = useState("");

  const confirm = async (applicationId: string) => {
    setError("");
    try {
      const m = await api.confirm(applicationId);
      router.push(`/matchings/${m.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  };

  const reject = async (applicationId: string) => {
    await api.rejectApplication(applicationId);
    apps.reload();
  };

  if (job.loading) return <Spinner />;
  if (job.error || !job.data) return <ErrorText message={job.error || "not found"} />;

  return (
    <div className="space-y-4">
      <Link href="/my-jobs" className="text-sm text-gray-500">
        ←
      </Link>
      <div className="card space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{job.data.trades.join(", ")}</h1>
          <StatusBadge status={job.data.status} />
        </div>
        <p className="text-sm text-gray-600">
          {job.data.prefecture} · {job.data.work_date} · {formatTime(job.data.start_time)}–
          {formatTime(job.data.end_time)} · {formatYen(job.data.daily_wage)}
        </p>
      </div>

      <h2 className="font-semibold">{t("applicantsTitle")}</h2>
      <ErrorText message={error} />
      {apps.loading ? (
        <Spinner />
      ) : !apps.data || apps.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">{t("noApplicants")}</p>
      ) : (
        <ul className="space-y-3">
          {apps.data.map((a) => (
            <li key={a.id} className="card flex items-center justify-between">
              <div>
                <Link href={`/workers/${a.worker_id}`} className="font-medium text-brand underline">
                  {a.worker_display_name}
                </Link>
                <p className="text-xs text-gray-500">
                  {ob(a.worker_class)} · {t("trust")}: {Number(a.worker_trust_score).toFixed(1)}
                </p>
                <StatusBadge status={a.status} />
              </div>
              {a.status === "applied" && (
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => confirm(a.id)}>
                    {t("confirm")}
                  </button>
                  <button className="btn-danger" onClick={() => reject(a.id)}>
                    {t("reject")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function JobApplicantsPage() {
  return (
    <RequireAuth role="contractor">
      <JobApplicants />
    </RequireAuth>
  );
}
