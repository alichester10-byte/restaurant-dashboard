import { AppHeader } from "@/components/layout/app-header";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { Panel } from "@/components/ui/panel";
import { reservationSourceLabels, callOutcomeLabels } from "@/lib/constants";
import { getReportsPageData } from "@/lib/data";
import { formatPercent } from "@/lib/utils";

export default async function ReportsPage() {
  const data = await getReportsPageData();

  return (
    <div className="space-y-6">
      <AppHeader title="Raporlar" subtitle="Rezervasyon kaynakları, çağrı etkisi ve kapasite kullanımını operasyonel metriklerle analiz edin." />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="section-title">14 Günlük Rezervasyon</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Rezervasyon ve misafir hacmi</h2>
          <div className="mt-6">
            <MiniBarChart items={data.reservationsByDay.map((item) => ({ label: item.label, total: item.reservations }))} color="bg-gold" />
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Doluluk Özeti</div>
          <div className="mt-4 grid gap-4">
            <div className="rounded-[24px] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] p-5 text-white">
              <div className="text-sm text-white/70">Ortalama Doluluk</div>
              <div className="mt-2 text-4xl font-bold">{formatPercent(data.occupancySummary.average)}</div>
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
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <div className="section-title">Rezervasyon Kaynakları</div>
          <div className="mt-5 space-y-3">
            {data.sourceCounts.map((item) => (
              <div key={item.source} className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3">
                <div className="font-semibold text-ink">{reservationSourceLabels[item.source as keyof typeof reservationSourceLabels]}</div>
                <div className="text-sm text-sage">{item.total} kayıt</div>
              </div>
            ))}
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
      </section>
    </div>
  );
}
