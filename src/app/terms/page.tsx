import type { Metadata } from "next";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getPublicCopy, getPublicLanguage, getPublicMetadataBase } from "@/lib/public-site";

export const metadata: Metadata = getPublicMetadataBase(
  "/terms",
  "Kullanım Şartları | Limon Masa",
  "Limon Masa kullanım şartları ve platform çerçevesi."
);

export default function TermsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const language = getPublicLanguage(searchParams);
  const copy = getPublicCopy(language);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe2_0%,#f8f5ee_100%)] text-ink">
      <main className="mx-auto w-full max-w-4xl px-6 py-16 md:px-10 md:py-24">
        <PublicHeader language={language} />
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_120px_rgba(44,62,45,0.12)] backdrop-blur md:p-12">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">{copy.terms.title}</div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl md:text-5xl">{copy.terms.headline}</h1>
          <div className="mt-8 space-y-4">
            {copy.terms.items.map((item) => (
              <div key={item} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--bg-strong)] px-5 py-4 text-sm leading-7 text-sage md:text-base">
                {item}
              </div>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter language={language} />
    </div>
  );
}
