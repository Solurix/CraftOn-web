"use client";

import { useTranslations } from "next-intl";

import type { WorkerOnboarding, WorkerProfile } from "@/lib/api/models";
import { COMMON_TRADES } from "@/lib/trades";

export type WorkHistoryRow = { company: string; trade: string; years: number };

// Controlled form state shared by the onboarding form and the profile editor.
// Array-ish text fields (tools/qualifications/skills) are kept comma-separated
// for editing and split on submit.
export type WorkerFormValue = {
  display_name: string;
  full_name: string;
  name_kana: string;
  email: string;
  nationality: string; // "JP" or another 2-letter code
  worker_class: "employee" | "freelance";
  trades: string[];
  tools: string;
  current_employer: string;
  current_employer_public: boolean;
  prefecture: string;
  area: string;
  work_history: WorkHistoryRow[];
  qualifications: string;
  skills: string;
  bio: string;
  years_experience: number;
  has_insurance: boolean;
  visa_expiry_date: string;
};

export function emptyWorkerForm(displayName = ""): WorkerFormValue {
  return {
    display_name: displayName,
    full_name: "",
    name_kana: "",
    email: "",
    nationality: "JP",
    worker_class: "employee",
    trades: [],
    tools: "",
    current_employer: "",
    current_employer_public: false,
    prefecture: "",
    area: "",
    work_history: [],
    qualifications: "",
    skills: "",
    bio: "",
    years_experience: 0,
    has_insurance: false,
    visa_expiry_date: "",
  };
}

export function workerFormFromProfile(
  displayName: string,
  wp: WorkerProfile,
): WorkerFormValue {
  const csv = (a: string[] | null | undefined) => (a ?? []).join(", ");
  return {
    display_name: displayName,
    full_name: wp.full_name ?? "",
    name_kana: wp.name_kana ?? "",
    email: wp.email ?? "",
    nationality: wp.nationality ?? "JP",
    worker_class: wp.worker_class as "employee" | "freelance",
    trades: wp.trades ?? [],
    tools: csv(wp.tools),
    current_employer: wp.current_employer ?? "",
    current_employer_public: wp.current_employer_public ?? false,
    prefecture: wp.prefecture ?? "",
    area: wp.area ?? "",
    work_history: (wp.work_history ?? []).map((w) => ({
      company: w.company ?? "",
      trade: w.trade ?? "",
      years: w.years ?? 0,
    })),
    qualifications: csv(wp.qualifications),
    skills: csv(wp.skills),
    bio: wp.bio ?? "",
    years_experience: wp.years_experience ?? 0,
    has_insurance: wp.has_insurance,
    visa_expiry_date: wp.visa_expiry_date ?? "",
  };
}

