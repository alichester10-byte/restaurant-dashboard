import { BusinessStatus, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { superAdminCreateBusinessAction, updateBusinessStatusAction } from "@/actions/tenant-actions";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireRole } from "@/lib/auth";
import { businessStatusLabels, subscriptionPlanLabels, subscriptionStatusLabels, userRoleLabels } from "@/lib/constants";
import { getSuperAdminData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminPage() {
  const session = await requireRole(UserRole.SUPER_ADMIN);
  const data = await getSuperAdminData();

  return (
    <div className="space-y-6">
      <AppHeader
        title="Süper Admin Paneli"
        subtitle="İşletmeleri oluşturun, planları yönetin ve trial yaşam döngüsünü merkezi olarak kontrol edin."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="section-title">Yeni İşletme</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">İşletme ve ilk yönetici hesabı oluştur</h2>
          <form action={superAdminCreateBusinessAction} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İşletme Adı</span>
                <input className="field" name="businessName" placeholder="Limon Masa Kadıköy" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Slug</span>
                <input className="field" name="slug" placeholder="limon-masa-kadikoy" required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Restoran Adı</span>
                <input className="field" name="restaurantName" placeholder="Limon Masa Kadıköy" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Telefon</span>
                <input className="field" name="phone" placeholder="+90 555 123 45 67" required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İlk Yönetici</span>
                <input className="field" name="adminName" placeholder="Ayşe Operasyon" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Yönetici E-postası</span>
                <input className="field" type="email" name="adminEmail" placeholder="admin@ornekrestoran.com" required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İlk Şifre</span>
                <input className="field" type="password" name="adminPassword" defaultValue="Welcome123!" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Toplam Kapasite</span>
                <input className="field" type="number" name="seatingCapacity" defaultValue={80} required />
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
            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-ink">
              <input type="checkbox" name="createDefaultTables" value="true" defaultChecked />
              Varsayılan masa planını da oluştur
            </label>
            <button className="btn-primary w-full" type="submit">
              İşletme Oluştur
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="section-title">Trial ve Plan Özeti</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/90 p-4">
              <div className="text-sm text-sage">Toplam İşletme</div>
              <div className="mt-2 text-3xl font-bold text-ink">{data.businesses.length}</div>
            </div>
            <div className="rounded-2xl bg-white/90 p-4">
              <div className="text-sm text-sage">Trialing</div>
              <div className="mt-2 text-3xl font-bold text-ink">
                {data.businesses.filter((business) => business.subscriptionStatus === SubscriptionStatus.TRIALING).length}
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {data.businesses.slice(0, 5).map((business) => (
              <div key={business.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="font-semibold text-ink">{business.name}</div>
                <div className="mt-1 text-sm text-sage">
                  {subscriptionPlanLabels[business.subscriptionPlan]} • {subscriptionStatusLabels[business.subscriptionStatus]}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sage">
                  {business.trialEndsAt ? `Trial bitişi ${formatDateTime(business.trialEndsAt)}` : "Trial tarihi yok"}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="section-title">Tüm İşletmeler</div>
        <div className="mt-5 space-y-4">
          {data.businesses.map((business) => (
            <div key={business.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-xl font-semibold text-ink">{business.name}</div>
                  <div className="mt-1 text-sm text-sage">
                    {business.slug} • {businessStatusLabels[business.status]} • {subscriptionPlanLabels[business.subscriptionPlan]} • {subscriptionStatusLabels[business.subscriptionStatus]}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-sage">
                    <span>{business._count.users} kullanıcı</span>
                    <span>{business._count.customers} müşteri</span>
                    <span>{business._count.reservations} rezervasyon</span>
                  </div>
                  <div className="mt-2 text-xs text-sage">
                    {business.users.map((user) => `${user.name} (${userRoleLabels[user.role]})`).join(" • ")}
                  </div>
                </div>
                <form action={updateBusinessStatusAction} className="grid gap-3 md:grid-cols-4">
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
                  <button className="btn-secondary" type="submit">
                    Güncelle
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
