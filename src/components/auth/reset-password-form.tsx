"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/ui/form-message";

export function ResetPasswordForm({ token }: { token: string }) {
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
        formData.set("token", token);

        startTransition(async () => {
          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            body: formData
          });
          const payload = (await response.json()) as { ok: boolean; error?: string; redirectTo?: string };

          if (!response.ok || !payload.ok || !payload.redirectTo) {
            setError(payload.error ?? "Şifre güncellenemedi.");
            return;
          }

          router.push(payload.redirectTo as Route);
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="token" value={token} />
      <FormMessage message={error} />
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Yeni Şifre</span>
        <input className="field" name="password" type="password" placeholder="Min. 8 karakter, harf ve rakam" required disabled={isPending} />
      </label>
      <button className="btn-primary w-full gap-2 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isPending}>
        {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
        {isPending ? "Kaydediliyor..." : "Şifreyi Güncelle"}
      </button>
    </form>
  );
}