// Build the API payload from the form. Shared by onboarding (WorkerOnboarding)
// and PATCH (WorkerUpdate) — both accept this superset of keys.
export function workerFormToPayload(v: WorkerFormValue): WorkerOnboarding {
  const csv = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);
  const isJp = v.nationality.toUpperCase() === "JP";
  return {
    display_name: v.display_name,
    nationality: (v.nationality.toUpperCase().slice(0, 2) || "JP") as string,
    worker_class: v.worker_class,
    trades: v.trades,
    tools: csv(v.tools),
    full_name: v.full_name || null,
    name_kana: v.name_kana || null,
    email: v.email || null,
    current_employer: v.current_employer || null,
    current_employer_public: v.current_employer_public,
    prefecture: v.prefecture || null,
    area: v.area || null,
    work_history: v.work_history
      .filter((w) => w.company.trim())
      .map((w) => ({
        company: w.company.trim(),
        trade: w.trade.trim(),
        years: Number(w.years) || 0,
      })),
    qualifications: csv(v.qualifications),
    skills: csv(v.skills),
    bio: v.bio || null,
    years_experience: Number(v.years_experience) || 0,
    has_insurance: v.has_insurance,
    visa_expiry_date: !isJp && v.visa_expiry_date ? v.visa_expiry_date : null,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  // Wrap the control inside the <label> so the field is programmatically named
  // (implicit label association) — better a11y than a detached label.
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function WorkerProfileFields({
  value,
  onChange,
}: {
  value: WorkerFormValue;
  onChange: (patch: Partial<WorkerFormValue>) => void;
}) {
  const t = useTranslations("onboarding");
  const common = useTranslations("common");
  const v = value;
  const isJp = v.nationality.toUpperCase() === "JP";

  const toggleTrade = (trade: string) => {
    const has = v.trades.includes(trade);
    onChange({
      trades: has ? v.trades.filter((x) => x !== trade) : [...v.trades, trade],
    });
  };
  const customTrades = v.trades.filter(
    (x) => !(COMMON_TRADES as readonly string[]).includes(x),
  );
  const setWorkRow = (i: number, patch: Partial<WorkHistoryRow>) =>
    onChange({
      work_history: v.work_history.map((w, j) => (j === i ? { ...w, ...patch } : w)),
    });

  return (
    <div className="space-y-3">
      <Field label={t("fullName")}>
        <input
          className="field-input"
          value={v.full_name}
          onChange={(e) => onChange({ full_name: e.target.value })}
        />
      </Field>
      <Field label={t("nameKana")}>
        <input
          className="field-input"
          value={v.name_kana}
          onChange={(e) => onChange({ name_kana: e.target.value })}
        />
      </Field>
      <Field label={t("email")}>
        <input
          type="email"
          className="field-input"
          value={v.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </Field>

      {/* Nationality: radio, default Japan; a country code appears for "Other". */}
      <fieldset>
        <legend className="field-label">{t("nationality")}</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="nationality"
              checked={isJp}
              onChange={() => onChange({ nationality: "JP" })}
            />
            {t("nationalityJp")}
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="nationality"
              checked={!isJp}
              onChange={() => onChange({ nationality: "" })}
            />
            {t("nationalityOther")}
          </label>
        </div>
        {!isJp && (
          <input
            className="field-input mt-2"
            placeholder={t("nationalityCode")}
            maxLength={2}
            value={v.nationality}
            onChange={(e) => onChange({ nationality: e.target.value.toUpperCase() })}
          />
        )}
      </fieldset>

      {!isJp && (
        <Field label={t("visaExpiry")}>
          <input
            type="date"
            className="field-input"
            value={v.visa_expiry_date}
            onChange={(e) => onChange({ visa_expiry_date: e.target.value })}
          />
        </Field>
      )}

      {/* Worker class: radio. */}
      <fieldset>
        <legend className="field-label">{t("workerClass")}</legend>
        <div className="flex flex-col gap-1 text-sm">
          {(["employee", "freelance"] as const).map((c) => (
            <label key={c} className="flex items-center gap-1">
              <input
                type="radio"
                name="worker_class"
                checked={v.worker_class === c}
                onChange={() => onChange({ worker_class: c })}
              />
              {t(c)}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Trades: guided multi-select + free-text additions. */}
      <fieldset>
        <legend className="field-label">{t("selectTrades")}</legend>
        <div className="flex flex-wrap gap-2 text-sm">
          {COMMON_TRADES.map((tr) => (
            <label
              key={tr}
              className={`cursor-pointer rounded-full border px-3 py-1 ${
                v.trades.includes(tr)
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={v.trades.includes(tr)}
                onChange={() => toggleTrade(tr)}
              />
              {tr}
            </label>
          ))}
        </div>
        <input
          className="field-input mt-2"
          placeholder={t("otherTrade")}
          value={customTrades.join(", ")}
          onChange={(e) =>
            onChange({
              trades: [
                ...v.trades.filter((x) =>
                  (COMMON_TRADES as readonly string[]).includes(x),
                ),
                ...e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              ],
            })
          }
        />
      </fieldset>

      <Field label={t("currentEmployer")}>
        <input
          className="field-input"
          value={v.current_employer}
          onChange={(e) => onChange({ current_employer: e.target.value })}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={v.current_employer_public}
          onChange={(e) => onChange({ current_employer_public: e.target.checked })}
        />
        {t("currentEmployerPublic")}
      </label>

      <div className="flex gap-2">
        <Field label={t("prefecture")}>
          <input
            className="field-input"
            value={v.prefecture}
            onChange={(e) => onChange({ prefecture: e.target.value })}
          />
        </Field>
        <Field label={t("area")}>
          <input
            className="field-input"
            value={v.area}
            onChange={(e) => onChange({ area: e.target.value })}
          />
        </Field>
      </div>

      {/* Work history: repeatable rows. */}
      <fieldset className="space-y-2">
        <legend className="field-label">{t("workHistory")}</legend>
        {v.work_history.map((w, i) => (
          <div key={i} className="rounded-md border border-gray-200 p-2">
            <div className="flex gap-2">
              <input
                className="field-input"
                placeholder={t("whCompany")}
                value={w.company}
                onChange={(e) => setWorkRow(i, { company: e.target.value })}
              />
              <input
                className="field-input"
                placeholder={t("whTrade")}
                value={w.trade}
                onChange={(e) => setWorkRow(i, { trade: e.target.value })}
              />
              <input
                type="number"
                min={0}
                className="field-input w-20"
                placeholder={t("whYears")}
                value={w.years}
                onChange={(e) => setWorkRow(i, { years: Number(e.target.value) })}
              />
            </div>
            <button
              type="button"
              className="mt-1 text-xs text-red-600"
              onClick={() =>
                onChange({ work_history: v.work_history.filter((_, j) => j !== i) })
              }
            >
              {common("remove")}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-brand underline"
          onClick={() =>
            onChange({
              work_history: [
                ...v.work_history,
                { company: "", trade: "", years: 0 },
              ],
            })
          }
        >
          + {t("addWorkHistory")}
        </button>
      </fieldset>

      <Field label={t("qualifications")}>
        <input
          className="field-input"
          value={v.qualifications}
          onChange={(e) => onChange({ qualifications: e.target.value })}
        />
      </Field>
      <Field label={t("skills")}>
        <input
          className="field-input"
          value={v.skills}
          onChange={(e) => onChange({ skills: e.target.value })}
        />
      </Field>
      <Field label={t("tools")}>
        <input
          className="field-input"
          value={v.tools}
          onChange={(e) => onChange({ tools: e.target.value })}
        />
      </Field>
      <Field label={t("yearsExperience")}>
        <input
          type="number"
          min={0}
          className="field-input"
          value={v.years_experience}
          onChange={(e) => onChange({ years_experience: Number(e.target.value) })}
        />
      </Field>
      <Field label={t("bio")}>
        <textarea
          className="field-input"
          value={v.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={v.has_insurance}
          onChange={(e) => onChange({ has_insurance: e.target.checked })}
        />
        {t("hasInsurance")}
      </label>
    </div>
  );
}
