import { TableStatus } from "@prisma/client";
import { assignReservationToTableAction, updateTableStatusAction } from "@/actions/reservation-actions";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { tableStatusLabels } from "@/lib/constants";
import { getTablesPageData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

export default async function TablesPage({
  searchParams
}: {
  searchParams: { tableId?: string };
}) {
  const data = await getTablesPageData(searchParams.tableId);

  return (
    <div className="space-y-6">
      <AppHeader title="Masa Planı" subtitle="Salon akışını görsel masa planı üzerinden yönetin ve rezervasyonları doğru kapasiteye atayın." />

      <section className="grid gap-4 md:grid-cols-4">
        <Panel><div className="text-sm text-sage">Boş</div><div className="mt-2 text-3xl font-bold">{data.summary.empty}</div></Panel>
        <Panel><div className="text-sm text-sage">Dolu</div><div className="mt-2 text-3xl font-bold">{data.summary.occupied}</div></Panel>
        <Panel><div className="text-sm text-sage">Rezerve</div><div className="mt-2 text-3xl font-bold">{data.summary.reserved}</div></Panel>
        <Panel><div className="text-sm text-sage">Bakım</div><div className="mt-2 text-3xl font-bold">{data.summary.maintenance}</div></Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="section-title">Salon Yerleşimi</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Canlı masa haritası</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.tables.map((table) => (
              <a
                key={table.id}
                href={`/tables?tableId=${table.id}`}
                className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5 transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-sage">{table.zone}</div>
                    <div className="mt-1 text-xl font-semibold text-ink">{table.number}</div>
                    <div className="mt-1 text-sm text-sage">{table.label}</div>
                  </div>
                  <StatusBadge value={table.status} />
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div className="font-[family-name:var(--font-display)] text-4xl text-ink">{table.seatCapacity}</div>
                  <div className="text-sm text-sage">koltuk</div>
                </div>
              </a>
            ))}
          </div>
        </Panel>

        <Panel>
          {data.selectedTable ? (
            <>
              <div className="section-title">Seçili Masa</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">
                {data.selectedTable.number} • {data.selectedTable.label}
              </h2>
              <div className="mt-4">
                <StatusBadge value={data.selectedTable.status} />
              </div>

              <form action={updateTableStatusAction} className="mt-6 space-y-4">
                <input type="hidden" name="tableId" value={data.selectedTable.id} />
                <input type="hidden" name="redirectTo" value={`/tables?tableId=${data.selectedTable.id}`} />
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Masa Durumu</span>
                  <select className="field" name="status" defaultValue={data.selectedTable.status}>
                    {Object.values(TableStatus).map((status) => (
                    <option key={status} value={status}>
                        {tableStatusLabels[status]}
                    </option>
                  ))}
                </select>
                </label>
                <button className="btn-secondary w-full" type="submit">
                  Durumu Güncelle
                </button>
              </form>

              <div className="mt-8">
                <div className="text-sm font-semibold text-ink">Masa Rezervasyonları</div>
                <div className="mt-3 space-y-3">
                  {data.selectedTable.reservations.map((reservation) => (
                    <div key={reservation.id} className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4">
                      <div className="font-semibold text-ink">{reservation.customer.name}</div>
                      <div className="mt-1 text-sm text-sage">
                        {formatDateTime(reservation.startAt)} • {reservation.guestCount} kişi
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form action={assignReservationToTableAction} className="mt-8 space-y-4">
                <input type="hidden" name="tableId" value={data.selectedTable.id} />
                <input type="hidden" name="redirectTo" value={`/tables?tableId=${data.selectedTable.id}`} />
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Rezervasyon Ata</span>
                  <select className="field" name="reservationId" defaultValue="">
                    <option value="" disabled>
                      Rezervasyon seçin
                    </option>
                    {data.reservations.map((reservation) => (
                      <option key={reservation.id} value={reservation.id}>
                        {reservation.customer.name} • {formatDateTime(reservation.startAt)} • {reservation.guestCount} kişi
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn-primary w-full" type="submit">
                  Rezervasyonu Masaya Ata
                </button>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="section-title">Detay Paneli</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Bir masa seçin</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-sage">
                Sağ panelden masa durumu güncelleyebilir ve bekleyen rezervasyonları uygun kapasiteye eşleyebilirsiniz.
              </p>
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
