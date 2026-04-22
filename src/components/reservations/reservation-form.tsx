import { ReservationSource, ReservationStatus } from "@prisma/client";
import { saveReservationAction } from "@/actions/reservation-actions";
import { reservationSourceLabels, reservationStatusLabels } from "@/lib/constants";
import { createTimeSlots } from "@/lib/utils";

type ReservationFormProps = {
  tables: Array<{ id: string; label: string; number: string }>;
  reservation?: {
    id: string;
    customer: { name: string; phone: string };
    startAt: Date;
    guestCount: number;
    status: ReservationStatus;
    source: ReservationSource;
    assignedTableId: string | null;
    occasion: string | null;
    notes: string | null;
  } | null;
};

export function ReservationForm({ tables, reservation }: ReservationFormProps) {
  const date = reservation ? reservation.startAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const time = reservation
    ? reservation.startAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "19:30";

  return (
    <form action={saveReservationAction} className="space-y-4">
      <input type="hidden" name="id" defaultValue={reservation?.id} />
      <input type="hidden" name="redirectTo" value={reservation ? `/reservations?reservationId=${reservation.id}` : "/reservations"} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Misafir Adı</span>
          <input className="field" name="customerName" defaultValue={reservation?.customer.name} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Telefon</span>
          <input className="field" name="phone" defaultValue={reservation?.customer.phone} required />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Tarih</span>
          <input className="field" type="date" name="reservationDate" defaultValue={date} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Saat</span>
          <select className="field" name="reservationTime" defaultValue={time} required>
            {createTimeSlots().map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Kişi Sayısı</span>
          <input className="field" type="number" min={1} max={20} name="guestCount" defaultValue={reservation?.guestCount ?? 2} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Durum</span>
          <select className="field" name="status" defaultValue={reservation?.status ?? ReservationStatus.PENDING}>
            {Object.values(ReservationStatus).map((status) => (
              <option key={status} value={status}>
                {reservationStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Kaynak</span>
          <select className="field" name="source" defaultValue={reservation?.source ?? ReservationSource.PHONE}>
            {Object.values(ReservationSource).map((source) => (
              <option key={source} value={source}>
                {reservationSourceLabels[source]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Masa</span>
          <select className="field" name="tableId" defaultValue={reservation?.assignedTableId ?? ""}>
            <option value="">Henüz atanmadı</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.number} • {table.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Özel Gün</span>
        <input className="field" name="occasion" defaultValue={reservation?.occasion ?? ""} placeholder="Doğum günü, iş yemeği, yıldönümü..." />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Operasyon Notu</span>
        <textarea className="field min-h-28" name="notes" defaultValue={reservation?.notes ?? ""} />
      </label>

      <button className="btn-primary w-full" type="submit">
        {reservation ? "Rezervasyonu Güncelle" : "Rezervasyon Oluştur"}
      </button>
    </form>
  );
}
