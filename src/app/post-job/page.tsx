"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { JobTemplates, type JobTemplate } from "@/components/JobTemplates";
import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import type { Job } from "@/lib/api/models";
import { useAuth } from "@/lib/auth/context";
import { KEY, readJSON, writeJSON } from "@/lib/storage";

type JobForm = {
  trades: string;
  work_date: string;
  start_time: string;
  end_time: string;
  prefecture: string;
  area: string;
  address: string;
  daily_wage: number | string;
  headcount: number | string;
  notes: string;
};

const DEFAULTS: JobForm = {
  trades: "",
  work_date: "",
  start_time: "08:00",
  end_time: "17:00",
  prefecture: "Tokyo",
  area: "",
  address: "",
  daily_wage: 18000,
  headcount: 1,
  notes: "",
};

function jobToForm(job: Job): JobForm {
  return {
    trades: job.trades.join(", "),
    work_date: "", // a reposted job gets a fresh date
    start_time: job.start_time.slice(0, 5),
    end_time: job.end_time.slice(0, 5),
    prefecture: job.prefecture,
    area: job.area ?? "",
    address: job.address ?? "",
    daily_wage: job.daily_wage,
    headcount: job.headcount,
    notes: job.notes ?? "",
  };
}

function PostJobForm() {
  const t = useTranslations("jobs");
  const common = useTranslations("common");
  const ob = useTranslations("onboarding");
  const tpl = useTranslations("templates");
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const fromId = params.get("from");

  const [form, setForm] = useState<JobForm>(DEFAULTS);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const hydrated = useRef(false);

  const set = (k: keyof JobForm, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  // On mount: prefill from a job being duplicated, or restore an autosaved draft.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (fromId) {
        try {
          const job = await api.job(fromId);
          if (!cancelled) setForm(jobToForm(job));
        } catch {
          /* fall back to defaults */
        }
      } else {
        const draft = readJSON<JobForm | null>(KEY.jobDraft, null);
        if (draft && !cancelled) {
          setForm(draft);
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
    const { name: _name, ...fields } = template;
    void _name;
    setForm((f) => ({ ...f, ...fields }));
  };

  const currentTemplate = {
    trades: form.trades,
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
    setBusy(true);
    setError("");
    try {
      const job = await api.createJob({
        trades: form.trades.split(",").map((s) => s.trim()).filter(Boolean),
        work_date: form.work_date,
        start_time: `${form.start_time}:00`,
        end_time: `${form.end_time}:00`,
        prefecture: form.prefecture,
        area: form.area || null,
        address: form.address || null,
        daily_wage: Number(form.daily_wage),
        headcount: Number(form.headcount),
        notes: form.notes || null,
      });
      writeJSON(KEY.jobDraft, null); // posted → clear the draft
      toast.success(t("posted"));
      router.replace(`/my-jobs/${job.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h1 className="text-xl font-bold">{t("postTitle")}</h1>

      {restored && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>{tpl("draftRestored")}</span>
          <button
            type="button"
            onClick={discardDraft}
            className="font-medium underline"
          >
            {tpl("discard")}
          </button>
        </div>
      )}

      <JobTemplates current={currentTemplate} onApply={applyTemplate} />

      <Field label={t("trade")}>
        <input className="field-input" value={form.trades} onChange={(e) => set("trades", e.target.value)} required />
      </Field>
      <Field label={t("date")}>
        <input type="date" className="field-input" value={form.work_date} onChange={(e) => set("work_date", e.target.value)} required />
      </Field>
      <div className="flex gap-2">
        <Field label={t("startTime")}>
          <input type="time" className="field-input" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
        </Field>
        <Field label={t("endTime")}>
          <input type="time" className="field-input" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
        </Field>
      </div>
      <Field label={ob("prefecture")}>
        <input className="field-input" value={form.prefecture} onChange={(e) => set("prefecture", e.target.value)} required />
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
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? common("loading") : t("create")}
      </button>
      <ErrorText message={error} />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
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
