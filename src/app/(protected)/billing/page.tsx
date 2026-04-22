import { SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { createBillingPortalAction, createCheckoutSessionAction, openEnterpriseContactAction } from "@/actions/billing-actions";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { hasActiveSubscription, hasBusinessAccess, isTrialActive } from "@/lib/billing";
import { requireBusinessAccess } from "@/lib/auth";
import { subscriptionPlanLabels, subscriptionStatusLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function BillingPage() {
  const session = await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });

  const business = await prisma.business.findUniqueOrThrow({
    where: {
      id: session.user.businessId
    }
  });

  const accessActive = hasBusinessAccess(business, session.user.role);
  const trialLive = isTrialActive(business);
  const paidActive = hasActiveSubscription(business);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Faturalama"
        subtitle="Planınızı yönetin, Stripe Checkout ile yükseltin ve abonelik durumunu takip edin."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      {!accessActive ? (
        <Panel className="border-rose-200 bg-rose-50/80">
          <div className="section-title text-rose-600">Erişim Kısıtlı</div>
          <h2 className="mt-2 text-xl font-semibold text-rose-700">Operasyon modülleri şu anda kilitli</h2>
          <p className="mt-3 text-sm leading-6 text-rose-700">
            Trial süreniz dolmuş veya abonelik durumunuz aktif değil. Bu sayfadan planınızı yükselterek erişimi yeniden açabilirsiniz.
          </p>
        </Panel>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="section-title">Mevcut Abonelik</div>
          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] p-5 text-white">
              <div className="text-sm text-white/70">Plan</div>
              <div className="mt-2 text-3xl font-bold">{subscriptionPlanLabels[business.subscriptionPlan]}</div>
              <div className="mt-2 text-sm text-white/75">{subscriptionStatusLabels[business.subscriptionStatus]}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/90 p-4">
                <div className="text-sm text-sage">Trial Durumu</div>
                <div className="mt-2 font-semibold text-ink">
                  {trialLive && business.trialEndsAt ? `Aktif • ${formatDateTime(business.trialEndsAt)}` : "Trial kapalı"}
                </div>
              </div>
              <div className="rounded-2xl bg-white/90 p-4">
                <div className="text-sm text-sage">Dönem Sonu</div>
                <div className="mt-2 font-semibold text-ink">
                  {business.subscriptionCurrentPeriodEndsAt ? formatDateTime(business.subscriptionCurrentPeriodEndsAt) : "Yok"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm text-sage">
              Stripe müşteri: {business.stripeCustomerId ?? "Henüz oluşmadı"}
              <br />
              Stripe abonelik: {business.stripeSubscriptionId ?? "Henüz oluşmadı"}
            </div>

            {business.stripeCustomerId ? (
              <form action={createBillingPortalAction}>
                <button className="btn-secondary w-full" type="submit">
                  Stripe Billing Portal
                </button>
              </form>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Planlar</div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-sage">Starter</div>
              <div className="mt-3 text-3xl font-bold text-ink">Trial / Ücretsiz</div>
              <p className="mt-3 text-sm leading-6 text-sage">
                Onboarding, temel operasyon panelleri ve başlangıç kullanım senaryoları için.
              </p>
              <div className="mt-6 rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm font-semibold text-ink">
                Mevcut planınız bu plana düşürülemez; trial erişimi plan durumuna göre yönetilir.
              </div>
            </div>

            <div className="rounded-[24px] border border-moss bg-white p-5 shadow-soft">
              <div className="text-sm uppercase tracking-[0.2em] text-moss">Pro</div>
              <div className="mt-3 text-3xl font-bold text-ink">Stripe Checkout</div>
              <p className="mt-3 text-sm leading-6 text-sage">
                Üretim işletmeleri için aktif abonelik, ödeme takibi ve self-serve billing portal desteği.
              </p>
              <form action={createCheckoutSessionAction} className="mt-6">
                <input type="hidden" name="plan" value={SubscriptionPlan.PRO} />
                <button className="btn-primary w-full" type="submit" disabled={paidActive && business.subscriptionPlan === SubscriptionPlan.PRO}>
                  {paidActive && business.subscriptionPlan === SubscriptionPlan.PRO ? "Aktif Plan" : "Pro'ya Yükselt"}
                </button>
              </form>
            </div>

            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-sage">Enterprise</div>
              <div className="mt-3 text-3xl font-bold text-ink">Placeholder</div>
              <p className="mt-3 text-sm leading-6 text-sage">
                Çok lokasyon, özel SLA, özel onboarding ve satış destekli fiyatlama için hazır yapı.
              </p>
              <form action={openEnterpriseContactAction} className="mt-6">
                <button className="btn-secondary w-full" type="submit">
                  Satış Ekibiyle Görüş
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-[color:var(--bg-strong)] p-5 text-sm leading-6 text-sage">
            Webhook olayları: <code>checkout.session.completed</code>, <code>customer.subscription.updated</code>, <code>customer.subscription.deleted</code>, <code>invoice.payment_failed</code>.
          </div>
        </Panel>
      </section>
    </div>
  );
}
