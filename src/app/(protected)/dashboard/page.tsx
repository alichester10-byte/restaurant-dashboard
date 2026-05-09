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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="overflow-hidden">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                  {session.user.business.name}
                </span>
                <span className="rounded-full border border-[color:var(--border)] bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sage">
                  Günlük özet
                </span>
              </div>
              <div>
                <h2 className="text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">Bugünkü operasyonu tek bakışta yönetin</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-sage">
                  {industry.requestLabelPlural}, kanal akışları, kaynak kullanımı ve ekip yoğunluğu aynı ekranda daha sakin bir operasyon görünümüyle sunulur.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { href: "/reservations?compose=1", label: "Yeni Talep", icon: "＋", primary: true },
                  { href: "/reservations", label: `${industry.reservationLabelPlural}ı Gör`, icon: "↗" },
                  { href: "/integrations", label: "Kanalları Yönet", icon: "◎" },
                  { href: "#restaurant-chat-widget", label: "AI Asistan", icon: "✦" }
                ].map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className={action.primary ? "btn-primary h-12 w-full gap-2" : "btn-secondary h-12 w-full gap-2"}
                  >
                    <span className="text-sm">{action.icon}</span>
                    <span>{action.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[26px] border border-[color:var(--border)] bg-[linear-gradient(145deg,#163329_0%,#214c3d_65%,#2f6b54_100%)] p-5 text-white shadow-soft">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">{entitlement.modeLabel}</div>
                <div className="mt-2 text-xl font-semibold">Çalışma modu</div>
                <p className="mt-2 text-sm leading-6 text-white/78">{entitlement.modeDescription}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/60">AI Talepleri</div>
                    <div className="mt-2 text-2xl font-semibold">{data.aiAssistant.pendingCount}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/60">Yaklaşan</div>
                    <div className="mt-2 text-2xl font-semibold">{data.upcomingReservations.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[color:var(--border)] bg-white/92 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Kısa odak</div>
                <div className="mt-2 text-lg font-semibold text-ink">Önce hangi alanlara bakmalısınız?</div>
                <div className="mt-4 space-y-2">
                  {[
                    `${data.upcomingReservations.length} yaklaşan kayıt`,
                    `${data.callsToday.length} çağrı hareketi`,
                    `${data.tables.length} aktif ${industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")}`
                  ].map((item) => (
                    <div key={item} className="rounded-2xl bg-[color:var(--bg-strong)] px-3 py-2.5 text-sm text-sage">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
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

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Yaklaşan {industry.reservationLabelPlural}</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Onaylı ve yaklaşan kayıtlar</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {data.upcomingReservations.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/80 p-8 text-center">
                <div className="text-lg font-semibold text-ink">Bugün için yaklaşan kayıt görünmüyor</div>
                <p className="mt-3 text-sm leading-6 text-sage">
                  Yeni bir talep oluşturabilir veya kanal akışından gelen kayıtları burada takip edebilirsiniz.
                </p>
                <a href="/reservations?compose=1" className="btn-primary mt-5">
                  Yeni Talep Oluştur
                </a>
              </div>
            ) : data.upcomingReservations.map((reservation) => (
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
            {data.callsToday.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/80 p-8 text-center">
                <div className="text-lg font-semibold text-ink">Henüz çağrı hareketi yok</div>
                <p className="mt-3 text-sm leading-6 text-sage">
                  Gün içindeki arama notları ve geri dönüş kayıtları burada görünür.
                </p>
              </div>
            ) : data.callsToday.map((call) => (
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

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">{industry.primaryResourceLabelPlural}</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Kaynak durumu</h2>
            </div>
            <div className="text-sm text-sage">{data.tables.length} {industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")}</div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.tables.length === 0 ? (
              <div className="col-span-full rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/80 p-8 text-center">
                <div className="text-lg font-semibold text-ink">Henüz kaynak planı oluşturulmadı</div>
                <p className="mt-3 text-sm leading-6 text-sage">
                  Kaynaklar eklendiğinde atama ve kapasite görünümü bu alanda çalışmaya başlar.
                </p>
                <a href="/tables?create=1" className="btn-primary mt-5">
                  Kaynak Ekle
                </a>
              </div>
            ) : data.tables.map((table) => (
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
