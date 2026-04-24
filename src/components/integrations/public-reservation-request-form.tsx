"use client";

import { useState, useTransition } from "react";

export function PublicReservationRequestForm({
  businessSlug,
  businessName,
  embed = false
}: {
  businessSlug: string;
  businessName: string;
  embed?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const response = await fetch("/api/reservation-request", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              businessSlug,
              guestName: message.split(/[,.!\n]/)[0] || "Web talebi",
              message,
              notes: message
            })
          });

          setStatus(response.ok ? "success" : "error");
          if (response.ok) {
            setMessage("");
          }
        });
      }}
    >
      <div className={embed ? "" : "rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6"}>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">Online Reservation</div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-ink">{businessName}</h1>
        <p className="mt-3 text-sm leading-6 text-sage">
          Mesajınızı bırakın; ekip uygunluğu kontrol edip rezervasyon talebinizi onay akışına alır.
        </p>
        <textarea
          className="field mt-5 min-h-36"
          placeholder="Örn: Yarın akşam 20:00 için 4 kişilik masa rica ederim. Telefonum +90 555 111 22 33."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
        />
        <button className="btn-primary mt-5 w-full gap-2 sm:w-auto" type="submit" disabled={isPending}>
          {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
          {isPending ? "Talebiniz gönderiliyor..." : "Rezervasyon Talebi Gönder"}
        </button>
        {status === "success" ? (
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Talebiniz alındı. İşletme ekibi kısa süre içinde sizinle iletişime geçecek.
          </div>
        ) : null}
        {status === "error" ? (
          <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Talep şu anda gönderilemedi. Lütfen birkaç dakika sonra tekrar deneyin.
          </div>
        ) : null}
      </div>
    </form>
  );
}
