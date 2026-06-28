"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText } from "@/components/ui";
import type { Me } from "@/lib/api/models";
import { useAuth } from "@/lib/auth/context";

function WorkerSettings({ me }: { me: Me }) {
  const t = useTranslations("onboarding");
  const p = useTranslations("profile");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const { api, refresh } = useAuth();
  const wp = me.worker_profile!;
  const [form, setForm] = useState({
    display_name: me.user.display_name,
    trades: (wp.trades ?? []).join(", "),
    tools: (wp.tools ?? []).join(", "),
    bio: wp.bio ?? "",
    years_experience: wp.years_experience ?? 0,
    has_insurance: wp.has_insurance,
    visa_expiry_date: wp.visa_expiry_date ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError("");
    try {
      await api.updateWorker({
        display_name: form.display_name,
        trades: form.trades.split(",").map((s) => s.trim()).filter(Boolean),
        tools: form.tools.split(",").map((s) => s.trim()).filter(Boolean),
        bio: form.bio || null,
        years_experience: Number(form.years_experience),
        has_insurance: form.has_insurance,
        visa_expiry_date: form.visa_expiry_date || null,
      });
      await refresh();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{p("edit")}</h1>
        <Link href={`/workers/${me.user.id}`} className="text-sm text-brand underline">
          {p("view")}
        </Link>
      </div>
      <Field label={auth("displayName")}>
        <input className="field-input" value={form.display_name} onChange={(e) => set("display_name", e.target.value)} />
      </Field>
      <Field label={t("trades")}>
        <input className="field-input" value={form.trades} onChange={(e) => set("trades", e.target.value)} />
      </Field>
      <Field label={t("tools")}>
        <input className="field-input" value={form.tools} onChange={(e) => set("tools", e.target.value)} />
      </Field>
      <Field label={t("yearsExperience")}>
        <input type="number" min={0} className="field-input" value={form.years_experience} onChange={(e) => set("years_experience", e.target.value)} />
      </Field>
      <Field label={t("bio")}>
        <textarea className="field-input" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.has_insurance} onChange={(e) => set("has_insurance", e.target.checked)} />
        {t("hasInsurance")}
      </label>
      {wp.nationality !== "JP" && (
        <Field label={t("visaExpiry")}>
          <input type="date" className="field-input" value={form.visa_expiry_date} onChange={(e) => set("visa_expiry_date", e.target.value)} />
        </Field>
      )}
      <button className="btn-primary w-full">{common("save")}</button>
      {saved && <p className="text-sm text-green-700">{p("saved")}</p>}
      <ErrorText message={error} />
    </form>
  );
}

function ContractorSettings({ me }: { me: Me }) {
  const t = useTranslations("onboarding");
  const p = useTranslations("profile");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const { api, refresh } = useAuth();
  const cp = me.contractor_profile!;
  const [form, setForm] = useState({
    display_name: me.user.display_name,
    company_name: cp.company_name,
    contact_person: cp.contact_person,
    prefecture: cp.prefecture,
    address: cp.address ?? "",
    bio: cp.bio ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError("");
    try {
      await api.updateContractor({
        display_name: form.display_name,
        company_name: form.company_name,
        contact_person: form.contact_person,
        prefecture: form.prefecture,
        address: form.address || null,
        bio: form.bio || null,
      });
      await refresh();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{p("edit")}</h1>
        <Link href={`/contractors/${me.user.id}`} className="text-sm text-brand underline">
          {p("view")}
        </Link>
      </div>
      <Field label={auth("displayName")}>
        <input className="field-input" value={form.display_name} onChange={(e) => set("display_name", e.target.value)} />
      </Field>
      <Field label={t("companyName")}>
        <input className="field-input" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
      </Field>
      <Field label={t("contactPerson")}>
        <input className="field-input" value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} />
      </Field>
      <Field label={t("prefecture")}>
        <input className="field-input" value={form.prefecture} onChange={(e) => set("prefecture", e.target.value)} />
      </Field>
      <Field label={t("address")}>
        <input className="field-input" value={form.address} onChange={(e) => set("address", e.target.value)} />
      </Field>
      <Field label={t("bio")}>
        <textarea className="field-input" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
      </Field>
      <button className="btn-primary w-full">{common("save")}</button>
      {saved && <p className="text-sm text-green-700">{p("saved")}</p>}
      <ErrorText message={error} />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function Settings() {
  const { me } = useAuth();
  if (!me) return null;
  if (me.user.user_type === "worker" && me.worker_profile) return <WorkerSettings me={me} />;
  if (me.user.user_type === "contractor" && me.contractor_profile) return <ContractorSettings me={me} />;
  return null;
}

export default function ProfilePage() {
  return (
    <RequireAuth requireApproved={false}>
      <Settings />
    </RequireAuth>
  );
}
