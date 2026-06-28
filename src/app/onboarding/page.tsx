"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ErrorText, Spinner } from "@/components/ui";
import {
  emptyWorkerForm,
  WorkerProfileFields,
  workerFormToPayload,
  type WorkerFormValue,
} from "@/components/WorkerProfileFields";
import { useAuth } from "@/lib/auth/context";

function RoleChooser({ onChoose }: { onChoose: (role: "worker" | "contractor", name: string) => void }) {
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  return (
    <div className="card space-y-4">
      <h1 className="text-lg font-bold">{t("chooseRole")}</h1>
      <div>
        <label className="field-label">{t("displayName")}</label>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <button className="btn-primary" disabled={!name} onClick={() => onChoose("worker", name)}>
          {t("roleWorker")}
        </button>
        <button
          className="btn-secondary"
          disabled={!name}
          onClick={() => onChoose("contractor", name)}
        >
          {t("roleContractor")}
        </button>
      </div>
    </div>
  );
}

function WorkerForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations("onboarding");
  const common = useTranslations("common");
  const { api, me } = useAuth();
  const [form, setForm] = useState<WorkerFormValue>(() =>
    emptyWorkerForm(me?.user.display_name ?? ""),
  );
  const [frontId, setFrontId] = useState<string | null>(null);
  const [backId, setBackId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const nonJp = form.nationality.toUpperCase() !== "JP";
  const patch = (p: Partial<WorkerFormValue>) => setForm((f) => ({ ...f, ...p }));

  const uploadCard = async (side: "residence_card_front" | "residence_card_back") => {
    const ticket = await api.uploadUrl(side);
    // In dev/fake mode we skip the actual PUT; the storage_path is registrable.
    const doc = await api.registerDocument(side, ticket.storage_path);
    if (side === "residence_card_front") setFrontId(doc.id);
    else setBackId(doc.id);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.onboardWorker({
        ...workerFormToPayload(form),
        residence_card_front_doc_id: frontId,
        residence_card_back_doc_id: backId,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h1 className="text-lg font-bold">{t("workerTitle")}</h1>
      <WorkerProfileFields value={form} onChange={patch} />
      {nonJp && (
        <div className="flex gap-2 rounded-md bg-amber-50 p-3">
          <button type="button" className="btn-secondary" onClick={() => uploadCard("residence_card_front")}>
            {frontId ? "✓ " : ""}
            {t("residenceCardFront")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => uploadCard("residence_card_back")}>
            {backId ? "✓ " : ""}
            {t("residenceCardBack")}
          </button>
        </div>
      )}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? common("loading") : common("submit")}
      </button>
      <ErrorText message={error} />
    </form>
  );
}

function ContractorForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations("onboarding");
  const common = useTranslations("common");
  const { api } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [prefecture, setPrefecture] = useState("Tokyo");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.onboardContractor({
        company_name: companyName,
        contact_person: contactPerson,
        prefecture,
        address: address || null,
        bio: bio || null,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h1 className="text-lg font-bold">{t("contractorTitle")}</h1>
      <div>
        <label className="field-label">{t("companyName")}</label>
        <input className="field-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
      </div>
      <div>
        <label className="field-label">{t("contactPerson")}</label>
        <input className="field-input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required />
      </div>
      <div>
        <label className="field-label">{t("prefecture")}</label>
        <input className="field-input" value={prefecture} onChange={(e) => setPrefecture(e.target.value)} required />
      </div>
      <div>
        <label className="field-label">{t("address")}</label>
        <input className="field-input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div>
        <label className="field-label">{t("bio")}</label>
        <textarea className="field-input" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? common("loading") : common("submit")}
      </button>
      <ErrorText message={error} />
    </form>
  );
}

export default function OnboardingPage() {
  const { token, me, completeSignup, refresh } = useAuth();
  const router = useRouter();
  const [signupError, setSignupError] = useState("");

  useEffect(() => {
    if (token === null && me === null) router.replace("/login");
  }, [token, me, router]);

  const onboarded = me && (me.has_worker_profile || me.has_contractor_profile);
  useEffect(() => {
    if (onboarded) router.replace("/");
  }, [onboarded, router]);

  const choose = async (role: "worker" | "contractor", name: string) => {
    setSignupError("");
    try {
      await completeSignup({ user_type: role, display_name: name });
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : "error");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        {!token ? (
          <Spinner />
        ) : !me ? (
          <>
            <RoleChooser onChoose={choose} />
            <ErrorText message={signupError} />
          </>
        ) : me.user.user_type === "worker" ? (
          <WorkerForm onDone={() => refresh().then(() => router.replace("/"))} />
        ) : (
          <ContractorForm onDone={() => refresh().then(() => router.replace("/"))} />
        )}
      </div>
    </AppShell>
  );
}
