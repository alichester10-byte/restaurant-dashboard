import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireBusinessUser } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { getCustomersPageData } from "@/lib/data";
import { formatDateTime, formatPhone } from "@/lib/utils";

export default async function CustomersPage({
  searchParams
}: {
  searchParams: { customerId?: string };
}) {
  const session = await requireBusinessUser();
  const data = await getCustomersPageData(session.user.businessId, searchParams.customerId);
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Müşteriler"
        subtitle="VIP, düzenli ve yeni misafirleri davranış geçmişiyle birlikte takip edin."
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      {entitlement.isDemo ? (
        <DemoModeBanner
          title="Müşteri hafızası demo modunda tamamen görünür."
          description="Geçmiş rezervasyonları, notları ve segmentleri keşfedebilirsiniz. Müşteri notlarını ve segment güncellemelerini açmak için Pro planını etkinleştirin."
          href="/billing?upgrade=customers"
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="section-title">Müşteri Listesi</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Segmentler ve rezervasyon geçmişi</h2>
          <div className="mt-6 space-y-3">
            {data.customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers?customerId=${customer.id}`}
                className="block rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4 transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{customer.name}</div>
                    <div className="mt-1 text-sm text-sage">{formatPhone(customer.phone)}</div>
                  </div>
                  <StatusBadge value={customer.tag} />
                </div>
                <div className="mt-3 text-sm text-sage">{customer.reservations.length} son rezervasyon kaydı</div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          {data.selectedCustomer ? (
            <>
              <div className="section-title">Müşteri Kartı</div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-ink">{data.selectedCustomer.name}</h2>
                <StatusBadge value={data.selectedCustomer.tag} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white/80 p-4">
                  <div className="text-sm text-sage">Telefon</div>
                  <div className="mt-2 font-semibold text-ink">{formatPhone(data.selectedCustomer.phone)}</div>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <div className="text-sm text-sage">Toplam Rezervasyon</div>
                  <div className="mt-2 font-semibold text-ink">{data.selectedCustomer.reservations.length}</div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
                <div className="text-sm font-semibold text-ink">Operasyon Notları</div>
                <p className="mt-3 text-sm leading-7 text-sage">{data.selectedCustomer.notes ?? "Henüz not eklenmemiş."}</p>
              </div>

              <div className="mt-8">
                <div className="text-sm font-semibold text-ink">Rezervasyon Geçmişi</div>
                <div className="mt-3 space-y-3">
                  {data.selectedCustomer.reservations.map((reservation) => (
                    <div key={reservation.id} className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-ink">{formatDateTime(reservation.startAt)}</div>
                          <div className="mt-1 text-sm text-sage">
                            {reservation.guestCount} kişi • {reservation.assignedTable?.number ?? "Masa yok"}
                          </div>
                        </div>
                        <StatusBadge value={reservation.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="text-sm font-semibold text-ink">Son Çağrılar</div>
                <div className="mt-3 space-y-3">
                  {data.selectedCustomer.callLogs.map((call) => (
                    <div key={call.id} className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-ink">{formatDateTime(call.startedAt)}</div>
                          <div className="mt-1 text-sm text-sage">{call.notes ?? "Çağrı notu girilmedi."}</div>
                        </div>
                        <StatusBadge value={call.outcome} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="section-title">Detay Paneli</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Bir müşteri seçin</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-sage">
                Detay görünümünde rezervasyon geçmişi, segment etiketi ve son çağrı notlarını birlikte inceleyebilirsiniz.
              </p>
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
