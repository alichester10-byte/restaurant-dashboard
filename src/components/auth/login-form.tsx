"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/ui/form-message";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            body: formData
          });

          const payload = (await response.json()) as { ok: boolean; error?: string; redirectTo?: string };

          if (!response.ok || !payload.ok || !payload.redirectTo) {
            setError(payload.error ?? "Giriş başarısız.");
            return;
          }

          router.replace(payload.redirectTo as Route);
          router.refresh();
        });
      }}
    >
      <FormMessage message={error} />
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">E-posta</span>
        <input className="field" name="email" type="email" placeholder="admin@limonmasa.com" required disabled={isPending} />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Şifre</span>
        <input className="field" name="password" type="password" placeholder="••••••••" required disabled={isPending} />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Doğrulama Kodu</span>
        <input className="field" name="otpCode" inputMode="numeric" placeholder="Sadece 2FA açıksa gerekli" disabled={isPending} />
      </label>
      <div className="flex items-center justify-between gap-3">
        <Link href="/forgot-password" className="text-sm font-semibold text-moss transition hover:text-ink">
          Şifremi unuttum
        </Link>
      </div>
      <button className="btn-primary w-full gap-2 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isPending}>
        {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
        {isPending ? "Giriş yapılıyor..." : "Panele Giriş Yap"}
      </button>
    </form>
  );
}
