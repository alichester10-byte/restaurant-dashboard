import type { Metadata } from "next";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getPublicCopy, getPublicLanguage, getPublicMetadataBase } from "@/lib/public-site";

export const metadata: Metadata = getPublicMetadataBase(
  "/privacy",
  "Gizlilik Politikası | Limon Masa",
  "Limon Masa gizlilik politikası ve veri işleme yaklaşımı."
);

export default function PrivacyPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const language = getPublicLanguage(searchParams);
  const copy = getPublicCopy(language);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ed_0%,#efe6d7_100%)] text-ink">
      <main className="mx-auto w-full max-w-4xl px-6 py-16 md:px-10 md:py-24">
        <PublicHeader language={language} />
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_120px_rgba(44,62,45,0.12)] backdrop-blur md:p-12">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">{copy.privacy.title}</div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl md:text-5xl">{copy.privacy.headline}</h1>
          <p className="mt-5 text-base leading-8 text-sage">{copy.privacy.intro}</p>

          <div className="mt-10 space-y-4">
            {copy.privacy.sections.map((section) => (
              <section key={section.title} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--bg-strong)] px-5 py-5">
                <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-sage md:text-base">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter language={language} />
    </div>
  );
}
