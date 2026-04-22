import Link from "next/link";
import { ReservationStatus } from "@prisma/client";
import { updateReservationStatusAction } from "@/actions/reservation-actions";
import { AppHeader } from "@/components/layout/app-header";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireBusinessUser } from "@/lib/auth";
import { getReservationsPageData } from "@/lib/data";
import { formatDateTime, formatPhone } from "@/lib/utils";

export default async function ReservationsPage({
  searchParams
}: {
  searchParams: { reservationId?: string };
}) {
  const session = await requireBusinessUser();
  const data = await getReservationsPageData(session.user.businessId, searchParams.reservationId);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Rezervasyon Yönetimi"
        subtitle="Rezervasyonları oluşturun, güncelleyin, onaylayın ve servis akışını kontrol altında tutun."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Yaklaşan ve Geçmiş Kayıtlar</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Rezervasyon listesi</h2>
            </div>
            <Link href="/reservations" className="btn-secondary">
              Yeni Form
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {data.reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-lg font-semibold text-ink">{reservation.customer.name}</div>
                      <StatusBadge value={reservation.status} />
                    </div>
                    <div className="mt-2 text-sm text-sage">
                      {formatDateTime(reservation.startAt)} • {reservation.guestCount} kişi • {reservation.assignedTable?.number ?? "Masa bekliyor"}
                    </div>
                    <div className="mt-1 text-sm text-sage">{formatPhone(reservation.customer.phone)}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/reservations?reservationId=${reservation.id}`} className="btn-secondary">
                      Düzenle
                    </Link>

                    {reservation.status !== ReservationStatus.CONFIRMED ? (
                      <form action={updateReservationStatusAction}>
                        <input type="hidden" name="id" value={reservation.id} />
                        <input type="hidden" name="status" value={ReservationStatus.CONFIRMED} />
                        <input type="hidden" name="redirectTo" value="/reservations" />
                        <button className="btn-primary" type="submit">
                          Onayla
                        </button>
                      </form>
                    ) : null}

                    {reservation.status !== ReservationStatus.CANCELLED ? (
                      <form action={updateReservationStatusAction}>
                        <input type="hidden" name="id" value={reservation.id} />
                        <input type="hidden" name="status" value={ReservationStatus.CANCELLED} />
                        <input type="hidden" name="redirectTo" value="/reservations" />
                        <button className="btn-danger" type="submit">
                          İptal Et
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">{data.selectedReservation ? "Rezervasyon Düzenle" : "Yeni Rezervasyon"}</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            {data.selectedReservation ? "Detayları güncelleyin" : "Yeni kayıt oluşturun"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Sunucu tarafında doğrulanan form akışıyla müşteri, masa ve durum bilgisini aynı anda yönetin.
          </p>
          <div className="mt-6">
            <ReservationForm
              tables={data.tables}
              reservation={data.selectedReservation
                ? {
                    id: data.selectedReservation.id,
                    customer: data.selectedReservation.customer,
                    startAt: data.selectedReservation.startAt,
                    guestCount: data.selectedReservation.guestCount,
                    status: data.selectedReservation.status,
                    source: data.selectedReservation.source,
                    assignedTableId: data.selectedReservation.assignedTableId,
                    occasion: data.selectedReservation.occasion,
                    notes: data.selectedReservation.notes
                  }
                : null}
            />
          </div>
        </Panel>
      </section>
    </div>
  );
}
