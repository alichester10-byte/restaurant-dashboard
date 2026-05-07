"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type QuickLink = {
  label: string;
  href: string;
};

type OperatorSummary = {
  pendingCount: number;
  totalCount: number;
  latestRequestLabel?: string | null;
};

type RestaurantChatWidgetProps = {
  restaurantId: string;
  restaurantName: string;
  assistantEnabled: boolean;
  welcomeMessage: string;
  mode?: "floating" | "operator";
  className?: string;
  quickLinks?: QuickLink[];
  operatorSummary?: OperatorSummary;
  isDemo?: boolean;
  upgradeHref?: string;
};

type ChatApiResponse = {
  ok: boolean;
  error?: string;
  sessionId?: string;
  reply?: string;
  requestCreated?: boolean;
};

const OPERATOR_EXAMPLES = [
  "Müşteriden gelen mesaj: Yarın akşam 20.30 için 4 kişilik masa rica ediyoruz. Adım Elif, telefonum 0555 222 33 44.",
  "Bu rezervasyon mesajında eksik bilgi var mı? Cumartesi 19.00 için 2 kişiyiz, adım Burak.",
  "Yeni bir rezervasyon talebi hazırlamak istiyorum: Cuma 21.00, 6 kişi, Ahmet, 0532 444 55 66."
];

