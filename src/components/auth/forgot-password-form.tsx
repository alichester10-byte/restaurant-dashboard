"use client";

import { useState, useTransition } from "react";
import { AuthToast } from "@/components/auth/auth-toast";
import { FormMessage } from "@/components/ui/form-message";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {toastVisible ? (
        <AuthToast
          tone="success"
          title="Sıfırlama bağlantısı gönderildi"
          description="Hesap mevcutsa, birkaç dakika içinde e-posta kutunuza şifre sıfırlama bağlantısı düşer."
        />
      ) : null}
      <form
        className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setToastVisible(false);
        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            const response = await fetch("/api/auth/forgot-password", {
              method: "POST",
              body: formData
            });
            const payload = (await response.json()) as { ok: boolean; error?: string };

            if (!response.ok || !payload.ok) {
              setError(payload.error ?? "İstek gönderilemedi.");
              return;
            }

            form.reset();
            setToastVisible(true);
          });
        }}
      >
        <FormMessage message={error} />
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">E-posta</span>
          <input className="field" name="email" type="email" placeholder="admin@restoran.com" required disabled={isPending} />
        </label>
        <button className="btn-primary w-full gap-2 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isPending}>
          {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
          {isPending ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
        </button>
      </form>
    </>
  );
}
