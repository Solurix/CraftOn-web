"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner, StatusBadge } from "@/components/ui";
import type { VettingItem } from "@/lib/api/models";
import { useAuth } from "@/lib/auth/context";
import { formatTime, formatYen } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

type Tab = "users" | "jobs" | "matchings" | "config";

function profileHref(item: VettingItem): string | null {
  if (item.user.user_type === "worker") return `/workers/${item.user.id}`;
  if (item.user.user_type === "contractor") return `/contractors/${item.user.id}`;
  return null;
}

function UsersTab() {
  const t = useTranslations("admin");
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
            return (
              <li key={item.user.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    {href ? (
                      <Link href={href} className="font-medium text-brand underline">
                        {item.user.display_name}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.user.display_name}</span>
                    )}
                    <p className="text-xs text-gray-500">
                      {item.user.user_type} · {item.user.phone_number}
                    </p>
                  </div>
                  <StatusBadge status={item.user.status} />
                </div>
                {item.worker_profile && (
                  <p className="text-xs text-gray-600">
                    {item.worker_profile.nationality} · {item.worker_profile.worker_class} ·{" "}
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
                {item.user.user_type !== "admin" && (
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={() => run(() => api.approveUser(item.user.id))}>
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
          <div className="flex items-center justify-between">
            <span className="font-medium">{job.trades.join(", ")}</span>
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
              <div className="flex items-center justify-between">
                <span className="font-medium">
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

  return (
    <div className="space-y-3">
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
    { id: "config", label: t("tabConfig") },
  ];

  return (
    <div className="space-y-4">
      <nav className="flex gap-2 border-b border-gray-200 pb-2 text-sm">
        {tabs.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={
              tab === x.id
                ? "rounded-full bg-brand px-3 py-1 text-white"
                : "rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100"
            }
          >
            {x.label}
          </button>
        ))}
      </nav>
      {tab === "users" && <UsersTab />}
      {tab === "jobs" && <JobsTab />}
      {tab === "matchings" && <MatchingsTab />}
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
