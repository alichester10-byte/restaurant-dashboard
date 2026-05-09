"use client";

import { BusinessType } from "@prisma/client";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { industryOptions } from "@/lib/industry-config";

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
      <section className="rounded-[26px] border border-[color:var(--border)] bg-white/82 p-5">
        <div className="section-title">Account Info</div>
        <h2 className="mt-2 text-lg font-semibold text-ink">Yönetici hesabı</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Kurucu / İşletme Sahibi</span>
            <input className="field" name="ownerName" placeholder="Ayşe Kaya" required disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Sahip E-postası</span>
            <input className="field" type="email" name="ownerEmail" placeholder="ayse@isletme.com" required disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Sahip Telefonu</span>
            <input className="field" name="ownerPhone" placeholder="+90 555 123 45 67" required disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Şifre</span>
            <input className="field" type="password" name="adminPassword" placeholder="En az 8 karakter, harf ve rakam" required disabled={isPending} />
          </label>
        </div>
      </section>

      <section className="rounded-[26px] border border-[color:var(--border)] bg-white/82 p-5">
        <div className="section-title">Business Info</div>
        <h2 className="mt-2 text-lg font-semibold text-ink">İşletme bilgileri</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">İşletme Adı</span>
            <input className="field" name="businessName" placeholder="Limon Masa Nişantaşı" required disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">İşletme Telefonu</span>
            <input className="field" name="businessPhone" placeholder="+90 212 555 12 12" required disabled={isPending} />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-3">
            <span className="text-sm font-semibold text-ink">Adres</span>
            <input className="field" name="businessAddress" placeholder="Valikonagi Caddesi No: 12" required disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Şehir</span>
            <input className="field" name="city" placeholder="İstanbul" required disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">İlçe</span>
            <input className="field" name="district" placeholder="Şişli" required disabled={isPending} />
          </label>
        </div>
      </section>

      <section className="rounded-[26px] border border-[color:var(--border)] bg-white/82 p-5">
        <div className="section-title">Industry</div>
        <h2 className="mt-2 text-lg font-semibold text-ink">İşletme yapısı</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">İşletme Türü</span>
            <select className="field" name="businessType" defaultValue={BusinessType.RESTAURANT} required disabled={isPending}>
              {industryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Hizmet Odağı</span>
            <input className="field" name="restaurantType" placeholder="Örn: Modern Türk mutfağı, saç kesimi, diş kontrolü" required disabled={isPending} />
          </label>
        </div>
      </section>

      <section className="rounded-[26px] border border-[color:var(--border)] bg-white/82 p-5">
        <div className="section-title">Capacity</div>
        <h2 className="mt-2 text-lg font-semibold text-ink">Operasyon detayları</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Tahmini Kapasite / Kaynak Sayısı</span>
            <input className="field" type="number" name="estimatedTableCount" defaultValue={12} required disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Notlar</span>
            <textarea className="field min-h-24" name="notes" placeholder="Sunulan hizmetler, çalışma düzeni, özel operasyon notları..." disabled={isPending} />
          </label>
        </div>
      </section>

      <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-ink">
        <input type="checkbox" name="createDefaultTables" value="true" defaultChecked disabled={isPending} />
        Varsayılan kaynak planını oluştur
      </label>
      <button className="btn-primary w-full gap-2 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isPending}>
        {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
        {isPending ? "Hesap oluşturuluyor..." : "Ücretsiz Başla"}
      </button>
    </form>
  );
}
