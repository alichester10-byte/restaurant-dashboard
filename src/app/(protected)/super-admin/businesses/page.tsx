import Link from "next/link";
import { BusinessStatus, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import {
  addBusinessInternalNoteAction,
  forceLogoutBusinessSessionsAction,
  resetBusinessIntegrationStatusAction
} from "@/actions/super-admin-actions";
import { superAdminCreateBusinessAction, updateBusinessStatusAction } from "@/actions/tenant-actions";
import { AppHeader } from "@/components/layout/app-header";
import { SuperAdminControlNav } from "@/components/super-admin/control-center-nav";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSuperAdmin } from "@/lib/auth";
import {
  businessStatusLabels,
  integrationStatusLabels,
  subscriptionPlanLabels,
  subscriptionStatusLabels
} from "@/lib/constants";
import { getSuperAdminBusinessesCenterData } from "@/lib/super-admin";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminBusinessesPage({
  searchParams
}: {
  searchParams?: { search?: string; filter?: "all" | "demo" | "pro" | "suspended" | "trial"; saved?: string };
}) {
  const session = await requireSuperAdmin();
  const businesses = await getSuperAdminBusinessesCenterData({
    search: searchParams?.search,
    filter: searchParams?.filter
  });

  return (
    <div className="space-y-6">
      <AppHeader
        title="İşletme Yönetimi"
        subtitle="Müşteri işletmelerini, plan durumlarını, Meta kanal sağlığını ve kritik erişim aksiyonlarını tek merkezden yönetin."
        businessName={session.user.business.name}
        role={UserRole.SUPER_ADMIN}
      />

      <SuperAdminControlNav />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="section-title">Yeni İşletme Oluştur</div>
          <form action={superAdminCreateBusinessAction} className="mt-5 space-y-4">
            <input type="hidden" name="redirectTo" value="/super-admin/businesses" />
            <div className="grid gap-4 md:grid-cols-2">
              <input className="field" name="businessName" placeholder="İşletme adı" required />
              <input className="field" name="ownerName" placeholder="Kurucu adı" required />
              <input className="field" name="ownerEmail" type="email" placeholder="kurucu@isletme.com" required />
              <input className="field" name="ownerPhone" placeholder="+90 5.." required />
              <input className="field" name="businessPhone" placeholder="İşletme telefonu" required />
              <input className="field" name="adminPassword" type="password" defaultValue="Welcome123!" required />
              <input className="field md:col-span-2" name="businessAddress" placeholder="Adres" required />
              <input className="field" name="city" placeholder="Şehir" required />
              <input className="field" name="district" placeholder="İlçe" required />
              <input className="field" name="restaurantType" placeholder="Hizmet odağı" required />
              <input className="field" type="number" name="estimatedTableCount" defaultValue={12} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <select className="field" name="plan" defaultValue={SubscriptionPlan.STARTER}>
                {Object.values(SubscriptionPlan).map((plan) => (
                  <option key={plan} value={plan}>
                    {subscriptionPlanLabels[plan]}
                  </option>
                ))}
              </select>
              <select className="field" name="subscriptionStatus" defaultValue={SubscriptionStatus.TRIALING}>
                {Object.values(SubscriptionStatus).map((status) => (
                  <option key={status} value={status}>
                    {subscriptionStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
            <textarea className="field min-h-24" name="notes" placeholder="İç operasyon notları" />
            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-ink">
              <input type="checkbox" name="createDefaultTables" value="true" defaultChecked />
              Varsayılan kaynak planı oluştur
            </label>
            <button className="btn-primary w-full" type="submit">
              İşletmeyi Oluştur
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="section-title">Arama ve Filtre</div>
          <form className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <input className="field" name="search" defaultValue={searchParams?.search ?? ""} placeholder="İşletme, sahip veya şehir ara" />
            <select className="field" name="filter" defaultValue={searchParams?.filter ?? "all"}>
              <option value="all">Tümü</option>
              <option value="demo">Demo</option>
              <option value="pro">Pro</option>
              <option value="trial">Trial</option>
              <option value="suspended">Askıda</option>
            </select>
            <button className="btn-secondary" type="submit">
              Güncelle
            </button>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-[color:var(--bg-strong)] p-5">
              <div className="text-sm font-semibold text-ink">Kanal Sağlığı</div>
              <p className="mt-2 text-sm leading-6 text-sage">WhatsApp, Instagram, Website ve AI bağlantıları işletme satırında birlikte görünür.</p>
            </div>
            <div className="rounded-[24px] bg-[color:var(--bg-strong)] p-5">
              <div className="text-sm font-semibold text-ink">Hızlı Operasyon</div>
              <p className="mt-2 text-sm leading-6 text-sage">Askıya alma, trial uzatma, tüm oturumları sonlandırma ve entegrasyon reset aksiyonları doğrudan erişilebilir.</p>
            </div>
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="section-title">Müşteri İşletmeleri</div>
        <div className="mt-5 space-y-4">
          {businesses.map((business) => (
            <div key={business.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/super-admin/${business.id}`} className="text-xl font-semibold text-ink transition hover:text-moss">
                      {business.name}
                    </Link>
                    <StatusBadge value={business.status} />
                    <span className="rounded-full bg-[color:var(--bg-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sage">
                      {subscriptionPlanLabels[business.subscriptionPlan]}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4">
                      <div className="text-sm text-sage">Sahip</div>
                      <div className="mt-2 font-semibold text-ink">{business.owner?.name ?? business.ownerName}</div>
                      <div className="mt-1 text-sm text-sage">{business.owner?.email ?? business.ownerEmail}</div>
                    </div>
                    <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4">
                      <div className="text-sm text-sage">Durum</div>
                      <div className="mt-2 font-semibold text-ink">{subscriptionStatusLabels[business.subscriptionStatus]}</div>
                      <div className="mt-1 text-sm text-sage">Kuruluş: {formatDateTime(business.createdAt)}</div>
                    </div>
                    <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4">
                      <div className="text-sm text-sage">Son Giriş</div>
                      <div className="mt-2 font-semibold text-ink">{business.lastLoginAt ? formatDateTime(business.lastLoginAt) : "Yok"}</div>
                      <div className="mt-1 text-sm text-sage">Billing: {business.latestPayment?.status ?? business.subscriptionStatus}</div>
                    </div>
                    <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4">
                      <div className="text-sm text-sage">Kanallar</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink">
                        <span>{business.channels.whatsapp ? "WhatsApp" : "WA -"}</span>
                        <span>{business.channels.instagram ? "Instagram" : "IG -"}</span>
                        <span>{business.channels.website ? "Website" : "Web -"}</span>
                        <span>{business.channels.ai ? "AI" : "AI -"}</span>
                      </div>
                      <div className="mt-2 text-sm text-sage">Meta: {business.metaStatus === "configured" ? "Hazır" : business.metaStatus === "error" ? "Hata" : "Kurulum gerekli"}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-sage">
                    <span>{business._count.reservations} rezervasyon</span>
                    <span>{business._count.customers} müşteri</span>
                    <span>{business._count.tables} masa</span>
                    <span>{business.city ?? "-"} / {business.district ?? "-"}</span>
                  </div>

                  <form action={addBusinessInternalNoteAction} className="space-y-3">
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="redirectTo" value="/super-admin/businesses" />
                    <textarea className="field min-h-20" name="internalNotes" defaultValue={business.internalNotes ?? ""} placeholder="İç admin notu" />
                    <button className="btn-secondary" type="submit">
                      İç Notu Kaydet
                    </button>
                  </form>
                </div>

                <div className="grid w-full max-w-xl gap-3 md:grid-cols-2">
                  <form action={updateBusinessStatusAction} className="contents">
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="redirectTo" value="/super-admin/businesses" />
                    <select className="field" name="status" defaultValue={business.status}>
                      {Object.values(BusinessStatus).map((status) => (
                        <option key={status} value={status}>
                          {businessStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <select className="field" name="plan" defaultValue={business.subscriptionPlan}>
                      {Object.values(SubscriptionPlan).map((plan) => (
                        <option key={plan} value={plan}>
                          {subscriptionPlanLabels[plan]}
                        </option>
                      ))}
                    </select>
                    <select className="field" name="subscriptionStatus" defaultValue={business.subscriptionStatus}>
                      {Object.values(SubscriptionStatus).map((status) => (
                        <option key={status} value={status}>
                          {subscriptionStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <input className="field" type="number" min={0} max={90} name="trialDays" placeholder="Trial gün" />
                    <textarea className="field min-h-24 md:col-span-2" name="internalNotes" defaultValue={business.internalNotes ?? ""} placeholder="Not ve durum özeti" />
                    <button className="btn-primary md:col-span-2" type="submit">
                      Plan / Durum Güncelle
                    </button>
                  </form>

                  <Link href={`/super-admin/${business.id}`} className="btn-secondary">
                    Detay
                  </Link>
                  <form action={forceLogoutBusinessSessionsAction}>
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="redirectTo" value="/super-admin/businesses" />
                    <button className="btn-secondary w-full" type="submit">
                      Oturumları Kapat
                    </button>
                  </form>
                  <form action={resetBusinessIntegrationStatusAction}>
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="redirectTo" value="/super-admin/businesses" />
                    <button className="btn-secondary w-full" type="submit">
                      Entegrasyonu Sıfırla
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
