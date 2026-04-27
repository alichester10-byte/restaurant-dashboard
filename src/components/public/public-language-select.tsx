"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { type PublicLanguage } from "@/lib/public-site";

export function PublicLanguageSelect({ language }: { language: PublicLanguage }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold text-ink">
      <span className="text-sage">Dil</span>
      <select
        aria-label="Dil seçici"
        className="bg-transparent text-ink outline-none"
        defaultValue={language}
        disabled={isPending}
        onChange={(event) => {
          const nextLanguage = event.target.value as PublicLanguage;
          const params = new URLSearchParams(searchParams.toString());

          if (nextLanguage === "tr") {
            params.delete("lang");
          } else {
            params.set("lang", "en");
          }

          const query = params.toString();
          const href = query ? `${pathname}?${query}` : pathname;
          startTransition(() => {
            router.push(href as Route);
          });
        }}
      >
        <option value="tr">Türkçe</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
