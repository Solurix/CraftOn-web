"use client";

import { useTranslations } from "next-intl";

import { JobCard } from "@/components/JobCard";
import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useAsync } from "@/lib/useAsync";

function SavedJobs() {
  const t = useTranslations("jobs");
  const { api } = useAuth();
  const { data, loading, error, setData } = useAsync(() => api.savedJobs(), []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("savedTitle")}</h1>
      <ErrorText message={error} />
      {loading ? (
        <Spinner />
      ) : error ? null : !data || data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{t("savedEmpty")}</p>
      ) : (
        <ul className="space-y-3">
          {data.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved
              onSavedChange={(s) => {
                // Removing a bookmark drops it from this list (fires after the
                // unsave request succeeds).
                if (!s) setData((prev) => (prev ?? []).filter((j) => j.id !== job.id));
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SavedJobsPage() {
  return (
    <RequireAuth role="worker">
      <SavedJobs />
    </RequireAuth>
  );
}
