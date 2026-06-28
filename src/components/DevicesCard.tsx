"use client";

import { useTranslations } from "next-intl";

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

  const revoke = async (id: string) => {
    await api.revokeDevice(id);
    reload();
  };

  return (
    <div className="card space-y-2">
      <h2 className="font-semibold">{t("title")}</h2>
      <ErrorText message={error} />
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
                  <button className="btn-danger" onClick={() => revoke(d.id)}>
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
