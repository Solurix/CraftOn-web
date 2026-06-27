"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useAsync } from "@/lib/useAsync";

function VettingSection() {
  const t = useTranslations("admin");
  const { api } = useAuth();
  const queue = useAsync(() => api.vettingQueue(), []);
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      queue.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    }
  };

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-bold">{t("vettingTitle")}</h1>
      <ErrorText message={error} />
      {queue.loading ? (
        <Spinner />
      ) : !queue.data || queue.data.items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">{t("vettingEmpty")}</p>
      ) : (
        <ul className="space-y-3">
          {queue.data.items.map((item) => (
            <li key={item.user.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.user.display_name}</p>
                  <p className="text-xs text-gray-500">
                    {item.user.user_type} · {item.user.phone_number}
                  </p>
                </div>
                <StatusBadge status={item.user.status} />
              </div>
              {item.worker_profile && (
                <p className="text-xs text-gray-600">
                  {item.worker_profile.nationality} · {item.worker_profile.worker_class}
                  {item.worker_profile.visa_expiry_date
                    ? ` · visa ${item.worker_profile.visa_expiry_date}`
                    : ""}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {t("documents")}: {item.documents.length}
              </p>
              <div className="flex gap-2">
                <button className="btn-primary" onClick={() => run(() => api.approveUser(item.user.id))}>
                  {t("approve")}
                </button>
                <button className="btn-danger" onClick={() => run(() => api.rejectUser(item.user.id, "rejected"))}>
                  {t("reject")}
                </button>
                <button className="btn-secondary" onClick={() => run(() => api.suspendUser(item.user.id, true))}>
                  {t("suspend")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ConfigSection() {
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
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{t("configTitle")}</h2>
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
        <pre className="max-h-80 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
          {JSON.stringify(config.data?.config ?? {}, null, 2)}
        </pre>
      )}
    </section>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth role="admin" requireApproved={false}>
      <div className="space-y-8">
        <VettingSection />
        <ConfigSection />
      </div>
    </RequireAuth>
  );
}
