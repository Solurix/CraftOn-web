"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { RequireAuth } from "@/components/RequireAuth";
import { useToast } from "@/components/Toast";
import { EmptyState, ErrorText, PageHeader, SkeletonList, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useAsync } from "@/lib/useAsync";

function MyApplications() {
  const t = useTranslations("applications");
  const jobs = useTranslations("jobs");
  const { api } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.myApplications(), []);

  const withdraw = async (id: string) => {
    try {
      await api.withdraw(id);
      toast.success(t("withdrawn"));
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "error");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} />
      <ErrorText message={error} />
      {loading ? (
        <SkeletonList />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title={t("empty")}
          hint={t("emptyHint")}
          icon="📋"
          action={
            <Link href="/jobs" className="btn-primary">
              {jobs("listTitle")}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {data.map((a) => (
            <li key={a.id} className="card flex items-center justify-between">
              <Link href={`/jobs/${a.job_id}`} className="text-sm text-brand underline">
                {jobs("detailTitle")}
              </Link>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                {a.status === "applied" && (
                  <button className="btn-danger" onClick={() => withdraw(a.id)}>
                    {t("withdraw")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <RequireAuth role="worker">
      <MyApplications />
    </RequireAuth>
  );
}
