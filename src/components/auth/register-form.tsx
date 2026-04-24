"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/ui/form-message";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            body: formData
          });

          const payload = (await response.json()) as { ok: boolean; error?: string; redirectTo?: string };

          if (!response.ok || !payload.ok || !payload.redirectTo) {
            setError(payload.error ?? "Hesap oluşturulamadı.");
            return;
          }

          router.push(payload.redirectTo as Route);
          router.refresh();
        });
      }}
    >
      <FormMessage message={error} />
      <input type="hidden" name="redirectTo" value="/login" />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">İşletme Adı</span>
          <input className="field" name="businessName" placeholder="Limon Masa Nişantaşı" required disabled={isPending} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Kurucu / İşletme Sahibi</span>
          <input className="field" name="ownerName" placeholder="Ayşe Kaya" required disabled={isPending} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Sahip E-postası</span>
          <input className="field" type="email" name="ownerEmail" placeholder="ayse@restoran.com" required disabled={isPending} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Sahip Telefonu</span>
          <input className="field" name="ownerPhone" placeholder="+90 555 123 45 67" required disabled={isPending} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">İşletme Telefonu</span>
          <input className="field" name="businessPhone" placeholder="+90 212 555 12 12" required disabled={isPending} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Şifre</span>
          <input className="field" type="password" name="adminPassword" placeholder="En az 8 karakter, harf ve rakam" required disabled={isPending} />
        </label>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Adres</span>
        <input className="field" name="businessAddress" placeholder="Valikonagi Caddesi No: 12" required disabled={isPending} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Şehir</span>
          <input className="field" name="city" placeholder="İstanbul" required disabled={isPending} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">İlçe</span>
          <input className="field" name="district" placeholder="Şişli" required disabled={isPending} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Restoran Tipi</span>
          <input className="field" name="restaurantType" placeholder="Modern Türk Mutfağı" required disabled={isPending} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Tahmini Masa Sayısı</span>
          <input className="field" type="number" name="estimatedTableCount" defaultValue={12} required disabled={isPending} />
        </label>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Notlar</span>
        <textarea className="field min-h-24" name="notes" placeholder="Servis tipi, açılış hedefi, özel operasyon notları..." disabled={isPending} />
      </label>
      <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-ink">
        <input type="checkbox" name="createDefaultTables" value="true" defaultChecked disabled={isPending} />
        Varsayılan masa planını oluştur
      </label>
      <button className="btn-primary w-full gap-2 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isPending}>
        {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
        {isPending ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
      </button>
    </form>
  );
}
