import type { Metadata } from "next";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { buildPublicHref, getPublicCopy, getPublicLanguage, getPublicMetadataBase } from "@/lib/public-site";

export const metadata: Metadata = getPublicMetadataBase(
  "/about",
  "Limon Masa Hakkında",
  "Limon Masa, işletmelerin çok kanallı rezervasyon ve randevu taleplerini insan onaylı akışla yönetmesine yardımcı olur."
);

export default function AboutPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const language = getPublicLanguage(searchParams);
  const copy = getPublicCopy(language);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f2e8_0%,#f2e7d8_48%,#f7f4ed_100%)] text-ink">
      <main className="mx-auto w-full max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <PublicHeader language={language} />
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_120px_rgba(44,62,45,0.12)] backdrop-blur md:p-12">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">{copy.about.title}</div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl">
            {copy.about.headline}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-sage md:text-lg">{copy.about.intro}</p>

          <div className="mt-10 grid gap-4">
            {copy.about.principles.map((item) => (
              <div key={item} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--bg-strong)] px-5 py-4 text-sm leading-7 text-sage md:text-base">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {copy.about.sections.map((section) => (
              <section key={section.title} className="rounded-[28px] border border-[color:var(--border)] bg-white px-6 py-6">
                <div className="section-title">{section.title}</div>
                <p className="mt-3 text-sm leading-7 text-sage md:text-base">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="/register" className="inline-flex items-center justify-center rounded-full bg-moss px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink">
              {copy.about.primary}
            </a>
            <a href={buildPublicHref("/", language)} className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] px-6 py-3 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss">
              {copy.about.secondary}
            </a>
          </div>
        </div>
      </main>
      <PublicFooter language={language} />
    </div>
  );
}
