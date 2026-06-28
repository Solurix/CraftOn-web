"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { ProfileRow, ReviewList } from "@/components/profile";
import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useAsync } from "@/lib/useAsync";

function WorkerProfileView() {
  const p = useTranslations("profile");
  const rt = useTranslations("reviews");
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const profile = useAsync(() => api.worker(id), [id]);
  const reviews = useAsync(() => api.workerReviews(id), [id]);

  if (profile.loading) return <Spinner />;
  if (profile.error || !profile.data) return <ErrorText message={profile.error || "not found"} />;
  const w = profile.data;

  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{w.display_name}</h1>
          <StatusBadge status={w.worker_class} />
        </div>
        <ProfileRow label={p("trust")} value={`★ ${Number(w.trust_score).toFixed(1)}`} />
        <ProfileRow label={p("experience")} value={p("experienceYears", { years: w.years_experience })} />
        {w.trades?.length > 0 && <ProfileRow label={p("trades")} value={w.trades.join(", ")} />}
        {w.tools?.length > 0 && <ProfileRow label={p("tools")} value={w.tools.join(", ")} />}
        {w.bio && (
          <div>
            <p className="field-label">{p("about")}</p>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{w.bio}</p>
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold">{rt("title")}</h2>
        {reviews.loading ? <Spinner /> : <ReviewList reviews={reviews.data ?? []} />}
      </div>
    </div>
  );
}

export default function WorkerProfilePage() {
  return (
    <RequireAuth>
      <WorkerProfileView />
    </RequireAuth>
  );
}
