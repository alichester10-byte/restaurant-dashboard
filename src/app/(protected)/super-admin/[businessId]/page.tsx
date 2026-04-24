import Link from "next/link";
import { BusinessStatus, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import {
  cancelBusinessSubscriptionAction,
  impersonateBusinessAdminAction,
  resetBusinessDataAction
} from "@/actions/super-admin-actions";
import { updateBusinessStatusAction } from "@/actions/tenant-actions";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSuperAdmin } from "@/lib/auth";
import {
  billingPaymentStatusLabels,
  businessStatusLabels,
  subscriptionPlanLabels,
  subscriptionStatusLabels,
  userRoleLabels
} from "@/lib/constants";
import { getSuperAdminBusinessDetail } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminBusinessDetailPage({
  params,
  searchParams
}: {
  params: { businessId: string };
  searchParams?: { saved?: string; error?: string };
}) {
  await requireSuperAdmin();
  const data = await getSuperAdminBusinessDetail(params.businessId);
  const businessAdmin = data.business.users.find((user) => user.role === UserRole.BUSINESS_ADMIN) ?? data.business.users[0];

  return (
    <div className="space-y-6">
      <AppHeader
        title={data.business.name}
        subtitle="İşletme detayları, ödeme görünürlüğü, aktivite metrikleri ve tam kontrol aksiyonları."
        businessName={data.business.name}
        role={UserRole.SUPER_ADMIN}
      />

      {searchParams?.saved ? (
        <Panel className="border-emerald-200 bg-emerald-50/80">
          <div className="section-title text-emerald-700">İşlem Tamamlandı</div>
          <p className="mt-2 text-sm leading-6 text-emerald-700">
            {searchParams.saved === "reset" ? "İşletmenin operasyon verileri sıfırlandı." : "İşletme ayarları güncellendi."}
          </p>
        </Panel>
      ) : null}

      {searchParams?.error ? (
        <Panel className="border-rose-200 bg-rose-50/80">
          <div className="section-title text-rose-700">İşlem Tamamlanamadı</div>
          <p className="mt-2 text-sm leading-6 text-rose-700">
            İşletme aksiyonu uygulanamadı. Onay alanlarını ve yetki durumunu tekrar kontrol edin.
          </p>
        </Panel>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/super-admin" className="btn-secondary">
          Tüm İşletmelere Dön
        </Link>
        <form action={impersonateBusinessAdminAction}>
          <input type="hidden" name="businessId" value={data.business.id} />
          <input type="hidden" name="redirectTo" value="/dashboard" />
          <button className="btn-primary" type="submit">
            İşletme Yöneticisi Gibi Gör
          </button>
        </form>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Panel><div className="text-sm text-sage">Toplam Rezervasyon</div><div className="mt-2 text-3xl font-bold text-ink">{data.metrics.totalReservations}</div></Panel>
        <Panel><div className="text-sm text-sage">Bugünkü Rezervasyon</div><div className="mt-2 text-3xl font-bold text-ink">{data.metrics.todayReservations}</div></Panel>
        <Panel><div className="text-sm text-sage">Toplam Müşteri</div><div className="mt-2 text-3xl font-bold text-ink">{data.metrics.totalCustomers}</div></Panel>
        <Panel><div className="text-sm text-sage">Toplam Masa</div><div className="mt-2 text-3xl font-bold text-ink">{data.metrics.totalTables}</div></Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Panel>
          <div className="section-title">İşletme Özeti</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/90 p-4">
              <div className="text-sm text-sage">Sahip Bilgisi</div>
              <div className="mt-2 font-semibold text-ink">{data.business.ownerName}</div>
              <div className="mt-1 text-sm text-sage">{data.business.ownerEmail}</div>
              <div className="text-sm text-sage">{data.business.ownerPhone}</div>
            </div>
            <div className="rounded-2xl bg-white/90 p-4">
              <div className="text-sm text-sage">İşletme Bilgisi</div>
              <div className="mt-2 font-semibold text-ink">{data.business.name}</div>
              <div className="mt-1 text-sm text-sage">{data.business.businessAddress ?? "Adres yok"}</div>
              <div className="text-sm text-sage">{data.business.city ?? "-"} / {data.business.district ?? "-"}</div>
              <div className="text-sm text-sage">{data.business.restaurantType ?? "Kategori yok"}</div>
            </div>
            <div className="rounded-2xl bg-white/90 p-4">
              <div className="text-sm text-sage">Plan ve Trial</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge value={data.business.status} />
                <div className="text-sm font-semibold text-ink">{subscriptionPlanLabels[data.business.subscriptionPlan]}</div>
              </div>
              <div className="mt-2 text-sm text-sage">{subscriptionStatusLabels[data.business.subscriptionStatus]}</div>
              <div className="text-sm text-sage">Trial bitişi: {data.business.trialEndsAt ? formatDateTime(data.business.trialEndsAt) : "Tanımsız"}</div>
            </div>
            <div className="rounded-2xl bg-white/90 p-4">
              <div className="text-sm text-sage">Aktivite</div>
              <div className="mt-2 text-sm font-semibold text-ink">Kuruluş: {formatDateTime(data.business.createdAt)}</div>
              <div className="mt-1 text-sm text-sage">Son hareket: {data.business.lastActivityAt ? formatDateTime(data.business.lastActivityAt) : "Henüz yok"}</div>
              <div className="mt-1 text-sm text-sage">
                Son giriş: {businessAdmin?.lastLoginAt ? formatDateTime(businessAdmin.lastLoginAt) : "Kayıt yok"}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
            <div className="text-sm text-sage">İç Admin Notları</div>
            <div className="mt-2 text-sm leading-6 text-ink">{data.business.internalNotes || "Henüz not eklenmemiş."}</div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Tam Kontrol</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Plan, durum ve trial yaşam döngüsünü yönetin</h2>
          <form action={updateBusinessStatusAction} className="mt-5 grid gap-4">
            <input type="hidden" name="businessId" value={data.business.id} />
            <input type="hidden" name="redirectTo" value={`/super-admin/${data.business.id}`} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İşletme Durumu</span>
                <select className="field" name="status" defaultValue={data.business.status}>
                  {Object.values(BusinessStatus).map((status) => (
                    <option key={status} value={status}>
                      {businessStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Plan</span>
                <select className="field" name="plan" defaultValue={data.business.subscriptionPlan}>
                  {Object.values(SubscriptionPlan).map((plan) => (
                    <option key={plan} value={plan}>
                      {subscriptionPlanLabels[plan]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Abonelik Durumu</span>
                <select className="field" name="subscriptionStatus" defaultValue={data.business.subscriptionStatus}>
                  {Object.values(SubscriptionStatus).map((status) => (
                    <option key={status} value={status}>
                      {subscriptionStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Trial Uzatma</span>
                <input className="field" type="number" min={0} max={90} name="trialDays" placeholder="gün" />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">İç Not</span>
              <textarea className="field min-h-24" name="internalNotes" defaultValue={data.business.internalNotes ?? ""} />
            </label>
            <button className="btn-primary w-full" type="submit">
              İşletme Ayarlarını Güncelle
            </button>
          </form>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <form action={cancelBusinessSubscriptionAction}>
              <input type="hidden" name="businessId" value={data.business.id} />
              <input type="hidden" name="redirectTo" value={`/super-admin/${data.business.id}`} />
              <button className="btn-secondary w-full" type="submit">
                Aboneliği İptal Et
              </button>
            </form>
            <form action={impersonateBusinessAdminAction}>
              <input type="hidden" name="businessId" value={data.business.id} />
              <input type="hidden" name="redirectTo" value="/dashboard" />
              <button className="btn-secondary w-full" type="submit">
                Güvenli İmpersonation
              </button>
            </form>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <div className="section-title">Son 10 Rezervasyon</div>
          <div className="mt-5 space-y-3">
            {data.lastReservations.map((reservation) => (
              <div key={reservation.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{reservation.guestName}</div>
                    <div className="mt-1 text-sm text-sage">
                      {formatDateTime(reservation.startAt)} • {reservation.guestCount} kişi • {reservation.assignedTable?.number ?? "Masa yok"}
                    </div>
                  </div>
                  <StatusBadge value={reservation.status} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Son Giriş Aktivitesi</div>
          <div className="mt-5 space-y-3">
            {data.recentLogins.map((log) => (
              <div key={log.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{log.action}</div>
                    <div className="mt-1 text-sm text-sage">{log.message}</div>
                  </div>
                  <div className="text-sm text-sage">{formatDateTime(log.createdAt)}</div>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em] text-sage">
                  {log.ipAddress ?? "IP yok"}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <div className="section-title">Ödeme Görünürlüğü</div>
          <div className="mt-5 space-y-3">
            {data.business.billingPayments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-white/80 p-5 text-sm text-sage">
                Henüz ödeme kaydı yok.
              </div>
            ) : (
              data.business.billingPayments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink">{subscriptionPlanLabels[payment.plan]}</div>
                      <div className="mt-1 text-sm text-sage">{formatDateTime(payment.createdAt)}</div>
                    </div>
                    <div className="text-sm font-semibold text-ink">{billingPaymentStatusLabels[payment.status]}</div>
                  </div>
                  <div className="mt-2 text-sm text-sage">{payment.merchantOid}</div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Riskli İşlemler</div>
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/80 p-5">
            <div className="text-sm font-semibold text-rose-700">İşletme verisini sıfırla</div>
            <p className="mt-2 text-sm leading-6 text-rose-700">
              Bu işlem rezervasyon, müşteri, masa, çağrı ve pending request verilerini temizler. Onay için işletme adını veya slug değerini yazın.
            </p>
            <form action={resetBusinessDataAction} className="mt-4 space-y-3">
              <input type="hidden" name="businessId" value={data.business.id} />
              <input type="hidden" name="redirectTo" value={`/super-admin/${data.business.id}`} />
              <input className="field" name="confirmation" placeholder={data.business.slug} required />
              <button className="btn-danger w-full" type="submit">
                İşletme Verisini Sıfırla
              </button>
            </form>
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="section-title">İşletme Erişimi</div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.business.users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="font-semibold text-ink">{user.name}</div>
              <div className="mt-1 text-sm text-sage">{user.email}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-sage">{userRoleLabels[user.role]}</div>
              <div className="mt-2 text-sm text-sage">Son giriş: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Yok"}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