function buildStorageKey(restaurantId: string, mode: "floating" | "operator") {
  return `limonmasa-chat:${mode}:${restaurantId}`;
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

function CompactMetric({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-moss">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

export function RestaurantChatWidget({
  restaurantId,
  restaurantName,
  assistantEnabled,
  welcomeMessage,
  mode = "floating",
  className,
  quickLinks = [],
  operatorSummary,
  isDemo = false,
  upgradeHref = "/billing?upgrade=ai-assistant"
}: RestaurantChatWidgetProps) {
  const storageKey = useMemo(() => buildStorageKey(restaurantId, mode), [mode, restaurantId]);
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
      // Ignore localStorage issues.
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
          source: mode === "operator" ? "WEBSITE_OPERATOR_PANEL" : "WEBSITE_CHATBOT"
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

  const disabledMessage =
    mode === "operator"
      ? "AI operasyon asistanı şu anda aktif değil. Kanal taleplerini manuel akışla yönetmeye devam edebilirsiniz."
      : "AI asistanı şu anda bu restoran için aktif değil. Yandaki form üzerinden rezervasyon talebinizi bırakabilirsiniz.";

  const panelTitle = mode === "operator" ? "AI Operasyon Asistanı" : "AI Assistant";
  const panelDescription =
    mode === "operator"
      ? "Restoran sahibinin günlük ihtiyaçları için müşteri mesajlarını talebe dönüştürür, eksik alanları tespit eder ve ekibin onay akışını hızlandırır."
      : "Rezervasyon detaylarını toplayıp ekibe onay için iletirim.";
  const inputPlaceholder =
    mode === "operator"
      ? "Müşteri mesajını yapıştırın veya yeni rezervasyon talebini tarif edin."
      : "Örn: Yarın akşam 20.30 için 4 kişiyiz. Adım Elif, telefonum 0555 222 33 44.";
  const helperText =
    mode === "operator"
      ? "Rezervasyonu kesinleştirmez; yalnızca talebi toparlayıp onay akışına hazırlar."
      : "AI asistan talebi toplar; rezervasyon, restoran onayı olmadan kesinleşmez.";

  const examples = mode === "operator" ? OPERATOR_EXAMPLES : [];

  const drawer = (
    <>
      {mode === "operator" ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]"
          aria-label="AI asistan panelini kapat"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div
        id="restaurant-chat-widget"
        className={cn(
          mode === "operator"
            ? "fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-white/70 bg-[linear-gradient(180deg,rgba(248,244,236,0.99)_0%,rgba(244,238,227,0.98)_100%)] shadow-[-24px_0_60px_rgba(44,62,45,0.16)]"
            : "fixed inset-x-3 bottom-20 z-40 max-h-[78vh] rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(248,244,236,0.98)_0%,rgba(244,238,227,0.97)_100%)] shadow-[0_25px_60px_rgba(44,62,45,0.16)] backdrop-blur sm:inset-x-auto sm:right-6 sm:w-[390px]",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-5 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">{panelTitle}</div>
            <div className="mt-1 text-lg font-semibold text-ink">{restaurantName}</div>
            <div className="mt-1 text-sm leading-6 text-sage">{panelDescription}</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold text-sage transition hover:text-ink"
          >
            Kapat
          </button>
        </div>

        {mode === "operator" ? (
          <div className="border-b border-[color:var(--border)] px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <CompactMetric label="Toplam AI Talebi" value={operatorSummary?.totalCount ?? 0} />
              <CompactMetric label="Onay Bekleyen" value={operatorSummary?.pendingCount ?? 0} />
            </div>

            {quickLinks.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {quickLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-moss hover:text-moss"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}

            {operatorSummary?.latestRequestLabel ? (
              <div className="mt-4 rounded-2xl bg-white/85 px-4 py-3 text-sm leading-6 text-sage">
                <span className="font-semibold text-ink">Son talep:</span> {operatorSummary.latestRequestLabel}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={cn("flex flex-col", mode === "operator" ? "min-h-0 flex-1" : "max-h-[58vh] min-h-[380px]")}>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {!assistantEnabled ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                {disabledMessage}
              </div>
            ) : null}

            {mode === "operator" ? (
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 px-4 py-4">
                <div className="text-sm font-semibold text-ink">Neler yapabilir?</div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-sage">
                  <div>Müşteri mesajlarını rezervasyon talebine dönüştürür.</div>
                  <div>Eksik isim, telefon, tarih, saat ve kişi sayısını tespit eder.</div>
                  <div>Kanal Talepleri akışına hazır içerik üretir.</div>
                  <div>Son kararı yine restoran ekibi verir.</div>
                </div>
              </div>
            ) : null}

            {mode === "operator" && isDemo ? (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="text-sm font-semibold text-emerald-900">Pro ile neler açılır?</div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-emerald-800">
                  <div>Website chatbot taleplerini canlı olarak yönetme</div>
                  <div>WhatsApp ve Instagram mesajlarını AI ile toplama</div>
                  <div>Talebi rezervasyona çeviren hızlandırılmış operasyon akışı</div>
                  <div>Rezervasyon asistanı için daha yoğun kullanım ve kanal otomasyonu</div>
                </div>
                <a
                  href={upgradeHref}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-moss px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink"
                >
                  Pro&apos;ya Geç
                </a>
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
            {examples.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setDraft(example)}
                    className="rounded-full border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold text-sage transition hover:border-moss hover:text-moss"
                  >
                    Örnek
                  </button>
                ))}
              </div>
            ) : null}

            {requestCreated ? (
              <div className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                Talep hazırlandı. Restoran ekibi son uygunluğu kontrol edip rezervasyonu onaylayacaktır.
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
                placeholder={inputPlaceholder}
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs leading-5 text-sage">{helperText}</div>
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
      </div>
    </>
  );

  if (mode === "operator") {
    return (
      <>
        <div className={cn("fixed bottom-5 left-5 z-30 sm:bottom-6 sm:left-6", className)}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/92 px-4 py-3 shadow-[0_20px_45px_rgba(44,62,45,0.14)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_26px_55px_rgba(44,62,45,0.18)]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-moss text-lg text-white shadow-[0_12px_30px_rgba(53,92,62,0.22)]">
              AI
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-moss">Operasyon Asistanı</span>
              <span className="mt-0.5 block text-sm font-semibold text-ink">
                {isDemo ? "Pro ile AI akışını açın" : `${operatorSummary?.pendingCount ?? 0} bekleyen talep`}
              </span>
            </span>
          </button>
        </div>

        {open ? drawer : null}
      </>
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

      {open ? drawer : null}
    </>
  );
}
