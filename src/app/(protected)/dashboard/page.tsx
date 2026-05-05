import { CallOutcome } from "@prisma/client";
import Link from "next/link";
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
import { formatDateTime, formatPhone, formatTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireBusinessUser();
  const data = await getDashboardDataForBusiness(session.user.businessId);
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Operasyon Paneli"
        subtitle="Günlük rezervasyon, masa kullanımı ve çağrı performansını tek ekranda izleyin."
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      {entitlement.isDemo ? (
        <DemoModeBanner
          title="Demo modunda tüm operasyon görünürlüğü açık."
          description="Paneli canlı bir servis akışı gibi gezebilirsiniz. Yeni çağrı ekleme, rezervasyon güncelleme ve ayar kaydetme işlemleri Pro planıyla açılır."
          href="/billing?upgrade=dashboard"
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Günlük Rezervasyon" value={data.stats.dailyReservations} trend={data.stats.trends.dailyReservations} tone="accent" />
        <StatCard label="Toplam Misafir" value={data.stats.totalGuests} trend={data.stats.trends.totalGuests} />
        <StatCard label="Doluluk Oranı" value={data.stats.occupancyRate} />
        <StatCard label="Yanıtlanan Çağrı" value={data.stats.answeredCalls} trend={data.stats.trends.answeredCalls} />
        <StatCard label="Cevapsız Çağrı" value={data.stats.missedCalls} trend={data.stats.trends.missedCalls} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Rezervasyon Trendi</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Son 7 gün rezervasyon akışı</h2>
            </div>
            <div className="rounded-full bg-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-moss">
              Haftalık görünüm
            </div>
          </div>
          <div className="mt-6">
            <MiniBarChart items={data.charts.reservationsByDay} />
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Doluluk Özeti</div>
          <div className="mt-4">
            <RingChart value={data.stats.occupancyRate} label={`${data.stats.totalGuests} misafir / ${data.settings.seatingCapacity} kapasite`} />
          </div>
          <div className="mt-6 grid gap-3">
            {data.charts.reservationsBySource.map((item) => (
              <div key={item.source} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
                <div className="text-sm font-semibold text-ink">{reservationSourceLabels[item.source]}</div>
                <div className="text-sm text-sage">{item._count._all} rezervasyon</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-title">AI Asistan</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Panel içinden canlı test edin</h2>
              <p className="mt-2 text-sm leading-6 text-sage">
                AI asistan müşteri gibi konuşur, eksik rezervasyon bilgilerini toplar ve onay için Kanal Talepleri akışına bırakır.
              </p>
            </div>
            <div className="rounded-full bg-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-moss">
              {data.aiAssistant.pendingCount} bekleyen AI talebi
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="text-sm font-semibold text-ink">AI operasyon özeti</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.22em] text-moss">Toplam Talep</div>
                    <div className="mt-2 text-3xl font-semibold text-ink">{data.aiAssistant.totalCount}</div>
                  </div>
                  <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.22em] text-moss">Onay Bekliyor</div>
                    <div className="mt-2 text-3xl font-semibold text-ink">{data.aiAssistant.pendingCount}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm leading-6 text-sage">
                  Public chatbot ve kanal akışlarından gelen AI talepleri burada tek mantıkla çalışır. Hiçbiri restoran onayı olmadan rezervasyona dönüşmez.
                </div>
                <Link
                  href="/reservations#channel-requests"
                  className="mt-5 inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
                >
                  Kanal Taleplerini Aç
                </Link>
              </div>

              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="text-sm font-semibold text-ink">Son AI Talepleri</div>
                <div className="mt-4 space-y-3">
                  {data.aiAssistant.latestRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--bg-strong)] px-4 py-4 text-sm leading-6 text-sage">
                      Henüz AI kaynaklı talep yok. Bu paneldeki test alanı veya public rezervasyon sayfasındaki asistan ilk talepleri oluşturabilir.
                    </div>
                  ) : (
                    data.aiAssistant.latestRequests.map((request) => (
                      <div key={request.id} className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-ink">{request.guestName || "İsim bekleniyor"}</div>
                          <div className="badge bg-white text-ink">{request.status}</div>
                        </div>
                        <div className="mt-2 text-sm text-sage">
                          {request.requestedDate ?? "Tarih bekleniyor"} • {request.requestedTime ?? "Saat bekleniyor"} • {request.guestCount ?? "-"} kişi
                        </div>
                        <div className="mt-1 text-sm text-sage">{request.guestPhone ?? "Telefon bekleniyor"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <RestaurantChatWidget
              restaurantId={session.user.businessId}
              restaurantName={data.settings.restaurantName}
              assistantEnabled={data.aiAssistant.enabled}
              welcomeMessage={data.aiAssistant.welcomeMessage}
              mode="inline"
            />
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Yaklaşan Rezervasyonlar</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Onaylanmış ve yaklaşan servis akışı</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {data.upcomingReservations.map((reservation) => (
              <div key={reservation.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{reservation.guestName}</div>
                    <div className="mt-1 text-sm text-sage">
                      {formatDateTime(reservation.startAt)} • {reservation.guestCount} kişi
                    </div>
                  </div>
                  <StatusBadge value={reservation.status} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-sage">
                  <span>{reservation.assignedTable ? reservation.assignedTable.number : "Masa ataması bekliyor"}</span>
                  <span>{reservation.guestPhone}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Masa Planı</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Canlı salon durumu</h2>
            </div>
            <div className="text-sm text-sage">{data.tables.length} masa</div>
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
                <div className="mt-6 flex items-end justify-between">
                  <div className="font-[family-name:var(--font-display)] text-3xl text-ink">{table.seatCapacity}</div>
                  <div className="text-sm text-sage">kişilik</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Son Çağrılar</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Çağrı performansı ve etiketleme</h2>
            </div>
          </div>
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
                <div className="mt-3 text-sm text-sage">
                  {call.notes ?? (call.outcome === CallOutcome.MISSED ? "Operasyon yoğunluğu nedeniyle cevap verilemedi." : callOutcomeLabels[call.outcome])}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Çağrı Kaydı</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Yeni çağrı oluştur</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Dashboard üzerinden yeni çağrıları işaretleyin ve rezervasyon potansiyelini kaybetmeden ekibe aktarın.
          </p>
          <div className="mt-6">
            <CallForm locked={entitlement.isDemo} />
          </div>
        </Panel>
      </section>
    </div>
  );
}
