"use client";
/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { integrationDescriptions } from "@/lib/integrations";
import { integrationProviderLabels } from "@/lib/constants";

type CardItem = {
  provider: IntegrationProvider;
  connection: {
    status: IntegrationStatus;
  };
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="btn-secondary"
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? "Kopyalandı" : label}
    </button>
  );
}

function SetupStatusBadge({ status, provider }: { status: IntegrationStatus; provider: IntegrationProvider }) {
  const mapped =
    provider === IntegrationProvider.AI_ASSISTANT
      ? status === IntegrationStatus.CONNECTED
        ? "Active"
        : "Ready"
      : status === IntegrationStatus.CONNECTED
        ? "Active"
        : status === IntegrationStatus.NEEDS_CONFIGURATION
          ? "Setup required"
          : "Not configured";

  const tone =
    mapped === "Active"
      ? "bg-emerald-100 text-emerald-800"
      : mapped === "Setup required" || mapped === "Ready"
        ? "bg-amber-100 text-amber-800"
        : "bg-stone-100 text-stone-700";

  return <span className={`badge ${tone}`}>{mapped}</span>;
}

function IntegrationModal({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-[32px] border border-white/40 bg-white p-6 shadow-[0_32px_80px_rgba(20,33,27,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">Kurulum Akışı</div>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-ink">{title}</h3>
        <div className="mt-6">{children}</div>
        <button className="btn-secondary mt-6 w-full sm:w-auto" type="button" onClick={onClose}>
          Kapat
        </button>
      </div>
    </div>
  );
}

export function IntegrationCardGrid({
  cards,
  businessSlug,
  baseUrl,
  whatsappVerifyToken,
  whatsappSampleMessage
}: {
  cards: CardItem[];
  businessSlug: string;
  baseUrl: string;
  whatsappVerifyToken: string;
  whatsappSampleMessage: string;
}) {
  const [openProvider, setOpenProvider] = useState<IntegrationProvider | null>(null);
  const [testNotice, setTestNotice] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testPending, setTestPending] = useState(false);
  const publicReservationLink = `${baseUrl}/r/${businessSlug}`;
  const webhookUrl = `${baseUrl}/api/integrations/whatsapp/webhook`;
  const verifyToken = whatsappVerifyToken;
  const widgetScript = `<iframe src="${publicReservationLink}?embed=1" title="Reservation Widget" style="width:100%;min-height:640px;border:0;border-radius:24px;"></iframe>`;
  const qrUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicReservationLink)}`,
    [publicReservationLink]
  );

  async function testWhatsAppConnection() {
    setTestPending(true);
    setTestNotice(null);
    setTestError(null);

    try {
      const response = await fetch("/api/integrations/whatsapp/test", {
        method: "POST"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setTestError("Bağlantı doğrulanamadı. Token ve webhook ayarlarını tekrar kontrol edin.");
        return;
      }

      setTestNotice(`${payload.message} Örnek çıktı: ${payload.preview?.guestName ?? "Misafir"} • ${payload.preview?.requestedDate ?? "tarih yok"} • ${payload.preview?.requestedTime ?? "saat yok"}`);
    } catch {
      setTestError("Test sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setTestPending(false);
    }
  }

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-5">
        {cards.map((item) => {
          const copy = integrationDescriptions[item.provider];
          const ctaLabel =
            item.provider === IntegrationProvider.WHATSAPP
              ? "Bağla"
              : item.provider === IntegrationProvider.GOOGLE_WEB
                ? "Etkinleştir"
                : item.provider === IntegrationProvider.WEBSITE_WIDGET
                  ? "Scripti Gör"
                  : item.provider === IntegrationProvider.AI_ASSISTANT
                    ? "Test Alanına Git"
                    : "Yapılandır";

          return (
            <div key={item.provider} className="glass-panel flex h-full flex-col rounded-[30px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="section-title">{copy.title}</div>
                  <div className="mt-3 text-lg font-semibold text-ink">{integrationProviderLabels[item.provider]}</div>
                </div>
                <SetupStatusBadge provider={item.provider} status={item.connection.status} />
              </div>
              <p className="mt-4 text-sm leading-6 text-sage">{copy.description}</p>
              <div className="mt-5 rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm leading-6 text-sage">
                {item.provider === IntegrationProvider.AI_ASSISTANT
                  ? "AI önerileri pending request olarak düşer ve ekip onayıyla rezervasyona dönüşür."
                  : item.provider === IntegrationProvider.WHATSAPP
                    ? "Webhook kurulumunu tamamlayıp ilk mesajı alın."
                    : item.provider === IntegrationProvider.GOOGLE_WEB
                      ? "Public rezervasyon linkinizi paylaşın ve QR ile masalara yerleştirin."
                      : item.provider === IntegrationProvider.WEBSITE_WIDGET
                        ? "Embed script ile widget'ı sitenize birkaç dakikada ekleyin."
                        : "Meta hesap bağlantısı sonrası DM talepleri pending request akışına düşer."}
              </div>
              <div className="mt-auto pt-5">
                {item.provider === IntegrationProvider.AI_ASSISTANT ? (
                  <a href="#ai-assistant-testing" className="btn-secondary block w-full text-center">
                    {ctaLabel}
                  </a>
                ) : (
                  <button className="btn-secondary w-full" type="button" onClick={() => setOpenProvider(item.provider)}>
                    {ctaLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <IntegrationModal open={openProvider === IntegrationProvider.WHATSAPP} onClose={() => setOpenProvider(null)} title="WhatsApp Business kurulumu">
        <div className="space-y-4">
          <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
            1. Meta panelinde webhook URL ve verify token alanlarını girin. 2. Mesaj webhook&apos;unu aktif edin. 3. İlk test payload&apos;unu gönderin.
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                Webhook URL
                <span className="rounded-full bg-[color:var(--bg-strong)] px-2 py-1 text-[11px] font-medium text-sage" title="Meta panelindeki callback URL alanına bu adresi yapıştırın.">
                  Nasıl kullanılır?
                </span>
              </div>
              <div className="mt-2 break-all text-sm text-sage">{webhookUrl}</div>
              <div className="mt-3"><CopyButton value={webhookUrl} label="Copy webhook URL" /></div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm font-semibold text-ink">Verify Token</div>
              <div className="mt-2 break-all text-sm text-sage">{verifyToken}</div>
              <div className="mt-3"><CopyButton value={verifyToken} label="Verify token kopyala" /></div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(244,239,227,0.92)_100%)] p-4">
              <div className="text-sm font-semibold text-ink">Bağladıktan sonra ne olur</div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sage">
                <span className="rounded-full bg-white px-3 py-2">message</span>
                <span>→</span>
                <span className="rounded-full bg-white px-3 py-2">AI</span>
                <span>→</span>
                <span className="rounded-full bg-white px-3 py-2">pending</span>
                <span>→</span>
                <span className="rounded-full bg-white px-3 py-2">approve</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm font-semibold text-ink">Demo WhatsApp mesajı</div>
              <div className="mt-2 rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
                {whatsappSampleMessage}
              </div>
              <p className="mt-3 text-sm leading-6 text-sage">
                Sistem bu mesajı analiz edip isim, telefon, tarih, saat ve kişi sayısını çıkarır; ardından talebi onay bekleyen kuyruğa düşürür.
              </p>
            </div>
            <button className="btn-secondary w-full gap-2 sm:w-auto" type="button" onClick={testWhatsAppConnection} disabled={testPending}>
              {testPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : null}
              {testPending ? "Bağlantı test ediliyor..." : "Test connection"}
            </button>
            {testNotice ? (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{testNotice}</div>
            ) : null}
            {testError ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{testError}</div>
            ) : null}
          </div>
        </div>
      </IntegrationModal>

      <IntegrationModal open={openProvider === IntegrationProvider.GOOGLE_WEB} onClose={() => setOpenProvider(null)} title="Google / Web rezervasyon linki">
        <div className="grid gap-5 md:grid-cols-[1fr_240px]">
          <div className="space-y-4">
            <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
              Bu linki Google Business profilinize, bio alanlarınıza veya kampanya sayfalarınıza ekleyerek talepleri doğrudan pending request kuyruğuna düşürebilirsiniz.
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm font-semibold text-ink">Public reservation link</div>
              <div className="mt-2 break-all text-sm text-sage">{publicReservationLink}</div>
              <div className="mt-3"><CopyButton value={publicReservationLink} label="Linki Kopyala" /></div>
            </div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
            <div className="text-sm font-semibold text-ink">QR Kod</div>
            <img alt="Reservation QR code" className="mt-3 h-[220px] w-[220px] rounded-2xl border border-[color:var(--border)] object-cover" src={qrUrl} />
          </div>
        </div>
      </IntegrationModal>

      <IntegrationModal open={openProvider === IntegrationProvider.WEBSITE_WIDGET} onClose={() => setOpenProvider(null)} title="Website widget kurulumu">
        <div className="space-y-4">
          <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
            Aşağıdaki embed snippet&apos;ini sitenizde rezervasyon bölümüne ekleyin. Form gönderimleri güvenli public endpoint üzerinden pending request olarak alınır.
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-xs leading-6 text-sage">{widgetScript}</pre>
          <CopyButton value={widgetScript} label="Scripti Kopyala" />
        </div>
      </IntegrationModal>

      <IntegrationModal open={openProvider === IntegrationProvider.INSTAGRAM} onClose={() => setOpenProvider(null)} title="Instagram DM hazırlığı">
        <div className="space-y-4">
          <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
            Instagram Professional hesabınızı Meta webhook kurulumuna bağladığınızda gelen DM rezervasyon talepleri pending request listesine düşer.
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm leading-6 text-sage">
            Sonraki adım: Meta verify token, app secret ve Messaging webhook yetkilerini tamamlayın.
          </div>
        </div>
      </IntegrationModal>
    </>
  );
}
