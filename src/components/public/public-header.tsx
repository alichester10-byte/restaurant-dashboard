import type { Route } from "next";
import Link from "next/link";
import { PublicLanguageSelect } from "@/components/public/public-language-select";
import { buildPublicHref, type PublicLanguage } from "@/lib/public-site";

export function PublicHeader({ language }: { language: PublicLanguage }) {
  const isEnglish = language === "en";

  return (
    <header className="mb-8 rounded-[30px] border border-white/70 bg-white/85 px-5 py-4 shadow-[0_16px_60px_rgba(44,62,45,0.08)] backdrop-blur md:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href={buildPublicHref("/", language) as Route} className="flex items-center gap-3">
            <div className="rounded-2xl bg-moss px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              LM
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Limon Masa</div>
              <div className="text-xs text-sage">
                {isEnglish ? "Universal booking operations" : "Çok sektörlü rezervasyon operasyonu"}
              </div>
            </div>
          </Link>

          <div className="lg:hidden">
            <PublicLanguageSelect language={language} />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <nav className="flex flex-wrap gap-2 text-sm text-sage">
            <Link className="rounded-full px-3 py-2 transition hover:bg-[color:var(--bg-strong)] hover:text-ink" href={buildPublicHref("/about", language) as Route}>
              {isEnglish ? "About" : "Hakkında"}
            </Link>
            <Link className="rounded-full px-3 py-2 transition hover:bg-[color:var(--bg-strong)] hover:text-ink" href={buildPublicHref("/privacy", language) as Route}>
              {isEnglish ? "Privacy" : "Gizlilik"}
            </Link>
            <Link className="rounded-full px-3 py-2 transition hover:bg-[color:var(--bg-strong)] hover:text-ink" href={buildPublicHref("/terms", language) as Route}>
              {isEnglish ? "Terms" : "Şartlar"}
            </Link>
          </nav>

          <div className="hidden lg:flex">
            <PublicLanguageSelect language={language} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
            >
              {isEnglish ? "Login" : "Giriş Yap"}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-moss px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink"
            >
              {isEnglish ? "Start Free" : "Ücretsiz Başla"}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
