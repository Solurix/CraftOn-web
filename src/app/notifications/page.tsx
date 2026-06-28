"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner } from "@/components/ui";
import type { Notification } from "@/lib/api/models";
import { useAuth } from "@/lib/auth/context";
import { formatDate } from "@/lib/format";
import { emitNotificationsChanged } from "@/lib/notifications";
import { useAsync } from "@/lib/useAsync";

function Inbox() {
  const t = useTranslations("notifications");
  const { api } = useAuth();
  const router = useRouter();
  const { data, loading, error, reload, setData } = useAsync(
    () => api.notifications(),
    [],
  );

  // Optimistically flip the row to read, then follow the link. Marking is
  // best-effort: a failed POST shouldn't block navigation.
  const open = (n: Notification) => {
    if (!n.is_read) {
      setData(
        (data ?? []).map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      );
      api
        .markNotificationRead(n.id)
        .then(() => emitNotificationsChanged()) // refresh the header bell badge
        .catch(() => {
          /* best-effort; next reload reconciles */
        });
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    await api.markAllNotificationsRead();
    emitNotificationsChanged();
    reload();
  };

  const hasUnread = (data ?? []).some((n) => !n.is_read);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        {hasUnread && (
          <button className="text-sm text-brand underline" onClick={markAll}>
            {t("markAllRead")}
          </button>
        )}
      </div>
      <ErrorText message={error} />
      {loading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {data.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => open(n)}
                className={`card flex w-full flex-col items-start gap-1 text-left ${
                  n.is_read ? "" : "border-brand bg-brand/5"
                }`}
              >
                {!n.is_read && <span className="sr-only">{t("unread")}</span>}
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-medium">{n.title}</span>
                  {!n.is_read && (
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full bg-brand"
                    />
                  )}
                </div>
                <span className="text-sm text-gray-600">{n.body}</span>
                <span className="text-[11px] text-gray-400">
                  {formatDate(n.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth requireApproved={false}>
      <Inbox />
    </RequireAuth>
  );
}
