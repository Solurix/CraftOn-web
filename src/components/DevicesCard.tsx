"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ErrorText, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { getDeviceId } from "@/lib/device";
import { formatDate } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

// Lists the devices the user has signed in from and lets them revoke any device
// other than the current one (to drop a lost/old device's access).
export function DevicesCard() {
  const t = useTranslations("devices");
  const { api } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.myDevices(), []);
  const current = getDeviceId();
  const [revokeError, setRevokeError] = useState("");
  const [busy, setBusy] = useState(false);

  const revoke = async (id: string) => {
    setRevokeError("");
    setBusy(true);
    try {
      await api.revokeDevice(id);
      reload();
    } catch (e) {
      setRevokeError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-2">
      <h2 className="font-semibold">{t("title")}</h2>
      <ErrorText message={error || revokeError} />
      {loading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {data.map((d) => {
            const isCurrent = d.device_id === current;
            return (
              <li key={d.id} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {d.label || t("unknownDevice")}
                    {isCurrent && (
                      <span className="ml-1 text-xs text-brand">
                        ({t("thisDevice")})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(d.last_seen_at)}
                    {d.revoked && ` · ${t("revoked")}`}
                  </p>
                </div>
                {!d.revoked && !isCurrent && (
                  <button
                    className="btn-danger"
                    disabled={busy}
                    onClick={() => revoke(d.id)}
                  >
                    {t("revoke")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
