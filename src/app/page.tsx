import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getPublicCopy, getPublicLanguage, getPublicMetadataBase } from "@/lib/public-site";

export const metadata: Metadata = getPublicMetadataBase(
  "/",
  "Rezervasyon ve Randevu Sistemi | Limon Masa",
  "Limon Masa, işletmelerin WhatsApp, Instagram ve web üzerinden gelen rezervasyon, randevu ve booking taleplerini tek panelden yönetmesini sağlayan yapay zeka destekli platformdur."
);

export default async function HomePage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getCurrentSession();
  const language = getPublicLanguage(searchParams);
  const copy = getPublicCopy(language);
  const primaryHref = session ? "/dashboard" : "/register";
  const secondaryHref = session ? "/integrations" : "/login";
  const primaryLabel = session ? copy.nav.dashboard : copy.home.primary;
  const secondaryLabel = session ? copy.nav.channels : copy.home.secondary;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(140,167,123,0.2),transparent_24%),linear-gradient(180deg,#f7f2e8_0%,#efe7d8_44%,#f7f4ed_100%)] text-ink">
      <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-16">
        <PublicHeader language={language} />

        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(247,240,226,0.96)_100%)] px-6 py-8 shadow-[0_40px_140px_rgba(44,62,45,0.12)] backdrop-blur md:px-10 md:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">{copy.home.eyebrow}</div>
              <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl leading-[1.02] text-ink md:text-7xl">
                {copy.home.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-sage md:text-lg">{copy.home.description}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={primaryHref} className="inline-flex items-center justify-center rounded-full bg-moss px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink">
                  {primaryLabel}
                </a>
                <a href={secondaryHref} className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-white/80 px-6 py-3 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss">
                  {secondaryLabel}
                </a>
              </div>
            </div>

            <div className="grid w-full max-w-xl gap-3">
              {copy.home.cards.map((card) => (
                <div key={card.title} className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_16px_60px_rgba(44,62,45,0.08)]">
                  <div className="text-sm font-semibold text-ink">{card.title}</div>
                  <p className="mt-2 text-sm leading-7 text-sage">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {copy.home.stats.map((stat) => (
            <div key={stat.title} className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
              <div className="section-title">{stat.title}</div>
              <div className="mt-3 text-2xl font-semibold text-ink">{stat.value}</div>
              <p className="mt-2 text-sm leading-7 text-sage">{stat.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[32px] border border-[color:var(--border)] bg-white/90 px-6 py-8 md:px-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-title">{copy.home.howTitle}</div>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-ink md:text-4xl">
                {copy.home.howHeadline}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-sage md:text-base">{copy.home.howBody}</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {copy.home.steps.map((step, index) => (
              <div key={step} className="rounded-[24px] bg-[color:var(--bg-strong)] px-5 py-5">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-moss">
                  {language === "en" ? `Step ${index + 1}` : `Adım ${index + 1}`}
                </div>
                <p className="mt-3 text-sm leading-7 text-sage">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {copy.home.trust.map((section) => (
            <div key={section.title} className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
              <div className="section-title">{section.title}</div>
              <p className="mt-3 text-sm leading-7 text-sage">{section.body}</p>
            </div>
          ))}
        </section>
      </main>
      <PublicFooter language={language} />
    </div>
  );
}
