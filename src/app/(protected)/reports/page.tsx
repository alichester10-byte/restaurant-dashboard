import { AppHeader } from "@/components/layout/app-header";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { Panel } from "@/components/ui/panel";
import { requireBusinessUser } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { reservationSourceLabels, callOutcomeLabels } from "@/lib/constants";
import { getReportsPageData } from "@/lib/data";
import { formatPercent } from "@/lib/utils";

function getSourceLabel(source: string) {
  if (source === "MANUAL") {
    return "Manual";
  }

  return reservationSourceLabels[source as keyof typeof reservationSourceLabels];
}

export default async function ReportsPage() {
  const session = await requireBusinessUser();
  const data = await getReportsPageData(session.user.businessId);
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Raporlar"
        subtitle="Rezervasyon kaynakları, çağrı etkisi ve kapasite kullanımını operasyonel metriklerle analiz edin."
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="section-title">Özet</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Temel performans sinyalleri</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Bugünkü rezervasyon", value: data.summaryCards.todayReservations },
              { label: "No-show oranı", value: formatPercent(data.summaryCards.noShowRate) },
              { label: "İptal oranı", value: formatPercent(data.summaryCards.cancellationRate) },
              { label: "Tamamlanan oran", value: formatPercent(data.summaryCards.completedRate) },
              { label: "Geri dönen müşteri", value: data.summaryCards.returningCustomers },
              { label: "VIP müşteri", value: data.summaryCards.vipCustomers }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="text-sm text-sage">{item.label}</div>
                <div className="mt-2 text-3xl font-semibold text-ink">{item.value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">14 Günlük Rezervasyon</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Rezervasyon ve misafir hacmi</h2>
          <div className="mt-6">
            <MiniBarChart items={data.reservationsByDay.map((item) => ({ label: item.label, total: item.reservations }))} color="bg-gold" />
          </div>
        </Panel>

      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="section-title">Haftalık Trend</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Son 7 gün</h2>
          <div className="mt-6">
            <MiniBarChart items={data.weeklyTrend} color="bg-emerald-600" />
          </div>
          <div className="mt-8 border-t border-[color:var(--border)] pt-6">
            <div className="section-title">Aylık Trend</div>
            <div className="mt-4">
              <MiniBarChart items={data.monthlyTrend} color="bg-amber-500" />
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Rezervasyon Kaynakları</div>
          <div className="mt-5 space-y-3">
            {data.sourceCounts.map((item) => (
              <div key={item.source} className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3">
                <div className="font-semibold text-ink">{getSourceLabel(item.source)}</div>
                <div className="text-sm text-sage">{item.total} kayıt</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Doluluk ve Masa Kullanımı</div>
          <div className="mt-4 grid gap-4">
            <div className="rounded-[24px] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] p-5 text-white">
              <div className="text-sm text-white/70">Ortalama doluluk</div>
              <div className="mt-2 text-4xl font-bold">{formatPercent(data.occupancySummary.average)}</div>
              <div className="mt-3 text-sm text-white/75">Masa kullanım özeti: {formatPercent(data.occupancySummary.utilization)}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/90 p-4">
                <div className="text-sm text-sage">Pik Doluluk</div>
                <div className="mt-2 text-3xl font-bold text-ink">{formatPercent(data.occupancySummary.peak)}</div>
              </div>
              <div className="rounded-2xl bg-white/90 p-4">
                <div className="text-sm text-sage">Toplam Misafir</div>
                <div className="mt-2 text-3xl font-bold text-ink">{data.occupancySummary.totalGuests}</div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Çağrı Analitiği</div>
          <div className="mt-5 space-y-3">
            {data.callCounts.map((item) => (
              <div key={item.outcome} className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3">
                <div className="font-semibold text-ink">{callOutcomeLabels[item.outcome as keyof typeof callOutcomeLabels]}</div>
                <div className="text-sm text-sage">{item.total} çağrı</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">En Popüler Saatler</div>
          <div className="mt-5 space-y-3">
            {data.popularHours.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3">
                <div className="font-semibold text-ink">{item.label}</div>
                <div className="text-sm text-sage">{item.total} rezervasyon</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
