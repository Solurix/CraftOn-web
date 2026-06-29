"use client";

import { useTranslations } from "next-intl";

// Marketing hero shown on the login screen (the app's public entry point). Gives
// first-time visitors a value proposition before they sign up. Mobile-first and
// fully translated; no images so it stays light and installable.
export function LandingHero() {
  const t = useTranslations("landing");

  const audiences = [
    { icon: "👷", title: t("forWorkers"), desc: t("forWorkersDesc") },
    { icon: "🏗️", title: t("forContractors"), desc: t("forContractorsDesc") },
  ];
  const points = [
    { icon: "🛡️", text: t("pointCompliance") },
    { icon: "💴", text: t("pointFees") },
    { icon: "🔒", text: t("pointPrivacy") },
  ];

  return (
    <section className="space-y-4 text-center">
      <div className="rounded-2xl border border-brand/20 bg-brand-soft px-5 py-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          {t("headline")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          {t("subhead")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {audiences.map((a) => (
          <div key={a.title} className="card text-left">
            <span className="text-2xl" aria-hidden>
              {a.icon}
            </span>
            <p className="mt-1 font-semibold text-gray-900">{a.title}</p>
            <p className="mt-0.5 text-sm text-gray-600">{a.desc}</p>
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap justify-center gap-2">
        {points.map((p) => (
          <li
            key={p.text}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700"
          >
            <span aria-hidden>{p.icon}</span>
            {p.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
