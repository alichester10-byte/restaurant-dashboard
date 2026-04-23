import Link from "next/link";
import { ReservationSource, ReservationStatus } from "@prisma/client";
import { saveReservationAction } from "@/actions/reservation-actions";
import { LockedAction } from "@/components/demo/locked-action";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { reservationSourceLabels, reservationStatusLabels } from "@/lib/constants";
import { createTimeSlots, formatDateTime } from "@/lib/utils";

type ReservationFormProps = {
  tables: Array<{ id: string; label: string; number: string }>;
  reservation?: {
    id: string;
    guestName: string;
    guestPhone: string;
    startAt: Date;
    guestCount: number;
    status: ReservationStatus;
    source: ReservationSource;
    assignedTableId: string | null;
    occasion: string | null;
    notes: string | null;
  } | null;
  locked?: boolean;
};

export function ReservationForm({ tables, reservation, locked = false }: ReservationFormProps) {
  const date = reservation ? reservation.startAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const time = reservation
    ? reservation.startAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "19:30";
  const selectedTableLabel = reservation?.assignedTableId
    ? tables.find((table) => table.id === reservation.assignedTableId)?.number ?? "Atanmış masa"
    : "Henüz masa ataması yok";

  if (locked) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Misafir Adı</span>
            <input className="field cursor-not-allowed opacity-70" defaultValue={reservation?.guestName ?? "Elif Kaya"} disabled />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Telefon</span>
            <input className="field cursor-not-allowed opacity-70" defaultValue={reservation?.guestPhone ?? "+90 555 820 14 00"} disabled />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Tarih</span>
            <input className="field cursor-not-allowed opacity-70" type="date" defaultValue={date} disabled />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Saat</span>
            <input className="field cursor-not-allowed opacity-70" defaultValue={time} disabled />
          </label>
        </div>

        <LockedAction
          fullWidth
          href="/billing?upgrade=reservations"
          title={reservation ? "Rezervasyon düzenleme Pro ile açılır" : "Yeni rezervasyon oluşturma Pro ile açılır"}
          description="Demo modunda tüm rezervasyon akışını inceleyebilirsiniz. Oluşturma, güncelleme ve iptal işlemleri için Pro planına geçin."
        />
      </div>
    );
  }

  return (
    <form action={saveReservationAction} className="space-y-4">
      <input type="hidden" name="id" defaultValue={reservation?.id} />
      <input type="hidden" name="redirectTo" value={reservation ? `/reservations?reservationId=${reservation.id}` : "/reservations"} />
      <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sage">
              {reservation ? "Seçili Rezervasyon" : "Yeni Rezervasyon"}
            </div>
            <h3 className="mt-2 text-xl font-semibold text-ink">
              {reservation ? `${reservation.guestName} için rezervasyonu düzenleyin` : "Yeni rezervasyon detaylarını hazırlayın"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-sage">
              {reservation
                ? `${formatDateTime(reservation.startAt)} • ${reservation.guestCount} kişi • ${selectedTableLabel}`
                : "Misafir bilgilerini, servis zamanını ve masa atamasını tek ekranda düzenleyin."}
            </p>
          </div>
          {reservation ? (
            <Link href="/reservations" className="btn-secondary">
              Düzenlemeyi Kapat
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Misafir Adı</span>
          <input className="field" name="customerName" defaultValue={reservation?.guestName} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Telefon</span>
          <input className="field" name="phone" defaultValue={reservation?.guestPhone} required />
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
        <span className="text-sm font-semibold text-ink">Özel İstekler</span>
        <textarea
          className="field min-h-24"
          name="occasion"
          defaultValue={reservation?.occasion ?? ""}
          placeholder="Doğum günü düzeni, pencere kenarı tercihi, çocuk sandalyesi, sessiz masa..."
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Operasyon Notları</span>
        <textarea
          className="field min-h-28"
          name="notes"
          defaultValue={reservation?.notes ?? ""}
          placeholder="Ekibin bilmesi gereken servis notları, karşılama detayları ve teyit bilgileri..."
        />
      </label>

      <FormSubmitButton
        className="w-full"
        idleLabel={reservation ? "Rezervasyonu Güncelle" : "Rezervasyonu Oluştur"}
        pendingLabel={reservation ? "Rezervasyon Güncelleniyor..." : "Rezervasyon Oluşturuluyor..."}
      />
    </form>
  );
}
