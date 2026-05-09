import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireBusinessUser } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { getCustomersPageData } from "@/lib/data";
import { getIndustryConfig } from "@/lib/industry-config";
import { formatDateTime, formatPhone } from "@/lib/utils";

export default async function CustomersPage({
  searchParams
}: {
  searchParams: { customerId?: string };
}) {
  const session = await requireBusinessUser();
  const data = await getCustomersPageData(session.user.businessId, searchParams.customerId);
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const industry = getIndustryConfig(session.user.business.businessType);
  const totalCustomers = data.customers.length;
  const returningCustomers = data.customers.filter((customer) => customer.reservations.length > 1).length;
  const recentCustomers = data.customers.filter((customer) => customer.reservations.length > 0).length;
  const contactableCustomers = data.customers.filter((customer) => Boolean(customer.phone)).length;

  return (
    <div className="space-y-6">
      <AppHeader
        title={industry.customerLabelPlural}
        subtitle={`VIP, düzenli ve yeni ${industry.customerLabelPlural.toLocaleLowerCase("tr-TR")} davranış geçmişiyle birlikte takip edin.`}
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      {entitlement.isDemo ? (
        <DemoModeBanner
          title={`${industry.customerLabelPlural} görünümü demo modunda tamamen açık.`}
          description={`Geçmiş ${industry.reservationLabelPlural.toLocaleLowerCase("tr-TR")}, notları ve segmentleri keşfedebilirsiniz. ${industry.customerLabel} notlarını ve segment güncellemelerini açmak için Pro planını etkinleştirin.`}
          href="/billing?upgrade=customers"
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: `Toplam ${industry.customerLabel}`, value: totalCustomers, hint: "Kayıtlı iletişim ve talep geçmişi" },
          { label: `Geri Dönen ${industry.customerLabel}`, value: returningCustomers, hint: `Birden fazla ${industry.reservationLabel.toLocaleLowerCase("tr-TR")} oluşturanlar` },
          { label: `Yakın Dönem ${industry.customerLabel}`, value: recentCustomers, hint: "Son taleplerde görünenler" },
          { label: "İletişime Uygun", value: contactableCustomers, hint: "Telefon veya e-posta bilgisi olanlar" }
        ].map((card) => (
          <Panel key={card.label}>
            <div className="text-sm text-sage">{card.label}</div>
            <div className="mt-3 text-3xl font-semibold text-ink">{card.value}</div>
            <div className="mt-2 text-sm text-sage">{card.hint}</div>
          </Panel>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="section-title">{industry.customerLabelPlural}</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Talep ve kayıt geçmişi tek görünümde</h2>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
              {totalCustomers === 0
                ? industry.emptyStates.customers.description
                : `${totalCustomers} ${industry.customerLabel.toLocaleLowerCase("tr-TR")} kartı hazır`}
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {data.customers.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/80 p-8 text-center">
                <div className="text-lg font-semibold text-ink">{industry.emptyStates.customers.title}</div>
                <p className="mt-3 text-sm leading-6 text-sage">
                  {industry.emptyStates.customers.description}
                </p>
              </div>
            ) : data.customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers?customerId=${customer.id}`}
                className="block rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4 transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{customer.name}</div>
                    <div className="mt-1 text-sm text-sage">{customer.phone ? formatPhone(customer.phone) : "İletişim bilgisi eklenmedi"}</div>
                  </div>
                  <StatusBadge value={customer.tag} />
                </div>
                <div className="mt-4 grid gap-3 text-sm text-sage sm:grid-cols-3">
                  <div>{customer.reservations.length} {industry.reservationLabel.toLocaleLowerCase("tr-TR")} kaydı</div>
                  <div>{customer.tag} segmenti</div>
                  <div>{customer.notes ? "Not mevcut" : "Not yok"}</div>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          {data.selectedCustomer ? (
            <>
              <div className="section-title">{industry.customerLabel} Kartı</div>
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
                  <div className="text-sm text-sage">Toplam {industry.reservationLabel}</div>
                  <div className="mt-2 font-semibold text-ink">{data.selectedCustomer.reservations.length}</div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
                <div className="text-sm font-semibold text-ink">Operasyon Notları</div>
                <p className="mt-3 text-sm leading-7 text-sage">{data.selectedCustomer.notes ?? "Henüz not eklenmemiş."}</p>
              </div>

              <div className="mt-8">
                <div className="text-sm font-semibold text-ink">{industry.reservationLabel} Geçmişi</div>
                <div className="mt-3 space-y-3">
                  {data.selectedCustomer.reservations.map((reservation) => (
                    <div key={reservation.id} className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-ink">{reservation.guestName}</div>
                          <div className="mt-1 text-sm text-sage">
                            {formatDateTime(reservation.startAt)} • {reservation.guestCount} {industry.guestCountLabel.toLocaleLowerCase("tr-TR")} • {reservation.assignedTable?.number ?? `${industry.primaryResourceLabel} yok`}
                          </div>
                        </div>
                        <StatusBadge value={reservation.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="text-sm font-semibold text-ink">Son İletişimler</div>
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
              <h2 className="mt-2 text-xl font-semibold text-ink">Bir {industry.customerLabel.toLocaleLowerCase("tr-TR")} seçin</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-sage">
                Detay görünümünde {industry.reservationLabel.toLocaleLowerCase("tr-TR")} geçmişi, segment etiketi ve son çağrı notlarını birlikte inceleyebilirsiniz.
              </p>
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
