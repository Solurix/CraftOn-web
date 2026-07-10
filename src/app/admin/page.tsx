"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner, StatusBadge } from "@/components/ui";
import type { VettingItem } from "@/lib/api/models";
import { useAuth } from "@/lib/auth/context";
import { formatDate, formatTime, formatYen } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

type Tab = "users" | "jobs" | "matchings" | "devices" | "admins" | "debug" | "config";

function profileHref(item: VettingItem): string | null {
  // Only link to a profile page that actually exists. A user who signed up but
  // never completed onboarding has no worker/contractor profile, so the public
  // profile endpoint would 404 (error.not_found). Render their name as plain
  // text instead — same condition surfaced below as `awaitingOnboarding`.
  if (item.user.user_type === "worker" && item.worker_profile) return `/workers/${item.user.id}`;
  if (item.user.user_type === "contractor" && item.contractor_profile)
    return `/contractors/${item.user.id}`;
  return null;
}

function UsersTab() {
  const t = useTranslations("admin");
  const ob = useTranslations("onboarding");
  const { api } = useAuth();
  const [userType, setUserType] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const users = useAsync(
    () => api.adminUsers({ user_type: userType || undefined, status: status || undefined }),
    [userType, status],
  );

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      users.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select className="field-input" value={userType} onChange={(e) => setUserType(e.target.value)}>
          <option value="">{t("filterAll")}</option>
          <option value="worker">worker</option>
          <option value="contractor">contractor</option>
          <option value="admin">admin</option>
        </select>
        <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t("filterAll")}</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="suspended">suspended</option>
        </select>
      </div>
      <ErrorText message={error} />
      {users.loading ? (
        <Spinner />
      ) : !users.data || users.data.items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">{t("noUsers")}</p>
      ) : (
        <ul className="space-y-3">
          {users.data.items.map((item) => {
            const href = profileHref(item);
            // A non-admin with neither profile signed up but never finished the
            // onboarding form — the backend approve gate would reject it, so
            // surface that here instead of offering an action that 400s.
            const awaitingOnboarding =
              item.user.user_type !== "admin" &&
              !item.worker_profile &&
              !item.contractor_profile;
            return (
              <li key={item.user.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 [overflow-wrap:anywhere]">
                    {href ? (
                      <Link href={href} className="link">
                        {item.user.display_name}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.user.display_name}</span>
                    )}
                    <p className="text-xs text-gray-500">
                      {item.user.user_type} · {item.user.phone_number}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={item.user.status} />
                  </div>
                </div>
                {item.worker_profile && (
                  <p className="text-xs text-gray-600">
                    {item.worker_profile.nationality} · {ob(item.worker_profile.worker_class)} ·{" "}
                    {item.worker_profile.years_experience}y ·{" "}
                    {item.worker_profile.trades?.join(", ")}
                  </p>
                )}
                {item.contractor_profile && (
                  <p className="text-xs text-gray-600">
                    {item.contractor_profile.company_name} · {item.contractor_profile.prefecture}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {t("documents")}: {item.documents.length}
                </p>
                {awaitingOnboarding && (
                  <p className="text-xs text-amber-700">{t("awaitingOnboarding")}</p>
                )}
                {item.user.user_type !== "admin" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-primary"
                      disabled={awaitingOnboarding}
                      onClick={() => run(() => api.approveUser(item.user.id))}
                    >
                      {t("approve")}
                    </button>
                    <button className="btn-danger" onClick={() => run(() => api.rejectUser(item.user.id, "rejected"))}>
                      {t("reject")}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        run(() => api.suspendUser(item.user.id, item.user.status !== "suspended"))
                      }
                    >
                      {t("suspend")}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function JobsTab() {
  const t = useTranslations("admin");
  const j = useTranslations("jobs");
  const { api } = useAuth();
  const jobs = useAsync(() => api.adminJobs(), []);

  return jobs.loading ? (
    <Spinner />
  ) : !jobs.data || jobs.data.length === 0 ? (
    <p className="py-6 text-center text-sm text-gray-500">{t("noJobs")}</p>
  ) : (
    <ul className="space-y-3">
      {jobs.data.map((job) => (
        <li key={job.id} className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium [overflow-wrap:anywhere]">{job.trades.join(", ")}</span>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-gray-600">
            {job.contractor_company_name} · {job.prefecture} · {job.work_date} ·{" "}
            {formatTime(job.start_time)}–{formatTime(job.end_time)} · {formatYen(job.daily_wage)} ·{" "}
            {j("headcount")} {job.headcount}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MatchingsTab() {
  const t = useTranslations("admin");
  const m = useTranslations("matchings");
  const { api } = useAuth();
  const matchings = useAsync(() => api.adminMatchings(), []);
  const [error, setError] = useState("");

  const markPaid = async (id: string) => {
    setError("");
    try {
      await api.markFeePaid(id);
      matchings.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  };

  return (
    <div className="space-y-3">
      <ErrorText message={error} />
      {matchings.loading ? (
        <Spinner />
      ) : !matchings.data || matchings.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">{t("noMatchings")}</p>
      ) : (
        <ul className="space-y-3">
          {matchings.data.map((mt) => (
            <li key={mt.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium [overflow-wrap:anywhere]">
                  {mt.worker_display_name} → {mt.contractor_company_name}
                </span>
                <StatusBadge status={mt.status} />
              </div>
              <p className="text-sm text-gray-600">
                {mt.work_date} · {formatYen(mt.daily_wage)} · {m("fee")} {formatYen(mt.platform_fee)} (
                {mt.fee_status === "paid" ? m("feePaid") : m("feeUnpaid")})
              </p>
              {mt.fee_status === "unpaid" && mt.status === "completed" && (
                <button className="btn-secondary mt-2" onClick={() => markPaid(mt.id)}>
                  {t("markFeePaid")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DevicesTab() {
  const t = useTranslations("admin");
  const dv = useTranslations("devices");
  const { api } = useAuth();
  const devices = useAsync(() => api.adminDevices(), []);

  return (
    <div className="space-y-3">
      {devices.loading ? (
        <Spinner />
      ) : !devices.data || devices.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">{t("noDevices")}</p>
      ) : (
        <ul className="space-y-2">
          {devices.data.map((d) => (
            <li key={d.id} className="card flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {d.user_display_name ?? "—"}
                  <span className="ml-2 text-xs text-gray-500">
                    {d.label || dv("unknownDevice")}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(d.last_seen_at)}
                  {d.revoked && ` · ${dv("revoked")}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminsTab() {
  const t = useTranslations("admin");
  const auth = useTranslations("auth");
  const { api } = useAuth();
  const admins = useAsync(() => api.adminAdmins(), []);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.createAdmin({
        phone_number: phone,
        username,
        email,
        password,
        display_name: name,
      });
      setPhone("");
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      admins.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  };

  const canSubmit = phone && name && username && email && password;

  return (
    <div className="space-y-3">
      <form onSubmit={create} className="card space-y-2">
        <h2 className="font-semibold">{t("addAdmin")}</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[9rem] flex-1">
            <span className="field-label">{auth("displayName")}</span>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="min-w-[9rem] flex-1">
            <span className="field-label">{auth("usernameLabel")}</span>
            <input
              className="field-input"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="min-w-[9rem] flex-1">
            <span className="field-label">{auth("emailLabel")}</span>
            <input
              className="field-input"
              type="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="min-w-[9rem] flex-1">
            <span className="field-label">{auth("phoneLabel")}</span>
            <input
              className="field-input"
              placeholder={auth("phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label className="min-w-[9rem] flex-1">
            <span className="field-label">{auth("passwordLabel")}</span>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary" disabled={!canSubmit}>
            {t("createAdmin")}
          </button>
        </div>
        <ErrorText message={error} />
      </form>
      {admins.loading ? (
        <Spinner />
      ) : !admins.data || admins.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">{t("noAdmins")}</p>
      ) : (
        <ul className="space-y-2">
          {admins.data.map((a) => (
            <li key={a.id} className="card flex items-center justify-between">
              <span className="font-medium">{a.display_name}</span>
              <span className="text-xs text-gray-500">{a.phone_number}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DebugTab() {
  const t = useTranslations("admin");
  const { api } = useAuth();
  const [workers, setWorkers] = useState(5);
  const [contractors, setContractors] = useState(3);
  const [jobs, setJobs] = useState(10);
  const [result, setResult] = useState<{ workers: number; contractors: number; jobs: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const seed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setBusy(true);
    try {
      setResult(
        await api.debugSeed({
          workers: Number(workers),
          contractors: Number(contractors),
          jobs: Number(jobs),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={seed} className="card space-y-3">
      <h2 className="font-semibold">{t("seedTitle")}</h2>
      <p className="text-xs text-amber-700">{t("seedWarning")}</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[9rem] flex-1">
          <span className="field-label">{t("seedWorkers")}</span>
          <input type="number" min={0} className="field-input" value={workers} onChange={(e) => setWorkers(Number(e.target.value))} />
        </label>
        <label className="min-w-[9rem] flex-1">
          <span className="field-label">{t("seedContractors")}</span>
          <input type="number" min={0} className="field-input" value={contractors} onChange={(e) => setContractors(Number(e.target.value))} />
        </label>
        <label className="min-w-[9rem] flex-1">
          <span className="field-label">{t("seedJobs")}</span>
          <input type="number" min={0} className="field-input" value={jobs} onChange={(e) => setJobs(Number(e.target.value))} />
        </label>
        <button className="btn-primary" disabled={busy}>
          {t("seedRun")}
        </button>
      </div>
      {result && (
        <p className="text-sm text-green-700">
          {t("seedDone", {
            workers: result.workers,
            contractors: result.contractors,
            jobs: result.jobs,
          })}
        </p>
      )}
      <ErrorText message={error} />
    </form>
  );
}

function ConfigTab() {
  const t = useTranslations("admin");
  const { api } = useAuth();
  const config = useAsync(() => api.readConfig(), []);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const parsed = JSON.parse(value);
      await api.updateConfig({ [key]: parsed });
      setKey("");
      setValue("");
      config.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "invalid value (use JSON)");
    }
  };

  const toggleFlag = async (flag: string, next: boolean) => {
    setError("");
    try {
      await api.updateConfig({ [flag]: next });
      config.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  };

  // Every boolean config value is exposed as a quick on/off toggle.
  const flags = Object.entries(config.data?.config ?? {}).filter(
    ([, v]) => typeof v === "boolean",
  ) as [string, boolean][];

  return (
    <div className="space-y-3">
      {flags.length > 0 && (
        <div className="card space-y-2">
          <h3 className="font-semibold">{t("flags")}</h3>
          <ul className="space-y-1">
            {flags.map(([flag, on]) => (
              <li key={flag} className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  {flag === "auto_approve_users" ? (
                    <span className="font-medium">{t("autoApproveUsers")}</span>
                  ) : (
                    <code className="text-xs text-gray-600">{flag}</code>
                  )}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={flag}
                  onClick={() => toggleFlag(flag, !on)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    on ? "bg-brand" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      on ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={save} className="card flex flex-wrap items-end gap-2">
        <div className="flex-1">
          <label className="field-label">{t("configKey")}</label>
          <input className="field-input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="platform_fee_per_match" />
        </div>
        <div className="flex-1">
          <label className="field-label">{t("configValue")} (JSON)</label>
          <input className="field-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="5000" />
        </div>
        <button className="btn-primary" disabled={!key || !value}>
          {t("saveConfig")}
        </button>
      </form>
      <ErrorText message={error} />
      {config.loading ? (
        <Spinner />
      ) : (
        <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
          {JSON.stringify(config.data?.config ?? {}, null, 2)}
        </pre>
      )}
    </div>
  );
}

function AdminDashboard() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<Tab>("users");
  const tabs: { id: Tab; label: string }[] = [
    { id: "users", label: t("tabUsers") },
    { id: "jobs", label: t("tabJobs") },
    { id: "matchings", label: t("tabMatchings") },
    { id: "devices", label: t("tabDevices") },
    { id: "admins", label: t("tabAdmins") },
    { id: "debug", label: t("tabDebug") },
    { id: "config", label: t("tabConfig") },
  ];

  return (
    <div className="space-y-4">
      {/* More tabs than a phone is wide: scroll the strip inside its own
          container so the page body never overflows horizontally. */}
      <nav className="-mx-4 overflow-x-auto border-b border-gray-200 px-4 pb-2">
        <div className="flex w-max gap-2 text-sm">
          {tabs.map((x) => (
            <button
              key={x.id}
              onClick={() => setTab(x.id)}
              className={
                tab === x.id
                  ? "shrink-0 whitespace-nowrap rounded-full bg-brand px-3 py-1 font-medium text-white"
                  : "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100"
              }
            >
              {x.label}
            </button>
          ))}
        </div>
      </nav>
      {tab === "users" && <UsersTab />}
      {tab === "jobs" && <JobsTab />}
      {tab === "matchings" && <MatchingsTab />}
      {tab === "devices" && <DevicesTab />}
      {tab === "admins" && <AdminsTab />}
      {tab === "debug" && <DebugTab />}
      {tab === "config" && <ConfigTab />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth role="admin" requireApproved={false}>
      <AdminDashboard />
    </RequireAuth>
  );
}
