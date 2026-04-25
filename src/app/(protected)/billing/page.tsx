import { BillingPaymentStatus, SubscriptionPlan, UserRole } from "@prisma/client";
import { openEnterpriseContactAction } from "@/actions/billing-actions";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { getBusinessEntitlement, getPlanPricing, hasActiveSubscription, isTrialActive, planCatalog } from "@/lib/billing";
import { requireBusinessAccess } from "@/lib/auth";
import { billingPaymentStatusLabels, subscriptionPlanLabels, subscriptionStatusLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const upgradeCopy: Record<string, { title: string; description: string }> = {
  pro: {
    title: "Pro ile tüm operasyon akışlarını açın",
    description: "Demo modunda ürünü özgürce gezebilirsiniz. Kayıt oluşturma, düzenleme ve canlı kullanım akışları Pro planıyla açılır."
  },
  header: {
    title: "Hazırsanız gerçek kullanıma geçin",
    description: "Üst menüden başlattığınız yükseltme ile rezervasyon, masa, ayarlar ve çağrı yönetimini tam yetkiyle kullanabilirsiniz."
  },
  sidebar: {
    title: "Sidebar'dan yükseltme isteği alındı",
    description: "Pro planı aktive ettiğiniz anda demo kısıtları kalkar ve tüm ekip akışları canlı kullanıma açılır."
  },
  dashboard: {
    title: "Dashboard keşfi açık, aksiyonlar Pro ile açılır",
    description: "Çağrı ekleme ve gerçek operasyon akışlarını canlı kullanmak için Pro planına geçin."
  },
  calls: {
    title: "Çağrı kayıtları Pro ile aktif olur",
    description: "Yeni çağrı kaydetme, ekip takibi ve takip notlarını kalıcı hale getirmek için Pro planına geçin."
  },
  reservations: {
    title: "Rezervasyon yönetimi Pro ile tam açılır",
    description: "Yeni rezervasyon oluşturma, düzenleme, onay ve iptal gibi tüm akışlar Pro planıyla aktif olur."
  },
  tables: {
    title: "Masa planı düzenleme Pro gerektirir",
    description: "Masa durumu güncelleme ve rezervasyonları masalara atama akışları Pro ile açılır."
  },
  settings: {
    title: "Ayarları kaydetmek için Pro gerekir",
    description: "Restoran profili, çalışma saatleri ve servis kurallarını kalıcı olarak güncellemek için Pro planına geçin."
  },
  customers: {
    title: "Müşteri hafızasını ekibiniz için aktive edin",
    description: "VIP notları, segmentleme ve gerçek müşteri operasyonları Pro planıyla tam açılır."
  }
};

export default async function BillingPage({
  searchParams
}: {
  searchParams?: { upgrade?: string; error?: string };
}) {
  const session = await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });

  const business = await prisma.business.findUniqueOrThrow({
    where: {
      id: session.user.businessId
    },
    include: {
      billingPayments: {
        orderBy: {
          createdAt: "desc"
        },
        take: 6
      }
    }
  });

  const entitlement = getBusinessEntitlement(business, session.user.role);
  const trialLive = isTrialActive(business);
  const paidActive = hasActiveSubscription(business);
  const latestPayment = business.billingPayments[0] ?? null;
  const proPlan = getPlanPricing(SubscriptionPlan.PRO);
  const upgradeIntent = searchParams?.upgrade ? upgradeCopy[searchParams.upgrade] ?? upgradeCopy.pro : null;

  return (
    <div className="space-y-6">
      <AppHeader
        title="Plan ve Faturalama"
        subtitle="Demo keşfinden canlı kullanıma geçişi tek bir yükseltme akışıyla yönetin."
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      {upgradeIntent ? (
        <section className="overflow-hidden rounded-[30px] border border-[rgba(201,152,57,0.24)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(201,152,57,0.16)_45%,rgba(33,76,61,0.08)_100%)] p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">Pro&apos;ya Geçiş</div>
          <h2 className="mt-3 text-2xl font-semibold text-ink">{upgradeIntent.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-sage">{upgradeIntent.description}</p>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="rounded-[30px] bg-[linear-gradient(135deg,#163329_0%,#214c3d_45%,#c99839_130%)] p-6 text-white">
            <div className="text-xs uppercase tracking-[0.3em] text-white/65">{entitlement.isDemo ? "Demo Experience" : "Live Operations"}</div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight">
              {entitlement.isDemo ? "Ürünü keşfettiniz. Şimdi ekibinizi canlı kullanıma taşıyın." : "Pro aktif. Tüm operasyon akışları kullanımda."}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
              {entitlement.isDemo
                ? "Dashboard, rezervasyonlar, müşteriler ve masa planı demoda tamamen görünür. Pro ile kayıt oluşturma, düzenleme, iptal, masa atama ve ayar güncelleme anında açılır."
                : "İşletmeniz şu anda tam erişimde. Rezervasyon, çağrı, masa ve ayar akışları ekibiniz için aktif durumda."}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-white/10 p-4">
                <div className="text-sm text-white/70">Mevcut plan</div>
                <div className="mt-2 text-2xl font-semibold">{subscriptionPlanLabels[business.subscriptionPlan]}</div>
              </div>
              <div className="rounded-[24px] bg-white/10 p-4">
                <div className="text-sm text-white/70">Durum</div>
                <div className="mt-2 text-2xl font-semibold">{subscriptionStatusLabels[business.subscriptionStatus]}</div>
              </div>
              <div className="rounded-[24px] bg-white/10 p-4">
                <div className="text-sm text-white/70">Mod</div>
                <div className="mt-2 text-2xl font-semibold">{entitlement.modeLabel}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm text-sage">Trial görünümü</div>
              <div className="mt-3 text-lg font-semibold text-ink">
                {trialLive && business.trialEndsAt ? `Aktif • ${formatDateTime(business.trialEndsAt)}` : "Demo erişimi aktif"}
              </div>
              <p className="mt-2 text-sm leading-6 text-sage">
                Demo modunda ekip ürünün tamamını güvenle keşfeder, ancak kayıtlar korunur ve değişiklikler yazılmaz.
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm text-sage">Son tahsilat</div>
              <div className="mt-3 text-lg font-semibold text-ink">
                {latestPayment ? billingPaymentStatusLabels[latestPayment.status] : "Henüz ödeme başlatılmadı"}
              </div>
              <p className="mt-2 text-sm leading-6 text-sage">
                {latestPayment ? `${formatCurrency(latestPayment.amountMinor / 100)} • ${formatDateTime(latestPayment.updatedAt)}` : "İlk Pro yükseltmenizi başlatarak canlı kullanıma geçebilirsiniz."}
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Pro ile Açılanlar</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Yükseltme sonrası ekibiniz neleri kullanır?</h2>
          <div className="mt-5 grid gap-3">
            {[
              "Yeni rezervasyon oluşturma, düzenleme, onay ve iptal",
              "Masa durumlarını güncelleme ve rezervasyonları masalara atama",
              "Çağrı kaydı ekleme ve gerçek operasyon takibi",
              "Ayarları, çalışma saatlerini ve servis kurallarını kaydetme"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-4 text-sm font-medium text-ink">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] bg-[color:var(--bg-strong)] p-5">
            <div className="text-sm font-semibold text-ink">Canlı kullanım sinyali</div>
            <p className="mt-2 text-sm leading-6 text-sage">
              {paidActive && entitlement.canWrite
                ? "İşletmeniz Pro modunda. Dönem sonu yaklaşırken bu sayfa üzerinden yeniden göz atabilir, ödeme geçmişini izleyebilirsiniz."
                : "Pro planı aktive edildiğinde tüm kilitli işlemler açılır ve ekip hiçbir ekran değiştirmeden çalışmaya devam eder."}
            </p>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <div className="section-title">Planlar</div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <div className="rounded-[26px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm uppercase tracking-[0.22em] text-sage">Starter</div>
              <div className="mt-3 text-3xl font-bold text-ink">Demo Modu</div>
              <p className="mt-3 text-sm leading-6 text-sage">{planCatalog[SubscriptionPlan.STARTER].description}</p>
              <div className="mt-6 rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm font-semibold text-ink">
                Görüntüleme ve ürün keşfi için açık
              </div>
            </div>

            <div className="rounded-[26px] border border-moss bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf8_100%)] p-5 shadow-soft">
              <div className="text-sm uppercase tracking-[0.22em] text-moss">Pro</div>
              <div className="mt-3 text-3xl font-bold text-ink">{proPlan.amountLabel}</div>
              <p className="mt-3 text-sm leading-6 text-sage">{proPlan.description}</p>
              <div className="mt-4 rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-sm font-semibold text-moss">
                {entitlement.isDemo ? "En hızlı canlı kullanım geçişi" : "İşletmeniz için aktif plan"}
              </div>
              <form action="/api/paytr/initiate" method="post" className="mt-6">
                <input type="hidden" name="plan" value={SubscriptionPlan.PRO} />
                <button className="btn-primary w-full" type="submit" disabled={paidActive && business.subscriptionPlan === SubscriptionPlan.PRO}>
                  {paidActive && business.subscriptionPlan === SubscriptionPlan.PRO ? "Pro Aktif" : "PAYTR ile Pro'ya Geç"}
                </button>
              </form>
            </div>

            <div className="rounded-[26px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm uppercase tracking-[0.22em] text-sage">Enterprise</div>
              <div className="mt-3 text-3xl font-bold text-ink">Özel Paket</div>
              <p className="mt-3 text-sm leading-6 text-sage">{planCatalog[SubscriptionPlan.ENTERPRISE].description}</p>
              <form action={openEnterpriseContactAction} className="mt-6">
                <button className="btn-secondary w-full" type="submit">
                  Satış Ekibiyle Görüş
                </button>
              </form>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Abonelik Özeti</div>
          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm text-sage">Aktif mod</div>
              <div className="mt-2 text-xl font-semibold text-ink">{entitlement.modeLabel}</div>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm text-sage">Plan dönemi</div>
              <div className="mt-2 text-xl font-semibold text-ink">
                {business.subscriptionCurrentPeriodEndsAt ? formatDateTime(business.subscriptionCurrentPeriodEndsAt) : "Henüz başlamadı"}
              </div>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm text-sage">Ödeme görünümü</div>
              <div className="mt-2 text-xl font-semibold text-ink">
                {latestPayment?.status === BillingPaymentStatus.PENDING ? "Ödeme işleniyor" : latestPayment ? billingPaymentStatusLabels[latestPayment.status] : "Hazır"}
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="section-title">Ödeme Geçmişi</div>
        <div className="mt-5 space-y-3">
          {business.billingPayments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-white/80 p-5 text-sm text-sage">
              Henüz başlatılmış bir ödeme akışı yok. Hazır olduğunuzda Pro planını tek adımda aktive edebilirsiniz.
            </div>
          ) : (
            business.billingPayments.map((payment) => (
              <div key={payment.id} className="grid gap-3 rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:items-center">
                <div>
                  <div className="text-sm font-semibold text-ink">{subscriptionPlanLabels[payment.plan]}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sage">{payment.merchantOid}</div>
                </div>
                <div className="text-sm text-sage">{formatCurrency(payment.amountMinor / 100)}</div>
                <div className="text-sm font-semibold text-ink">{billingPaymentStatusLabels[payment.status]}</div>
                <div className="text-sm text-sage">
                  {payment.status === BillingPaymentStatus.PENDING ? "PAYTR ödemeyi doğruladığında Pro planı otomatik aktive edilir." : formatDateTime(payment.updatedAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
