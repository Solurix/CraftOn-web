"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/RequireAuth";
import { SaveJobButton } from "@/components/SaveJobButton";
import { useToast } from "@/components/Toast";
import { BackLink, DetailSkeleton, ErrorText, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { formatTime, formatYen } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

function JobDetail() {
  const t = useTranslations("jobs");
  const nav = useTranslations("nav");
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const { data, loading, error } = useAsync(async () => {
    const job = await api.job(id);
    let saved = false;
    try {
      saved = (await api.savedJobIds()).includes(id);
    } catch {
      /* bookmark state is non-essential; show the job regardless */
    }
    return { job, saved };
  }, [id]);
  const job = data?.job;
  const toast = useToast();
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    setBusy(true);
    setApplyError("");
    try {
      await api.apply(id);
      setApplied(true);
      toast.success(t("applied"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      setApplyError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error || !job) return <ErrorText message={error || "not found"} />;

  return (
    <div className="space-y-4">
      <BackLink href="/jobs" label={t("listTitle")} />
      <div className="card space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold [overflow-wrap:anywhere]">{job.trades.join(", ")}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
            <SaveJobButton
              key={String(data?.saved)}
              jobId={job.id}
              saved={data?.saved ?? false}
            />
          </div>
        </div>
        <Row label={t("date")} value={job.work_date} />
        <Row label={t("time")} value={`${formatTime(job.start_time)}–${formatTime(job.end_time)}`} />
        <Row label={t("filterPrefecture")} value={`${job.prefecture}${job.area ? ` / ${job.area}` : ""}`} />
        <Row label={t("wage")} value={formatYen(job.daily_wage)} />
        <Row label={t("headcount")} value={String(job.headcount)} />
        {job.notes && <Row label={t("notes")} value={job.notes} />}
      </div>

      {applied ? (
        <div className="card flex flex-col items-center gap-2 text-center text-sm text-green-700">
          <span>{t("applied")}</span>
          <Link href="/applications" className="btn-secondary btn-sm">
            {nav("myApplications")}
          </Link>
        </div>
      ) : (
        <button
          className="btn-primary w-full"
          disabled={busy || job.status !== "open"}
          onClick={apply}
        >
          {t("apply")}
        </button>
      )}
      <ErrorText message={applyError} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <RequireAuth role="worker">
      <JobDetail />
    </RequireAuth>
  );
}
