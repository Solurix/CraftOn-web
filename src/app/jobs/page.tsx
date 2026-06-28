"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { JobCard } from "@/components/JobCard";
import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useAsync } from "@/lib/useAsync";

function JobsList() {
  const t = useTranslations("jobs");
  const { api } = useAuth();
  const [trade, setTrade] = useState("");
  const [prefecture, setPrefecture] = useState("");

  // Load jobs, then the worker's saved-job ids. Saved state is non-essential
  // decoration, so a failure there must not block browsing jobs — fall back to
  // empty stars rather than failing the whole list.
  const { data, loading, error } = useAsync(async () => {
    const jobs = await api.jobs({
      trade: trade || undefined,
      prefecture: prefecture || undefined,
    });
    let saved = new Set<string>();
    try {
      saved = new Set(await api.savedJobIds());
    } catch {
      /* leave stars unfilled */
    }
    return { jobs, saved };
  }, [trade, prefecture]);

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
      ) : error ? null : !data || data.jobs.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {data.jobs.map((job) => (
            <JobCard key={job.id} job={job} saved={data.saved.has(job.id)} />
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
