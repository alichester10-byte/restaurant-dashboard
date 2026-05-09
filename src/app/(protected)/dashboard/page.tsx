import { CallOutcome } from "@prisma/client";
import { RestaurantChatWidget } from "@/components/chat/restaurant-chat-widget";
import { AppHeader } from "@/components/layout/app-header";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { CallForm } from "@/components/dashboard/call-form";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { Panel } from "@/components/ui/panel";
import { RingChart } from "@/components/ui/ring-chart";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireBusinessUser } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { callOutcomeLabels, reservationSourceLabels } from "@/lib/constants";
import { getDashboardDataForBusiness } from "@/lib/data";
import { getIndustryConfig } from "@/lib/industry-config";
import { formatDateTime, formatPhone, formatTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireBusinessUser();
  const data = await getDashboardDataForBusiness(session.user.businessId);
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const industry = getIndustryConfig(session.user.business.businessType);

  return (
    <div className="space-y-6">
      <AppHeader
        title={industry.dashboardTitle}
        subtitle={industry.dashboardSubtitle}
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      {entitlement.isDemo ? (
        <DemoModeBanner
          title="Demo modunda tüm operasyon görünürlüğü açık."
          description="Paneli canlı bir servis akışı gibi gezebilirsiniz. Yeni çağrı ekleme, kayıt güncelleme ve ayar kaydetme işlemleri Pro planıyla açılır."
          href="/billing?upgrade=dashboard"
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="section-title">Bugün</div>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Günün operasyon özeti</h2>
              <p className="mt-2 text-sm leading-6 text-sage">
                Günlük {industry.requestLabel.toLocaleLowerCase("tr-TR")} akışı, kapasite ve kanal görünürlüğü tek bir başlangıç ekranında toplandı.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <a href="/reservations?compose=1" className="btn-primary">
                Yeni Talep
              </a>
              <a href="/reservations" className="btn-secondary">
                Rezervasyonları Gör
              </a>
              <a href="/integrations" className="btn-secondary">
                Kanalları Yönet
              </a>
              <a href="#restaurant-chat-widget" className="btn-secondary">
                AI Asistan
              </a>
            </div>
          </div>
        </Panel>

        <Panel className="bg-[linear-gradient(135deg,#173428_0%,#214c3d_100%)] text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{entitlement.modeLabel}</div>
          <h2 className="mt-2 text-2xl font-semibold">Çalışma modu</h2>
          <p className="mt-2 text-sm leading-6 text-white/78">{entitlement.modeDescription}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/65">Bekleyen AI Talebi</div>
              <div className="mt-2 text-2xl font-semibold">{data.aiAssistant.pendingCount}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/65">Yaklaşan Kayıt</div>
              <div className="mt-2 text-2xl font-semibold">{data.upcomingReservations.length}</div>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Bugünkü ${industry.reservationLabelPlural}`} value={data.stats.dailyReservations} trend={data.stats.trends.dailyReservations} tone="accent" />
        <StatCard label={industry.customerLabel} value={data.stats.totalGuests} trend={data.stats.trends.totalGuests} />
        <StatCard label={industry.capacityLabel} value={data.stats.occupancyRate} />
        <StatCard label="Çağrı Performansı" value={`${data.stats.answeredCalls}/${data.stats.missedCalls}`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">{industry.reservationLabel} Trendi</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Son 7 günlük akış</h2>
            </div>
            <div className="rounded-full bg-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-moss">Haftalık görünüm</div>
          </div>
          <div className="mt-6">
            <MiniBarChart items={data.charts.reservationsByDay} />
          </div>
        </Panel>

        <Panel>
          <div className="section-title">{industry.capacityLabel} Özeti</div>
          <div className="mt-4">
            <RingChart value={data.stats.occupancyRate} label={`${data.stats.totalGuests} ${industry.customerLabel.toLocaleLowerCase("tr-TR")} / ${data.settings.seatingCapacity} kapasite`} />
          </div>
          <div className="mt-6 grid gap-3">
            {data.charts.reservationsBySource.map((item) => (
              <div key={item.source} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
                <div className="text-sm font-semibold text-ink">{reservationSourceLabels[item.source]}</div>
                <div className="text-sm text-sage">{item._count._all} kayıt</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Yaklaşan {industry.reservationLabelPlural}</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Onaylı ve yaklaşan kayıtlar</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {data.upcomingReservations.map((reservation) => (
              <div key={reservation.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-ink">{reservation.guestName}</div>
                    <div className="mt-1 text-sm text-sage">
                      {formatDateTime(reservation.startAt)} • {reservation.guestCount} {industry.guestCountLabel.toLocaleLowerCase("tr-TR")}
                    </div>
                  </div>
                  <StatusBadge value={reservation.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-sage">
                  <span>{reservation.assignedTable ? reservation.assignedTable.number : `${industry.primaryResourceLabel} ataması bekliyor`}</span>
                  <span>{reservation.guestPhone}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Çağrılar</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Son iletişim akışı</h2>
          <div className="mt-5 space-y-3">
            {data.callsToday.map((call) => (
              <div key={call.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-ink">{call.callerName ?? "Bilinmeyen Arayan"}</div>
                    <div className="mt-1 text-sm text-sage">
                      {formatPhone(call.phone)} • {formatTime(call.startedAt)}
                    </div>
                  </div>
                  <StatusBadge value={call.outcome} />
                </div>
                <div className="mt-3 text-sm leading-6 text-sage">
                  {call.notes ?? (call.outcome === CallOutcome.MISSED ? "Operasyon yoğunluğu nedeniyle cevap verilemedi." : callOutcomeLabels[call.outcome])}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">{industry.primaryResourceLabelPlural}</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Kaynak durumu</h2>
            </div>
            <div className="text-sm text-sage">{data.tables.length} {industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")}</div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.tables.map((table) => (
              <div key={table.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-sage">{table.zone}</div>
                    <div className="mt-1 text-lg font-semibold text-ink">{table.number}</div>
                  </div>
                  <StatusBadge value={table.status} />
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div className="text-3xl font-semibold text-ink">{table.seatCapacity}</div>
                  <div className="text-sm text-sage">{industry.guestCountLabel.toLocaleLowerCase("tr-TR")}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Yeni Çağrı / Not</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Operasyona hızlı kayıt ekleyin</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Ekibinize yeni bir çağrı, bilgi talebi veya operasyon notu bırakmak için bu alanı kullanın.
          </p>
          <div className="mt-6">
            <CallForm locked={entitlement.isDemo} />
          </div>
        </Panel>
      </section>

      <RestaurantChatWidget
        restaurantId={session.user.businessId}
        restaurantName={data.settings.restaurantName}
        assistantEnabled={!entitlement.isDemo && data.aiAssistant.enabled}
        welcomeMessage={data.aiAssistant.welcomeMessage}
        mode="operator"
        isDemo={entitlement.isDemo}
        upgradeHref="/billing?upgrade=ai-assistant"
        operatorSummary={{
          pendingCount: data.aiAssistant.pendingCount,
          totalCount: data.aiAssistant.totalCount,
          latestRequestLabel:
            data.aiAssistant.latestRequests[0]
              ? `${data.aiAssistant.latestRequests[0].guestName || "İsim bekleniyor"} • ${
                  data.aiAssistant.latestRequests[0].requestedDate ?? "Tarih bekleniyor"
                }`
              : null
        }}
        quickLinks={[
          { label: "Kanal Talepleri", href: "/reservations#channel-requests" },
          { label: "Rezervasyonlar", href: "/reservations" },
          { label: "Public Sayfa", href: `/r/${session.user.business.slug}` }
        ]}
      />
    </div>
  );
}
