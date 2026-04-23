"use client";

import { useRouter } from "next/navigation";
import { UpgradeButton } from "@/components/demo/upgrade-button";

export function ReservationPrimaryCta({ locked }: { locked: boolean }) {
  const router = useRouter();

  if (locked) {
    return (
      <UpgradeButton
        href="/billing?upgrade=reservations"
        label="Yeni Rezervasyon Yap"
        title="Yeni rezervasyon oluşturmak için Pro gerekir"
        description="Demo modunda rezervasyon akışını inceleyebilirsiniz. Yeni kayıt eklemek için Pro planına geçin."
      />
    );
  }

  return (
    <button
      className="btn-secondary"
      type="button"
      onClick={() => {
        router.push("/reservations?compose=1#reservation-form-panel");
      }}
    >
      Yeni Rezervasyon Yap
    </button>
  );
}
