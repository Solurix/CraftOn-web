"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { formatYen } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

function WorkHistory() {
  const t = useTranslations("history");
  const { api } = useAuth();
  const { data, loading, error } = useAsync(() => api.workHistory(), []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <ErrorText message={error} />
      {loading ? (
        <Spinner />
      ) : error ? null : !data ? null : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-brand">{data.completed_count}</p>
              <p className="text-xs text-gray-500">{t("completedJobs")}</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-brand">
                {formatYen(data.total_earned)}
              </p>
              <p className="text-xs text-gray-500">{t("totalEarned")}</p>
            </div>
          </div>
          {data.matchings.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">{t("empty")}</p>
          ) : (
            <ul className="space-y-3">
              {data.matchings.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/matchings/${m.id}`}
                    className="card block hover:border-brand"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {m.work_date ?? ""}
                        {m.prefecture ? ` · ${m.prefecture}` : ""}
                      </span>
                      <span className="text-sm font-semibold text-brand">
                        {formatYen(m.daily_wage)}
                      </span>
                    </div>
                    {m.contractor_company_name && (
                      <p className="mt-1 text-sm text-gray-600">
                        {m.contractor_company_name}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <RequireAuth role="worker">
      <WorkHistory />
    </RequireAuth>
  );
}
