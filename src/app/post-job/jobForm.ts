// Pure helpers for the job-posting form (no JSX/hooks): the form shape, its
// defaults, time utilities, and converters from a stored job / saved draft.
import type { Job } from "@/lib/api/models";

export type JobForm = {
  trades: string[]; // selected catalog trades
  trades_other: string[]; // custom trades
  work_date: string;
  start_time: string; // HH:MM
  end_time: string; // HH:MM on a 36-hour clock (24+ = ends the NEXT day)
  prefecture: string;
  area: string;
  address: string;
  daily_wage: number | string;
  headcount: number | string;
  notes: string;
  photo_doc_ids: string[];
};

export const DEFAULTS: JobForm = {
  trades: [],
  trades_other: [],
  work_date: "",
  start_time: "08:00",
  end_time: "17:00",
  prefecture: "Tokyo",
  area: "",
  address: "",
  daily_wage: 18000,
  headcount: 1,
  notes: "",
  photo_doc_ids: [],
};

export const minutes = (hhmm: string): number =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// End-time choices on a 36-hour clock, 30-minute steps (24+ = next day).
export const END_TIME_CHOICES = Array.from({ length: 72 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
}).filter((t) => t !== "00:00");

export function jobToForm(job: Job, catalogValues: string[]): JobForm {
  // A stored overnight shift (end <= start) surfaces as 24+ in the picker.
  let end = job.end_time.slice(0, 5);
  if (end <= job.start_time.slice(0, 5)) {
    end = `${Number(end.slice(0, 2)) + 24}:${end.slice(3, 5)}`;
  }
  return {
    trades: job.trades.filter((t) => catalogValues.includes(t)),
    trades_other: job.trades.filter((t) => !catalogValues.includes(t)),
    work_date: "", // a reposted job gets a fresh date
    start_time: job.start_time.slice(0, 5),
    end_time: end,
    prefecture: job.prefecture,
    area: job.area ?? "",
    address: job.address ?? "",
    daily_wage: job.daily_wage,
    headcount: job.headcount,
    notes: job.notes ?? "",
    photo_doc_ids: job.photo_doc_ids ?? [],
  };
}

// Drafts/templates written before trades became chips stored them as a CSV
// string — normalize so an old draft doesn't crash the form.
export function normalizeForm(raw: unknown): JobForm {
  const d = { ...DEFAULTS, ...(raw as Partial<JobForm>) };
  if (typeof (d.trades as unknown) === "string") {
    d.trades_other = (d.trades as unknown as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    d.trades = [];
  }
  if (!Array.isArray(d.trades_other)) d.trades_other = [];
  if (!Array.isArray(d.photo_doc_ids)) d.photo_doc_ids = [];
  return d;
}
