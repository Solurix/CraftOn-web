"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { JobCard } from "@/components/JobCard";
import { RequireAuth } from "@/components/RequireAuth";
import { EmptyState, ErrorText, PageHeader, SkeletonList } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useAsync } from "@/lib/useAsync";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

type Sort = "date" | "wage_high" | "wage_low" | "new";

// Only send a wage filter when it's a valid non-negative integer; otherwise omit
// it so a stray "-" or partial entry never 422s and blanks the whole list.
function wageParam(v: string): string | undefined {
  const n = Number(v);
  return v !== "" && Number.isInteger(n) && n >= 0 ? String(n) : undefined;
}

function JobsList() {
  const t = useTranslations("jobs");
  const { api } = useAuth();
  const [trade, setTrade] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [wageMin, setWageMin] = useState("");
  const [wageMax, setWageMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<Sort>("date");

  const hasFilters =
    !!(trade || prefecture || wageMin || wageMax || dateFrom || dateTo) ||
    sort !== "date";

  const clearFilters = () => {
    setTrade("");
    setPrefecture("");
    setWageMin("");
    setWageMax("");
    setDateFrom("");
    setDateTo("");
    setSort("date");
  };

  // Debounce free-text/number filters so each keystroke doesn't fire a request;
  // the date pickers and sort select commit discretely and stay immediate.
  const qTrade = useDebouncedValue(trade);
  const qPrefecture = useDebouncedValue(prefecture);
  const qWageMin = useDebouncedValue(wageMin);
  const qWageMax = useDebouncedValue(wageMax);

  // Load jobs, then the worker's saved-job ids. Saved state is non-essential
  // decoration, so a failure there must not block browsing jobs — fall back to
  // empty stars rather than failing the whole list.
  const { data, loading, error } = useAsync(async () => {
    const jobs = await api.jobs({
      trade: qTrade || undefined,
      prefecture: qPrefecture || undefined,
      wage_min: wageParam(qWageMin),
      wage_max: wageParam(qWageMax),
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort,
    });
    let saved = new Set<string>();
    try {
      saved = new Set(await api.savedJobIds());
    } catch {
      /* leave stars unfilled */
    }
    return { jobs, saved };
  }, [qTrade, qPrefecture, qWageMin, qWageMax, dateFrom, dateTo, sort]);

  return (
    <div className="space-y-4">
      <PageHeader title={t("listTitle")} />
      <div className="card space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col text-xs text-gray-500">
            {t("filterTrade")}
            <input
              className="field-input"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-xs text-gray-500">
            {t("filterPrefecture")}
            <input
              className="field-input"
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-xs text-gray-500">
            {t("filterWageMin")}
            <input
              className="field-input"
              type="number"
              min={0}
              inputMode="numeric"
              value={wageMin}
              onChange={(e) => setWageMin(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-xs text-gray-500">
            {t("filterWageMax")}
            <input
              className="field-input"
              type="number"
              min={0}
              inputMode="numeric"
              value={wageMax}
              onChange={(e) => setWageMax(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-xs text-gray-500">
            {t("filterDateFrom")}
            <input
              className="field-input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-xs text-gray-500">
            {t("filterDateTo")}
            <input
              className="field-input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="field-input flex-1"
            aria-label={t("sortLabel")}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="date">{t("sortDate")}</option>
            <option value="wage_high">{t("sortWageHigh")}</option>
            <option value="wage_low">{t("sortWageLow")}</option>
            <option value="new">{t("sortNew")}</option>
          </select>
          {hasFilters && (
            <button
              type="button"
              className="text-sm text-brand underline"
              onClick={clearFilters}
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      </div>
      <ErrorText message={error} />
      {loading ? (
        <SkeletonList />
      ) : error ? null : !data || data.jobs.length === 0 ? (
        <EmptyState title={t("empty")} hint={t("emptyHint")} icon="🔍" />
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
