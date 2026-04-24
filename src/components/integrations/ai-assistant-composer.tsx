"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createManualReservationRequestAction } from "@/actions/integration-actions";

const demoMessages = [
  "yarın 8'e 4 kişi",
  "bugün 2 kişi saat 7"
];

function ComposerSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="btn-primary w-full gap-2 md:w-auto" type="submit" disabled={pending}>
      {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
      {pending ? "Mesaj analiz ediliyor..." : "Talebi Çözümle ve Beklemeye Al"}
    </button>
  );
}

export function AiAssistantComposer() {
  const [message, setMessage] = useState("");

  return (
    <form action={createManualReservationRequestAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value="/integrations" />
      <input type="hidden" name="source" value="AI" />

      <div className="flex flex-wrap gap-2">
        {demoMessages.map((item) => (
          <button
            key={item}
            className="rounded-full border border-[rgba(33,76,61,0.14)] bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-[rgba(33,76,61,0.3)] hover:bg-[color:var(--bg-strong)]"
            type="button"
            onClick={() => setMessage(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ink">Mesaj</span>
        <textarea
          className="field min-h-32 transition focus:shadow-[0_0_0_4px_rgba(33,76,61,0.08)]"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Örn: Merhaba yarın akşam 20:00 için 4 kişilik yer var mı? Ben Emre, telefonum +90 555 111 22 33."
          required
        />
      </label>

      <div className="rounded-[22px] border border-[rgba(33,76,61,0.1)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95)_0%,rgba(244,239,227,0.9)_100%)] px-4 py-3 text-sm text-sage">
        Mesaj analiz edildiğinde isim, telefon, tarih, saat, kişi sayısı ve notlar öneri olarak çıkarılır. Son onay her zaman sizde kalır.
      </div>

      <ComposerSubmitButton />
    </form>
  );
}
