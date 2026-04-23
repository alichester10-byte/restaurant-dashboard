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
          <input className="field" name="businessName" placeholder="Mavi Masa" required disabled={isPending} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Slug</span>
          <input className="field" name="slug" placeholder="mavi-masa" required disabled={isPending} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Restoran Adı</span>
          <input className="field" name="restaurantName" placeholder="Mavi Masa" required disabled={isPending} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Telefon</span>
          <input className="field" name="phone" placeholder="+90 555 123 45 67" required disabled={isPending} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Yönetici Adı</span>
          <input className="field" name="adminName" placeholder="Ayşe Operasyon" required disabled={isPending} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Yönetici E-postası</span>
          <input className="field" type="email" name="adminEmail" placeholder="admin@restoran.com" required disabled={isPending} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Şifre</span>
          <input className="field" type="password" name="adminPassword" placeholder="Min. 8 karakter, harf ve rakam" required disabled={isPending} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Toplam Kapasite</span>
          <input className="field" type="number" name="seatingCapacity" defaultValue={80} required disabled={isPending} />
        </label>
      </div>
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
