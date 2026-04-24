import { BusinessStatus, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { superAdminCreateBusinessAction, updateBusinessStatusAction } from "@/actions/tenant-actions";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSuperAdmin } from "@/lib/auth";
import {
  businessStatusLabels,
  subscriptionPlanLabels,
  subscriptionStatusLabels,
  userRoleLabels
} from "@/lib/constants";
import { getSuperAdminData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

const superAdminErrorMessages: Record<string, string> = {
  validation: "İşletme formunda eksik veya hatalı alanlar var.",
  owner_email_exists: "Bu sahip e-postasıyla zaten bir işletme bulunuyor.",
  unknown: "İşlem sırasında beklenmeyen bir hata oluştu.",
  update_business: "İşletme bilgileri güncellenemedi. Lütfen tekrar deneyin."
};

export default async function SuperAdminPage({
  searchParams
}: {
  searchParams?: { error?: string; created?: string; search?: string; filter?: "all" | "demo" | "pro" | "suspended" | "trial" };
}) {
  const session = await requireSuperAdmin();
  const filter = searchParams?.filter ?? "all";
  const data = await getSuperAdminData({
    search: searchParams?.search,
    filter
  });
  const errorMessage = searchParams?.error ? superAdminErrorMessages[searchParams.error] ?? superAdminErrorMessages.unknown : null;
  const created = searchParams?.created === "1";

  return (
    <div className="space-y-6">
      <AppHeader
        title="Süper Admin"
        subtitle="Tüm işletmeleri, planları, trial durumlarını ve iç operasyon notlarını tek panelden yönetin."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      {errorMessage ? (
        <Panel className="border-rose-200 bg-rose-50/80">
          <div className="section-title text-rose-600">İşlem Başarısız</div>
          <p className="mt-3 text-sm leading-6 text-rose-700">{errorMessage}</p>
        </Panel>
      ) : null}

      {created ? (
        <Panel className="border-emerald-200 bg-emerald-50/80">
          <div className="section-title text-emerald-700">İşletme Oluşturuldu</div>
          <p className="mt-3 text-sm leading-6 text-emerald-700">
            Yeni işletme, ilk yönetici hesabı ve varsayılan çalışma alanı başarıyla hazırlandı.
          </p>
        </Panel>
      ) : null}

      <section className="grid gap-4 md:grid-cols-5">
        <Panel><div className="text-sm text-sage">Toplam İşletme</div><div className="mt-2 text-3xl font-bold text-ink">{data.summary.total}</div></Panel>
        <Panel><div className="text-sm text-sage">Demo</div><div className="mt-2 text-3xl font-bold text-ink">{data.summary.demo}</div></Panel>
        <Panel><div className="text-sm text-sage">Pro</div><div className="mt-2 text-3xl font-bold text-ink">{data.summary.pro}</div></Panel>
        <Panel><div className="text-sm text-sage">Trial</div><div className="mt-2 text-3xl font-bold text-ink">{data.summary.trial}</div></Panel>
        <Panel><div className="text-sm text-sage">Askıda</div><div className="mt-2 text-3xl font-bold text-ink">{data.summary.suspended}</div></Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="section-title">Yeni İşletme Başlat</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Kurucu ve restoran bilgileriyle yeni çalışma alanı açın</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Slug arka planda otomatik oluşturulur. Kurucunun giriş hesabı, varsayılan ayarlar ve isteğe bağlı masa planı aynı akışta hazırlanır.
          </p>

          <form action={superAdminCreateBusinessAction} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İşletme Adı</span>
                <input className="field" name="businessName" placeholder="Limon Masa Kadıköy" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Kurucu Ad Soyad</span>
                <input className="field" name="ownerName" placeholder="Ayşe Kaya" required />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Kurucu E-postası</span>
                <input className="field" type="email" name="ownerEmail" placeholder="ayse@restoran.com" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Kurucu Telefonu</span>
                <input className="field" name="ownerPhone" placeholder="+90 555 123 45 67" required />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İşletme Telefonu</span>
                <input className="field" name="businessPhone" placeholder="+90 216 555 22 11" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İlk Şifre</span>
                <input className="field" type="password" name="adminPassword" defaultValue="Welcome123!" required />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Adres</span>
              <input className="field" name="businessAddress" placeholder="Bağdat Caddesi No: 45" required />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Şehir</span>
                <input className="field" name="city" placeholder="İstanbul" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İlçe</span>
                <input className="field" name="district" placeholder="Kadıköy" required />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Restoran Tipi</span>
                <input className="field" name="restaurantType" placeholder="Modern Türk Mutfağı" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Tahmini Masa Sayısı</span>
                <input className="field" type="number" name="estimatedTableCount" defaultValue={12} required />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Plan</span>
                <select className="field" name="plan" defaultValue={SubscriptionPlan.STARTER}>
                  {Object.values(SubscriptionPlan).map((plan) => (
                    <option key={plan} value={plan}>
                      {subscriptionPlanLabels[plan]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Abonelik Durumu</span>
                <select className="field" name="subscriptionStatus" defaultValue={SubscriptionStatus.TRIALING}>
                  {Object.values(SubscriptionStatus).map((status) => (
                    <option key={status} value={status}>
                      {subscriptionStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">İç Notlar</span>
              <textarea className="field min-h-24" name="notes" placeholder="Kurulum önceliği, satış notları, onboarding beklentileri..." />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-ink">
              <input type="checkbox" name="createDefaultTables" value="true" defaultChecked />
              Varsayılan masa planını da oluştur
            </label>

            <button className="btn-primary w-full" type="submit">
              İşletmeyi Oluştur
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="section-title">Arama ve Filtreleme</div>
          <form className="mt-4 space-y-4" action="/super-admin">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">İşletme ara</span>
              <input className="field" name="search" defaultValue={searchParams?.search ?? ""} placeholder="İşletme adı, sahibi, şehir..." />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Filtre</span>
              <select className="field" name="filter" defaultValue={filter}>
                <option value="all">Tümü</option>
                <option value="demo">Demo</option>
                <option value="pro">Pro</option>
                <option value="trial">Trial</option>
                <option value="suspended">Askıda</option>
              </select>
            </label>
            <button className="btn-secondary w-full" type="submit">
              Sonuçları Güncelle
            </button>
          </form>

          <div className="mt-6 rounded-[24px] bg-[color:var(--bg-strong)] p-5">
            <div className="text-sm font-semibold text-ink">Kurucu görünümü</div>
            <p className="mt-2 text-sm leading-6 text-sage">
              Bu panelden işletme sahibi iletişim bilgileri, plan durumu, trial süresi, iç notlar, son aktivite ve temel operasyon hacmi birlikte izlenir.
            </p>
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="section-title">İşletme Portföyü</div>
        <div className="mt-5 space-y-4">
          {data.businesses.map((business) => {
            const primaryOwner = business.users.find((user) => user.role === UserRole.BUSINESS_ADMIN) ?? business.users[0];

            return (
              <div key={business.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-xl font-semibold text-ink">{business.name}</div>
                        <StatusBadge value={business.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-sage">
                        <span>{subscriptionPlanLabels[business.subscriptionPlan]}</span>
                        <span>{subscriptionStatusLabels[business.subscriptionStatus]}</span>
                        <span>{business.city ?? "Şehir yok"} / {business.district ?? "İlçe yok"}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4">
                        <div className="text-sm text-sage">Sahip</div>
                        <div className="mt-2 font-semibold text-ink">{business.ownerName}</div>
                        <div className="mt-1 text-sm text-sage">{business.ownerEmail}</div>
                        <div className="text-sm text-sage">{business.ownerPhone}</div>
                      </div>
                      <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4">
                        <div className="text-sm text-sage">İşletme</div>
                        <div className="mt-2 font-semibold text-ink">{business.businessPhone}</div>
                        <div className="mt-1 text-sm text-sage">{business.businessAddress ?? "Adres yok"}</div>
                        <div className="text-sm text-sage">{business.restaurantType ?? "Kategori yok"}</div>
                      </div>
                      <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4">
                        <div className="text-sm text-sage">Aktivite</div>
                        <div className="mt-2 font-semibold text-ink">{business.lastActivityAt ? formatDateTime(business.lastActivityAt) : "Henüz yok"}</div>
                        <div className="mt-1 text-sm text-sage">Kuruluş: {formatDateTime(business.createdAt)}</div>
                        <div className="text-sm text-sage">Trial bitişi: {business.trialEndsAt ? formatDateTime(business.trialEndsAt) : "Tanımsız"}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-sage">
                      <span>{business._count.reservations} rezervasyon</span>
                      <span>{business._count.customers} müşteri</span>
                      <span>{business._count.tables} masa</span>
                      <span>{business._count.users} kullanıcı</span>
                    </div>

                    <div className="text-sm text-sage">
                      Yönetim: {(primaryOwner ? `${primaryOwner.name} (${userRoleLabels[primaryOwner.role]})` : "Atanmamış")}
                    </div>

                    {business.internalNotes ? (
                      <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4 text-sm leading-6 text-sage">
                        İç not: {business.internalNotes}
                      </div>
                    ) : null}

                    {business.auditLogs.length > 0 ? (
                      <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4">
                        <div className="text-sm font-semibold text-ink">Son aktivite</div>
                        <div className="mt-3 space-y-2 text-sm text-sage">
                          {business.auditLogs.map((log) => (
                            <div key={log.id} className="flex flex-wrap items-center justify-between gap-2">
                              <span>{log.message}</span>
                              <span>{formatDateTime(log.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <form action={updateBusinessStatusAction} className="grid w-full max-w-xl gap-3 md:grid-cols-2 xl:w-[420px]">
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="redirectTo" value="/super-admin" />
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
                    <input className="field" type="number" min={0} max={90} name="trialDays" placeholder="Trial uzatma (gün)" />
                    <textarea
                      className="field min-h-24 md:col-span-2"
                      name="internalNotes"
                      defaultValue={business.internalNotes ?? ""}
                      placeholder="Kurucu için iç operasyon notu, takip aksiyonu veya destek bilgisi..."
                    />
                    <button className="btn-primary md:col-span-2" type="submit">
                      İşletmeyi Güncelle
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
