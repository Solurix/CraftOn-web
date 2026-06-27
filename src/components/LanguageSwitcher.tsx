"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();

  const set = (l: string) => {
    document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 text-xs" aria-label={t("language")}>
      <button
        onClick={() => set("ja")}
        className={locale === "ja" ? "font-bold text-brand" : "text-gray-500"}
      >
        {t("japanese")}
      </button>
      <span className="text-gray-300">/</span>
      <button
        onClick={() => set("en")}
        className={locale === "en" ? "font-bold text-brand" : "text-gray-500"}
      >
        {t("english")}
      </button>
    </div>
  );
}
