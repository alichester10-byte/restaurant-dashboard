import { SubscriptionPlan } from "@prisma/client";
import { notFound } from "next/navigation";
import { RestaurantChatWidget } from "@/components/chat/restaurant-chat-widget";
import { PublicReservationRequestForm } from "@/components/integrations/public-reservation-request-form";
import { getIndustryConfig } from "@/lib/industry-config";
import { prisma } from "@/lib/prisma";

export default async function PublicReservationPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams?: { embed?: string };
}) {
  const business = await prisma.business.findUnique({
    where: {
      slug: params.slug
    },
    include: {
      settings: {
        take: 1
      }
    }
  });

  if (!business) {
    notFound();
  }

  const embed = searchParams?.embed === "1";
  const settings = business.settings[0];
  const industry = getIndustryConfig(business.businessType);
  const assistantEnabled = business.subscriptionPlan !== SubscriptionPlan.STARTER;
  const welcomeMessage =
    `${settings?.restaurantName ?? business.name} için ${industry.requestLabel.toLocaleLowerCase("tr-TR")} memnuniyetle alırım. ` +
    "Gerekli bilgileri paylaşırsanız talebinizi ekip onayına hazırlayabilirim. Nihai uygunluğu işletme ekibi onaylar.";

  return (
    <main className={embed ? "min-h-screen bg-transparent p-4" : "min-h-screen bg-[linear-gradient(180deg,#f6f3eb_0%,#ebe4d8_100%)] px-4 py-10"}>
      <div className={embed ? "mx-auto max-w-3xl" : "mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]"}>
        {!embed ? (
          <section className="glass-panel rounded-[36px] p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-moss">Limon Masa</div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl text-ink">Online {industry.requestLabel.toLocaleLowerCase("tr-TR")} akışı</h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-sage">
              Web, Google ve widget üzerinden gelen talepler doğrudan işletme ekibinin onay akışına düşer. Müşteri kaydı kesinleştirmez; ekip uygunluğu kontrol edip dönüş yapar.
            </p>
          </section>
        ) : null}
        <PublicReservationRequestForm businessSlug={business.slug} businessName={business.name} industry={industry} embed={embed} />
      </div>
      {!embed ? (
        <RestaurantChatWidget
          restaurantId={business.id}
          restaurantName={settings?.restaurantName ?? business.name}
          assistantEnabled={assistantEnabled}
          welcomeMessage={welcomeMessage}
        />
      ) : null}
    </main>
  );
}
