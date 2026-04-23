"use client";

import { useRouter } from "next/navigation";

export function ReservationEditLink({ reservationId }: { reservationId: string }) {
  const router = useRouter();

  return (
    <button
      className="btn-secondary"
      type="button"
      onClick={() => {
        router.push(`/reservations?reservationId=${reservationId}#reservation-form-panel`);
      }}
    >
      Rezervasyonu Düzenle
    </button>
  );
}
