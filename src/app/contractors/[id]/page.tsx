"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { ProfileRow, ReviewList } from "@/components/profile";
import { RequireAuth } from "@/components/RequireAuth";
import { ErrorText, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useAsync } from "@/lib/useAsync";

function ContractorProfileView() {
  const p = useTranslations("profile");
  const ob = useTranslations("onboarding");
  const rt = useTranslations("reviews");
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const profile = useAsync(() => api.contractor(id), [id]);
  const reviews = useAsync(() => api.contractorReviews(id), [id]);

  if (profile.loading) return <Spinner />;
  if (profile.error || !profile.data) return <ErrorText message={profile.error || "not found"} />;
  const c = profile.data;

  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <h1 className="text-xl font-bold">{c.display_name}</h1>
        <ProfileRow label={p("company")} value={c.company_name} />
        <ProfileRow label={ob("prefecture")} value={c.prefecture} />
        <ProfileRow label={p("trust")} value={`★ ${Number(c.rating).toFixed(1)}`} />
        {c.bio && (
          <div>
            <p className="field-label">{p("about")}</p>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{c.bio}</p>
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

export default function ContractorProfilePage() {
  return (
    <RequireAuth>
      <ContractorProfileView />
    </RequireAuth>
  );
}
