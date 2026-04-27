import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter } from "@/components/public/public-footer";

export const metadata: Metadata = {
  title: "About Limon Masa",
  description: "Learn how Limon Masa helps restaurants manage reservations from multiple channels with human approval."
};

const principles = [
  "Limon Masa helps restaurants manage reservations from WhatsApp, Instagram, website forms, and AI-assisted request flows.",
  "Customer messages can be converted into pending reservation requests instead of creating confirmed bookings automatically.",
  "Restaurants stay in control and manually approve every reservation before it becomes part of the live service flow.",
  "The platform is designed for small and medium restaurants that want modern operations without losing human oversight."
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f2e8_0%,#f2e7d8_48%,#f7f4ed_100%)] text-ink">
      <main className="mx-auto w-full max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_120px_rgba(44,62,45,0.12)] backdrop-blur md:p-12">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">About Limon Masa</div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl">
            A calm control center for modern restaurant reservations
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-sage md:text-lg">
            Limon Masa brings reservation requests from multiple channels into one operational workspace.
            Instead of forcing restaurants into fully automated booking decisions, the platform helps teams review demand,
            confirm details, and approve each reservation with confidence.
          </p>

          <div className="mt-10 grid gap-4">
            {principles.map((item) => (
              <div key={item} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--bg-strong)] px-5 py-4 text-sm leading-7 text-sage md:text-base">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded-[28px] border border-[color:var(--border)] bg-white px-6 py-6">
              <div className="section-title">How it works</div>
              <p className="mt-3 text-sm leading-7 text-sage md:text-base">
                Incoming customer messages are collected, analyzed, and organized into pending reservation requests.
                Restaurant staff can review extracted details such as date, time, guest count, and notes before approving the final reservation.
              </p>
            </section>
            <section className="rounded-[28px] border border-[color:var(--border)] bg-white px-6 py-6">
              <div className="section-title">For restaurants</div>
              <p className="mt-3 text-sm leading-7 text-sage md:text-base">
                Limon Masa is designed for small and medium restaurants that want a practical operations system without losing the warmth and judgment of the front-of-house team.
              </p>
            </section>
            <section className="rounded-[28px] border border-[color:var(--border)] bg-white px-6 py-6">
              <div className="section-title">Data privacy</div>
              <p className="mt-3 text-sm leading-7 text-sage md:text-base">
                Business data is stored separately per restaurant, access is limited to authorized users, and payment processing is handled by supported payment partners rather than exposed in the interface.
              </p>
            </section>
            <section className="rounded-[28px] border border-[color:var(--border)] bg-white px-6 py-6">
              <div className="section-title">Human approval</div>
              <p className="mt-3 text-sm leading-7 text-sage md:text-base">
                Every reservation can remain under human review before it is confirmed. This helps restaurants reduce mistakes, avoid unwanted automation, and stay aligned with service capacity.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-moss px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink">
              Start with Limon Masa
            </Link>
            <Link href="/" className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] px-6 py-3 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss">
              Back to homepage
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
