"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useAsync } from "@/lib/useAsync";

function MyApplications() {
  const t = useTranslations("applications");
  const jobs = useTranslations("jobs");
  const { api } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.myApplications(), []);

  const withdraw = async (id: string) => {
    await api.withdraw(id);
    reload();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <ErrorText message={error} />
      {loading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{t("empty")}</p>
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
