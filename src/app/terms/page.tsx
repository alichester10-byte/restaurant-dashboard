import type { Metadata } from "next";
import { PublicFooter } from "@/components/public/public-footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for using Limon Masa."
};

const terms = [
  "Limon Masa is intended for restaurant reservation operations and internal team workflows.",
  "Restaurants remain responsible for the final approval, timing, and service delivery of reservations created or reviewed through the platform.",
  "Channel integrations such as WhatsApp and Instagram are available where supported and after Meta approval.",
  "AI-assisted extraction is designed to help teams review customer intent, but restaurants should validate important details before confirming a reservation.",
  "The service may evolve over time as integrations, payment support, and operational tooling expand."
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe2_0%,#f8f5ee_100%)] text-ink">
      <main className="mx-auto w-full max-w-4xl px-6 py-16 md:px-10 md:py-24">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_120px_rgba(44,62,45,0.12)] backdrop-blur md:p-12">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">Terms of Service</div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl md:text-5xl">Using Limon Masa responsibly</h1>
          <div className="mt-8 space-y-4">
            {terms.map((term) => (
              <div key={term} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--bg-strong)] px-5 py-4 text-sm leading-7 text-sage md:text-base">
                {term}
              </div>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
