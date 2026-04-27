import type { Metadata } from "next";
import { PublicFooter } from "@/components/public/public-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy and data handling information for Limon Masa."
};

const sections = [
  {
    title: "Business data isolation",
    body: "Each restaurant workspace is designed to keep business records separated. Access is limited to authorized users within the restaurant account and approved platform administrators when operational support is required."
  },
  {
    title: "Reservation request handling",
    body: "Messages from supported channels may be converted into pending reservation requests. Restaurants review and approve these requests before they become confirmed reservations."
  },
  {
    title: "Payments and billing",
    body: "Payment information is processed through supported payment partners such as PAYTR. Limon Masa does not present raw payment credentials in the customer interface."
  },
  {
    title: "Security practices",
    body: "Passwords are stored securely, session controls are applied, and security-related platform events can be logged to help investigate suspicious activity and protect restaurant accounts."
  }
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ed_0%,#efe6d7_100%)] text-ink">
      <main className="mx-auto w-full max-w-4xl px-6 py-16 md:px-10 md:py-24">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_120px_rgba(44,62,45,0.12)] backdrop-blur md:p-12">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">Privacy Policy</div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl md:text-5xl">Privacy and data handling</h1>
          <p className="mt-5 text-base leading-8 text-sage">
            Limon Masa is built to help restaurants manage customer communication and reservation operations while keeping control in human hands.
          </p>

          <div className="mt-10 space-y-4">
            {sections.map((section) => (
              <section key={section.title} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--bg-strong)] px-5 py-5">
                <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-sage md:text-base">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
