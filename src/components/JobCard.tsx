"use client";

import Link from "next/link";

import type { Job } from "@/lib/api/models";
import { formatTime, formatYen } from "@/lib/format";
import { SaveJobButton } from "./SaveJobButton";
import { StatusBadge } from "./ui";

// A job summary card linking to the detail page, with a save/bookmark star
// overlaid in the corner. Shared by the jobs list and the saved-jobs page.
export function JobCard({
  job,
  saved,
  onSavedChange,
}: {
  job: Job;
  saved: boolean;
  onSavedChange?: (saved: boolean) => void;
}) {
  return (
    <li className="relative">
      <SaveJobButton
        key={String(saved)}
        jobId={job.id}
        saved={saved}
        onChange={onSavedChange}
        className="absolute right-1 top-1 z-10"
      />
      {/* Badge sits left of the trades, leaving the top-right corner for the star. */}
      <Link href={`/jobs/${job.id}`} className="card block hover:border-brand">
        <div className="flex items-center gap-2 pr-10">
          <span className="font-medium">{job.trades.join(", ")}</span>
          <StatusBadge status={job.status} />
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {job.prefecture} · {job.work_date} · {formatTime(job.start_time)}–
          {formatTime(job.end_time)}
        </p>
        <p className="mt-1 text-sm font-semibold text-brand">
          {formatYen(job.daily_wage)}
        </p>
        {job.contractor_company_name && (
          <p className="text-xs text-gray-400">{job.contractor_company_name}</p>
        )}
      </Link>
    </li>
  );
}
