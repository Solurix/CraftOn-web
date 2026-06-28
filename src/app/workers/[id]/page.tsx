"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { ProfileRow, ReviewList } from "@/components/profile";
import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useAsync } from "@/lib/useAsync";

function WorkerProfileView() {
  const p = useTranslations("profile");
  const ob = useTranslations("onboarding");
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
          <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
            {ob(w.worker_class)}
          </span>
        </div>
        <ProfileRow label={p("trust")} value={`★ ${Number(w.trust_score).toFixed(1)}`} />
        <ProfileRow label={p("experience")} value={p("experienceYears", { years: w.years_experience })} />
        {(w.prefecture || w.area) && (
          <ProfileRow
            label={p("region")}
            value={[w.prefecture, w.area].filter(Boolean).join(" / ")}
          />
        )}
        {w.current_employer && (
          <ProfileRow label={p("employer")} value={w.current_employer} />
        )}
        {w.trades?.length > 0 && <ProfileRow label={p("trades")} value={w.trades.join(", ")} />}
        {w.qualifications?.length > 0 && (
          <ProfileRow label={p("qualifications")} value={w.qualifications.join(", ")} />
        )}
        {w.skills?.length > 0 && <ProfileRow label={p("skills")} value={w.skills.join(", ")} />}
        {w.tools?.length > 0 && <ProfileRow label={p("tools")} value={w.tools.join(", ")} />}
        {w.bio && (
          <div>
            <p className="field-label">{p("about")}</p>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{w.bio}</p>
          </div>
        )}
      </div>

      {w.work_history?.length > 0 && (
        <div className="card space-y-1">
          <h2 className="font-semibold">{p("career")}</h2>
          <ul className="space-y-1 text-sm text-gray-700">
            {w.work_history.map((h, i) => (
              <li key={i}>
                {p("careerEntry", {
                  company: h.company,
                  trade: h.trade || "—",
                  years: h.years,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}

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
