"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";

function PostJobForm() {
  const t = useTranslations("jobs");
  const common = useTranslations("common");
  const ob = useTranslations("onboarding");
  const { api } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
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
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

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
      router.replace(`/my-jobs/${job.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h1 className="text-xl font-bold">{t("postTitle")}</h1>
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
      <PostJobForm />
    </RequireAuth>
  );
}
