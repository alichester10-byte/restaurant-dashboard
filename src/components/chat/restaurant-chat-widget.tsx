"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type RestaurantChatWidgetProps = {
  restaurantId: string;
  restaurantName: string;
  assistantEnabled: boolean;
  welcomeMessage: string;
  mode?: "floating" | "inline";
  className?: string;
};

type ChatApiResponse = {
  ok: boolean;
  error?: string;
  sessionId?: string;
  reply?: string;
  requestCreated?: boolean;
};

function buildStorageKey(restaurantId: string) {
  return `limonmasa-chat:${restaurantId}`;
}

function assistantMessage(content: string): ChatMessage {
  return {
    id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "assistant",
    content
  };
}

function userMessage(content: string): ChatMessage {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "user",
    content
  };
}

export function RestaurantChatWidget({
  restaurantId,
  restaurantName,
  assistantEnabled,
  welcomeMessage,
  mode = "floating",
  className
}: RestaurantChatWidgetProps) {
  const storageKey = useMemo(() => buildStorageKey(restaurantId), [restaurantId]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestCreated, setRequestCreated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHydrated(true);

    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          sessionId?: string | null;
          messages?: ChatMessage[];
          requestCreated?: boolean;
        };

        if (parsed.sessionId) {
          setSessionId(parsed.sessionId);
        }

        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
        } else {
          setMessages([assistantMessage(welcomeMessage)]);
        }

        setRequestCreated(Boolean(parsed.requestCreated));
      } else {
        setMessages([assistantMessage(welcomeMessage)]);
      }
    } catch {
      setMessages([assistantMessage(welcomeMessage)]);
    }
  }, [storageKey, welcomeMessage]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          sessionId,
          messages,
          requestCreated
        })
      );
    } catch {
      // Ignore localStorage quota or privacy mode issues.
    }
  }, [hydrated, messages, requestCreated, sessionId, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    if (!content || isSending || !assistantEnabled) {
      return;
    }

    const nextUserMessage = userMessage(content);
    setMessages((current) => [...current, nextUserMessage]);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          restaurantId,
          sessionId,
          message: content,
          source: "WEBSITE_CHATBOT"
        })
      });

      const payload = (await response.json().catch(() => null)) as ChatApiResponse | null;

      if (!response.ok || !payload?.ok || !payload.reply) {
        setError(payload?.error || "AI asistanı şu anda yanıt veremiyor. Dilerseniz form üzerinden talep bırakabilirsiniz.");
        setMessages((current) => [
          ...current,
          assistantMessage(payload?.error || "Şu anda bir sorun yaşıyorum. İsterseniz rezervasyon talebinizi form üzerinden iletebilirsiniz.")
        ]);
        return;
      }

      setSessionId(payload.sessionId ?? sessionId);
      setRequestCreated(Boolean(payload.requestCreated) || requestCreated);
      setMessages((current) => [...current, assistantMessage(payload.reply!)]);
    } catch {
      setError("Bağlantı kurulamadı. Dilerseniz rezervasyon formunu kullanarak talebinizi iletebilirsiniz.");
      setMessages((current) => [
        ...current,
        assistantMessage("Şu anda bağlantı kurulamadı. Dilerseniz rezervasyon formunu kullanarak talebinizi iletebilirsiniz.")
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const disabledMessage = "AI asistanı şu anda bu restoran için aktif değil. Yandaki form üzerinden rezervasyon talebinizi bırakabilirsiniz.";
  const header = (
    <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-5 py-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">AI Assistant</div>
        <div className="mt-1 text-lg font-semibold text-ink">{restaurantName}</div>
        <div className="mt-1 text-sm leading-6 text-sage">
          Rezervasyon detaylarını toplayıp ekibe onay için iletirim.
        </div>
      </div>
      {mode === "floating" ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold text-sage transition hover:text-ink"
        >
          Kapat
        </button>
      ) : null}
    </div>
  );

  const conversation = (
    <div className={cn("flex flex-col", mode === "inline" ? "min-h-[520px]" : "max-h-[58vh] min-h-[380px]")}>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!assistantEnabled ? (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
            {disabledMessage}
          </div>
        ) : null}

        {messages.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/70 px-4 py-5 text-sm leading-6 text-sage">
            Sohbet başlatmak için mesajınızı yazın. İsim, telefon, tarih, saat ve kişi sayısı bilgilerini toplarım.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-moss text-white shadow-[0_14px_30px_rgba(53,92,62,0.18)]"
                    : "border border-[color:var(--border)] bg-white/90 text-ink"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}

        {isSending ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-[24px] border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-sage">
              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-moss/80" />
              <span>Asistan yazıyor...</span>
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[color:var(--border)] px-4 py-4">
        {requestCreated ? (
          <div className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            Talebiniz alındı. Restoran ekibi son uygunluğu kontrol edip rezervasyonu onaylayacaktır.
          </div>
        ) : null}

        {error ? (
          <div className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</div>
        ) : null}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!assistantEnabled || isSending}
            className="field min-h-28 resize-none"
            placeholder="Örn: Yarın akşam 20.30 için 4 kişiyiz. Adım Elif, telefonum 0555 222 33 44."
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs leading-5 text-sage">
              AI asistan talebi toplar; rezervasyon, restoran onayı olmadan kesinleşmez.
            </div>
            <button
              type="submit"
              disabled={!assistantEnabled || isSending || draft.trim().length === 0}
              className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-full bg-moss px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-moss/40"
            >
              {isSending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> : null}
              {isSending ? "Gönderiliyor" : "Gönder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (mode === "inline") {
    return (
      <div
        id="restaurant-chat-widget"
        className={cn(
          "overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(248,244,236,0.98)_0%,rgba(244,238,227,0.97)_100%)] shadow-[0_25px_60px_rgba(44,62,45,0.10)]",
          className
        )}
      >
        {header}
        {conversation}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-full bg-moss px-4 py-3 text-sm font-semibold text-white shadow-[0_24px_50px_rgba(53,92,62,0.28)] transition hover:bg-ink sm:bottom-6 sm:right-6"
        aria-expanded={open}
        aria-controls="restaurant-chat-widget"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/14 text-lg">💬</span>
        <span className="hidden sm:inline">{open ? "Asistanı Kapat" : "AI Asistan"}</span>
        <span className="sm:hidden">{open ? "Kapat" : "Sohbet"}</span>
      </button>

      {open ? (
        <div
          id="restaurant-chat-widget"
          className="fixed inset-x-3 bottom-20 z-40 max-h-[78vh] rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(248,244,236,0.98)_0%,rgba(244,238,227,0.97)_100%)] shadow-[0_25px_60px_rgba(44,62,45,0.16)] backdrop-blur sm:inset-x-auto sm:right-6 sm:w-[390px]"
        >
          {header}
          {conversation}
        </div>
      ) : null}
    </>
  );
}
