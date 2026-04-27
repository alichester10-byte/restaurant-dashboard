"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { FormMessage } from "@/components/ui/form-message";

type LoginPayload = {
  ok: boolean;
  error?: string;
  redirectTo?: string;
  requiresTwoFactor?: boolean;
  challengeMethod?: "email" | "totp";
  challengeToken?: string;
  message?: string;
  code?: string;
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [challengeMethod, setChallengeMethod] = useState<"email" | "totp" | null>(null);
  const [challengeToken, setChallengeToken] = useState("");
  const [isPending, startTransition] = useTransition();
  const debug = searchParams.get("debug") === "1";

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        if (debug) {
          setInfo("Giriş isteği gönderiliyor...");
        }

        const form = event.currentTarget;
        const formData = new FormData(form);
        formData.set("intent", challengeMethod === "email" ? "verify_email_2fa" : "login");
        if (challengeToken) {
          formData.set("challengeToken", challengeToken);
        }

        startTransition(async () => {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            body: formData
          });

          const payload = (await response.json()) as LoginPayload;

          if (!response.ok || !payload.ok) {
            setError(payload.error ?? "Giriş başarısız.");
            return;
          }

          if (payload.requiresTwoFactor) {
            setChallengeMethod(payload.challengeMethod ?? "email");
            setChallengeToken(payload.challengeToken ?? "");
            setInfo(payload.message ?? (payload.challengeMethod === "totp" ? "Yönetici doğrulama kodunuzu girin." : "E-posta kodunuzu girin."));
            return;
          }

          if (!payload.redirectTo) {
            setError("Giriş yönlendirmesi hazırlanamadı.");
            return;
          }

          setInfo("Login success, redirecting...");
          window.location.assign(payload.redirectTo);
        });
      }}
    >
      <input type="hidden" name="challengeToken" value={challengeToken} />
      <FormMessage message={error} />
      {info ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{info}</div> : null}
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">E-posta</span>
        <input className="field" name="email" type="email" placeholder="admin@limonmasa.com" required disabled={isPending} />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Şifre</span>
        <input className="field" name="password" type="password" placeholder="••••••••" required disabled={isPending} />
      </label>
      {challengeMethod ? (
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">
            {challengeMethod === "email" ? "E-posta doğrulama kodu" : "2FA doğrulama kodu"}
          </span>
          <input className="field" name="otpCode" inputMode="numeric" placeholder="6 haneli kod" maxLength={6} required disabled={isPending} />
        </label>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <Link href="/forgot-password" className="text-sm font-semibold text-moss transition hover:text-ink">
          Şifremi unuttum
        </Link>
        {challengeMethod === "email" ? (
          <button
            type="button"
            className="text-sm font-semibold text-moss transition hover:text-ink disabled:opacity-60"
            disabled={isPending}
            onClick={() => {
              setError(null);
              setInfo(null);

              if (!formRef.current) {
                setError("Doğrulama formu bulunamadı.");
                return;
              }

              const formData = new FormData(formRef.current);
              formData.set("intent", "resend_email_2fa");
              formData.set("challengeToken", challengeToken);

              startTransition(async () => {
                const response = await fetch("/api/auth/login", {
                  method: "POST",
                  body: formData
                });
                const payload = (await response.json()) as LoginPayload;
                if (!response.ok || !payload.ok) {
                  setError(payload.error ?? "Kod yeniden gönderilemedi.");
                  return;
                }
                setInfo(payload.message ?? "Yeni doğrulama kodu gönderildi.");
                setChallengeToken(payload.challengeToken ?? challengeToken);
              });
            }}
          >
            Kodu yeniden gönder
          </button>
        ) : null}
      </div>
      <button className="btn-primary w-full gap-2 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isPending}>
        {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
        {isPending ? "Giriş yapılıyor..." : challengeMethod ? "Doğrulamayı Tamamla" : "Panele Giriş Yap"}
      </button>
    </form>
  );
}
