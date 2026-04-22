import { CallOutcome } from "@prisma/client";
import { AppHeader } from "@/components/layout/app-header";
import { CallForm } from "@/components/dashboard/call-form";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { Panel } from "@/components/ui/panel";
import { RingChart } from "@/components/ui/ring-chart";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireBusinessUser } from "@/lib/auth";
import { callOutcomeLabels, reservationSourceLabels } from "@/lib/constants";
import { getDashboardDataForBusiness } from "@/lib/data";
import { formatDateTime, formatPhone, formatTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireBusinessUser();
  const data = await getDashboardDataForBusiness(session.user.businessId);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Operasyon Paneli"
        subtitle="Günlük rezervasyon, masa kullanımı ve çağrı performansını tek ekranda izleyin."
        businessName={session.user.business.name}
        role={session.user.role}
      />

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
          <div className="section-title">Yaklaşan Rezervasyonlar</div>
          <div className="mt-5 space-y-3">
            {data.upcomingReservations.map((reservation) => (
              <div key={reservation.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{reservation.customer.name}</div>
                    <div className="mt-1 text-sm text-sage">
                      {formatDateTime(reservation.startAt)} • {reservation.guestCount} kişi
                    </div>
                  </div>
                  <StatusBadge value={reservation.status} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-sage">
                  <span>{reservation.assignedTable ? reservation.assignedTable.number : "Masa ataması bekliyor"}</span>
                  <span>{reservation.customer.phone}</span>
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
            <CallForm />
          </div>
        </Panel>
      </section>
    </div>
  );
}
