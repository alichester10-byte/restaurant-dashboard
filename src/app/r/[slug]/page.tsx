import { notFound } from "next/navigation";
import { RestaurantChatWidget } from "@/components/chat/restaurant-chat-widget";
import { PublicReservationRequestForm } from "@/components/integrations/public-reservation-request-form";
import { getEffectivePlan, hasPlanFeature } from "@/lib/plan-config";
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
      },
      services: {
        where: { isActive: true },
        select: { id: true, name: true }
      },
      staffMembers: {
        where: { isActive: true },
        select: { id: true, name: true }
      },
      bookableResources: {
        where: { isActive: true },
        select: { id: true, name: true, type: true }
      }
    }
  });

  if (!business) {
    notFound();
  }

  const embed = searchParams?.embed === "1";
  const settings = business.settings[0];
  const industry = getIndustryConfig(business.businessType);
  const assistantEnabled = hasPlanFeature(
    getEffectivePlan({
      subscriptionPlan: business.subscriptionPlan,
      subscriptionStatus: business.subscriptionStatus
    }),
    "aiAssistant"
  );
  const welcomeMessage =
    `${settings?.restaurantName ?? business.name} için ${industry.requestLabel.toLocaleLowerCase("tr-TR")} memnuniyetle alırım. ` +
    "Gerekli bilgileri paylaşırsanız talebinizi ekip onayına hazırlayabilirim. Nihai uygunluğu işletme ekibi onaylar.";

  return (
    <main className={embed ? "min-h-screen bg-transparent p-4" : "min-h-screen bg-[linear-gradient(180deg,#f6f3eb_0%,#ebe4d8_100%)] px-4 py-10"}>
      <div className={embed ? "mx-auto max-w-3xl" : "mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]"}>
        {!embed ? (
          <section className="glass-panel rounded-[32px] p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-moss">Talep Oluştur</div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-ink">İşletme ekibine yeni {industry.requestLabel.toLocaleLowerCase("tr-TR")} bırakın</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-sage">
              Formu doldurun, talebiniz işletme ekibinin onay akışına düşsün. Uygunluk kontrolü yapıldıktan sonra sizinle dönüş yapılır.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Talep önce kontrol edilir, doğrudan kesinleşmez.",
                "Gerekli bilgiler eksikse ekip sizinle iletişime geçer.",
                "AI asistan açıksa ek bilgileri toplamanıza yardımcı olur."
              ].map((item) => (
                <div key={item} className="rounded-[20px] border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm leading-6 text-sage">
                  {item}
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <PublicReservationRequestForm
          businessSlug={business.slug}
          businessName={business.name}
          industry={industry}
          services={business.services}
          staffMembers={business.staffMembers}
          resources={business.bookableResources}
          embed={embed}
        />
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
