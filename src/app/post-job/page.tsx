"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { JobPhotoPicker } from "@/components/JobPhotoPicker";
import { JobTemplates, type JobTemplate } from "@/components/JobTemplates";
import { PrefectureSelect } from "@/components/PrefectureSelect";
import { RequireAuth } from "@/components/RequireAuth";
import { TagInput } from "@/components/TagInput";
import { useToast } from "@/components/Toast";
import { ErrorText, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { humanizeError } from "@/lib/errorMessage";
import { KEY, readJSON, writeJSON } from "@/lib/storage";
import { tradeOptionsFor } from "@/lib/trades";
import { useAsync } from "@/lib/useAsync";
import {
  DEFAULTS,
  END_TIME_CHOICES,
  jobToForm,
  minutes,
  normalizeForm,
  type JobForm,
} from "./jobForm";

function PostJobForm() {
  const t = useTranslations("jobs");
  const common = useTranslations("common");
  const ob = useTranslations("onboarding");
  const tpl = useTranslations("templates");
  const ph = useTranslations("photos");
  const locale = useLocale();
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const fromId = params.get("from");

  const v = useTranslations("validation");
  const [form, setForm] = useState<JobForm>(DEFAULTS);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const hydrated = useRef(false);

  // Trade catalog for the picker.
  const catalog = useAsync(() => api.trades().catch(() => []), []);
  const tradeOptions = tradeOptionsFor(catalog.data, locale);

  // Today's date in Asia/Tokyo (business rules run in Tokyo time).
  const todayTokyo = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  const startMin = minutes(form.start_time);
  const endMin = minutes(form.end_time); // 0..36h scale
  const allTrades = [...form.trades, ...form.trades_other];

  const issues: string[] = [];
  if (allTrades.length === 0) issues.push(v("tradesRequired"));
  if (!form.work_date) issues.push(v("dateRequired"));
  else if (form.work_date < todayTokyo) issues.push(v("datePast"));
  if (endMin <= startMin) issues.push(v("endAfterStart"));
  else if (endMin - startMin > 24 * 60) issues.push(v("shiftTooLong"));
  if (!(Number(form.daily_wage) > 0)) issues.push(v("wagePositive"));
  if (!(Number(form.headcount) >= 1)) issues.push(v("headcountMin"));

  const set = (k: keyof JobForm, val: JobForm[keyof JobForm]) =>
    setForm((f) => ({ ...f, [k]: val }));

  // On mount: prefill from a job being duplicated, or restore an autosaved draft.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (fromId) {
        try {
          const [job, trades] = await Promise.all([
            api.job(fromId),
            api.trades().catch(() => []),
          ]);
          if (!cancelled)
            setForm(jobToForm(job, trades.map((x) => x.name_ja)));
        } catch {
          /* fall back to defaults */
        }
      } else {
        const draft = readJSON<unknown>(KEY.jobDraft, null);
        if (draft && !cancelled) {
          setForm(normalizeForm(draft));
          setRestored(true);
        }
      }
      hydrated.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [fromId, api]);

  // Autosave the in-progress form so a dropped session isn't lost.
  useEffect(() => {
    if (!hydrated.current) return;
    writeJSON(KEY.jobDraft, form);
  }, [form]);

  const discardDraft = () => {
    writeJSON(KEY.jobDraft, null);
    setForm(DEFAULTS);
    setRestored(false);
  };

  const applyTemplate = (template: JobTemplate) => {
    const { name: _name, trades: tplTrades, ...fields } = template;
    void _name;
    const values = tplTrades.split(",").map((s) => s.trim()).filter(Boolean);
    const catalogValues = (catalog.data ?? []).map((x) => x.name_ja);
    setForm((f) => ({
      ...f,
      ...fields,
      trades: values.filter((x) => catalogValues.includes(x)),
      trades_other: values.filter((x) => !catalogValues.includes(x)),
    }));
  };

  // Templates keep their CSV `trades` shape (device-local storage compat).
  const currentTemplate = {
    trades: allTrades.join(", "),
    start_time: form.start_time,
    end_time: form.end_time,
    prefecture: form.prefecture,
    area: form.area,
    address: form.address,
    daily_wage: Number(form.daily_wage) || 0,
    headcount: Number(form.headcount) || 1,
    notes: form.notes,
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (issues.length > 0) {
      setAttempted(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      // 24+ end times wrap to the real clock time; the API stores end <= start
      // as "ends the next day".
      const endH = Number(form.end_time.slice(0, 2));
      const apiEnd =
        endH >= 24
          ? `${String(endH - 24).padStart(2, "0")}:${form.end_time.slice(3, 5)}`
          : form.end_time;
      const job = await api.createJob({
        trades: allTrades,
        work_date: form.work_date,
        start_time: `${form.start_time}:00`,
        end_time: `${apiEnd}:00`,
        prefecture: form.prefecture,
        area: form.area || null,
        address: form.address || null,
        daily_wage: Number(form.daily_wage),
        headcount: Number(form.headcount),
        notes: form.notes || null,
        photo_doc_ids: form.photo_doc_ids,
      });
      writeJSON(KEY.jobDraft, null); // posted → clear the draft
      toast.success(t("posted"));
      router.replace(`/my-jobs/${job.id}`);
    } catch (e) {
      const msg = humanizeError(e, common("networkError"));
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // "29:00（翌5:00）" style label for 24+ choices.
  const endChoiceLabel = (val: string) => {
    const h = Number(val.slice(0, 2));
    if (h < 24) return val;
    return t("nextDayTime", {
      time: val,
      next: `${h - 24}:${val.slice(3, 5)}`,
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h1 className="text-lg font-bold tracking-tight sm:text-xl">{t("postTitle")}</h1>

      {restored && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>{tpl("draftRestored")}</span>
          <button
            type="button"
            onClick={discardDraft}
            className="shrink-0 rounded-md border border-amber-300 px-2 py-1 font-medium hover:bg-amber-100"
          >
            {tpl("discard")}
          </button>
        </div>
      )}

      <JobTemplates current={currentTemplate} onApply={applyTemplate} />

      <fieldset>
        <legend className="field-label">{t("trade")}</legend>
        <div className="flex flex-wrap gap-2 text-sm">
          {tradeOptions.map((tr) => (
            <label
              key={tr.value}
              className={`cursor-pointer rounded-full border px-3 py-1 ${
                form.trades.includes(tr.value)
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={form.trades.includes(tr.value)}
                onChange={() =>
                  set(
                    "trades",
                    form.trades.includes(tr.value)
                      ? form.trades.filter((x) => x !== tr.value)
                      : [...form.trades, tr.value],
                  )
                }
              />
              {tr.label}
            </label>
          ))}
        </div>
        <div className="mt-2">
          <TagInput
            value={form.trades_other}
            onChange={(val) => set("trades_other", val)}
            placeholder={ob("otherTrade")}
          />
        </div>
      </fieldset>

      <Field label={t("date")}>
        <input type="date" className="field-input" value={form.work_date} onChange={(e) => set("work_date", e.target.value)} required />
      </Field>
      <div className="flex gap-2">
        <Field label={t("startTime")}>
          <input type="time" className="field-input" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
        </Field>
        <Field label={t("endTime")}>
          <select
            className="field-input"
            value={form.end_time}
            onChange={(e) => set("end_time", e.target.value)}
          >
            {/* Keep an off-grid stored value selectable. */}
            {!END_TIME_CHOICES.includes(form.end_time) && (
              <option value={form.end_time}>{endChoiceLabel(form.end_time)}</option>
            )}
            {END_TIME_CHOICES.map((val) => (
              <option key={val} value={val}>
                {endChoiceLabel(val)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="text-xs text-gray-400">{t("nightShiftHint")}</p>
      <Field label={ob("prefecture")}>
        <PrefectureSelect value={form.prefecture} onChange={(val) => set("prefecture", val)} required />
      </Field>
      <div className="flex gap-2">
        <Field label={t("wage")}>
          <input type="number" className="field-input" value={form.daily_wage} onChange={(e) => set("daily_wage", e.target.value)} required />
        </Field>
        <Field label={t("headcount")}>
          <input type="number" min={1} className="field-input" value={form.headcount} onChange={(e) => set("headcount", e.target.value)} required />
        </Field>
      </div>
      <Field label={t("notes")}>
        <textarea className="field-input" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>

      <fieldset>
        <legend className="field-label">{ph("jobPhotos")}</legend>
        <JobPhotoPicker
          selected={form.photo_doc_ids}
          onChange={(ids) => set("photo_doc_ids", ids)}
        />
      </fieldset>

      {attempted && issues.length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {issues.map((msg) => (
            <li key={msg} className="flex items-start gap-1">
              <span aria-hidden>•</span>
              {msg}
            </li>
          ))}
        </ul>
      )}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? common("loading") : t("create")}
      </button>
      <ErrorText message={error} />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

export default function PostJobPage() {
  return (
    <RequireAuth role="contractor">
      <Suspense fallback={<Spinner />}>
        <PostJobForm />
      </Suspense>
    </RequireAuth>
  );
}
