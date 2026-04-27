import { getCurrentSession } from "@/lib/auth";
import { PublicFooter } from "@/components/public/public-footer";

export default async function HomePage() {
  const session = await getCurrentSession();
  const primaryHref = session ? "/dashboard" : "/register";
  const secondaryHref = session ? "/integrations" : "/about";
  const primaryLabel = session ? "Open dashboard" : "Start with Limon Masa";
  const secondaryLabel = session ? "View channels" : "About Limon Masa";

  const channelCards = [
    {
      title: "AI-powered reservation management",
      body: "Collect reservation demand in one operational workspace, review extracted details, and keep service quality under human control."
    },
    {
      title: "WhatsApp, Instagram, website, and AI-assisted requests",
      body: "Capture customer intent from multiple channels. WhatsApp and Instagram integrations are available where supported and after Meta approval."
    },
    {
      title: "Human approval before confirmation",
      body: "Restaurants review pending requests before they become confirmed reservations, helping teams reduce mistakes and stay aligned with capacity."
    }
  ];

  const trustSections = [
    {
      title: "How it works",
      body: "Customer messages arrive from supported channels, Limon Masa organizes them into pending reservation requests, and the restaurant team approves the final reservation manually."
    },
    {
      title: "For restaurants",
      body: "Built for small and medium restaurants that want one place for reservations, guest history, table flow, and operational follow-up."
    },
    {
      title: "Data privacy",
      body: "Restaurant data is stored separately, access is limited to authorized users, and sensitive operational events can be logged for security and support."
    },
    {
      title: "Manual control",
      body: "AI helps with extraction and triage, but the restaurant remains in charge of confirmation, edits, and guest communication decisions."
    }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(140,167,123,0.2),transparent_24%),linear-gradient(180deg,#f7f2e8_0%,#efe7d8_44%,#f7f4ed_100%)] text-ink">
      <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-16">
        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(247,240,226,0.96)_100%)] px-6 py-8 shadow-[0_40px_140px_rgba(44,62,45,0.12)] backdrop-blur md:px-10 md:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">Limon Masa</div>
              <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl leading-[1.02] text-ink md:text-7xl">
                AI-powered restaurant reservation management, with humans still in control
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-sage md:text-lg">
                Limon Masa helps restaurants manage reservation demand from WhatsApp, Instagram, website forms, and AI-assisted message flows.
                Every request can stay pending until the restaurant owner or team approves it manually.
              </p>
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
              {channelCards.map((card) => (
                <div key={card.title} className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_16px_60px_rgba(44,62,45,0.08)]">
                  <div className="text-sm font-semibold text-ink">{card.title}</div>
                  <p className="mt-2 text-sm leading-7 text-sage">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
            <div className="section-title">Channels</div>
            <div className="mt-3 text-2xl font-semibold text-ink">4+</div>
            <p className="mt-2 text-sm leading-7 text-sage">Website, WhatsApp, Instagram, and AI-assisted request intake.</p>
          </div>
          <div className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
            <div className="section-title">Approval flow</div>
            <div className="mt-3 text-2xl font-semibold text-ink">Human-first</div>
            <p className="mt-2 text-sm leading-7 text-sage">Restaurants review requests before reservations are confirmed.</p>
          </div>
          <div className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
            <div className="section-title">Built for</div>
            <div className="mt-3 text-2xl font-semibold text-ink">SMB restaurants</div>
            <p className="mt-2 text-sm leading-7 text-sage">Designed for teams that need clarity without enterprise overhead.</p>
          </div>
          <div className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
            <div className="section-title">Trust</div>
            <div className="mt-3 text-2xl font-semibold text-ink">Controlled rollout</div>
            <p className="mt-2 text-sm leading-7 text-sage">Channel support expands where integrations are approved and available.</p>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-[color:var(--border)] bg-white/90 px-6 py-8 md:px-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-title">How it works</div>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-ink md:text-4xl">
                From customer message to approved reservation
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-sage md:text-base">
              Limon Masa helps restaurants review demand from different channels without handing final control to automation.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              "Customer sends a message or request.",
              "Limon Masa extracts date, time, guest count, and notes.",
              "The request stays pending for restaurant review.",
              "The restaurant approves the reservation manually."
            ].map((step, index) => (
              <div key={step} className="rounded-[24px] bg-[color:var(--bg-strong)] px-5 py-5">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-moss">Step {index + 1}</div>
                <p className="mt-3 text-sm leading-7 text-sage">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustSections.map((section) => (
            <div key={section.title} className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
              <div className="section-title">{section.title}</div>
              <p className="mt-3 text-sm leading-7 text-sage">{section.body}</p>
            </div>
          ))}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
