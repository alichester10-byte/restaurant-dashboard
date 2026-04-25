"use client";
/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { integrationProviderLabels } from "@/lib/constants";
import { integrationDescriptions } from "@/lib/integrations";

type CardItem = {
  provider: IntegrationProvider;
  connection: {
    status: IntegrationStatus;
    displayPhoneNumber?: string | null;
    phoneNumberId?: string | null;
    wabaId?: string | null;
    instagramUsername?: string | null;
    instagramAccountId?: string | null;
    facebookPageId?: string | null;
    webhookSubscribedAt?: string | Date | null;
    lastWebhookReceivedAt?: string | Date | null;
    errorMessage?: string | null;
  };
  latestRequest?: {
    guestName: string;
    rawMessage?: string | null;
    createdAt: string | Date;
  } | null;
};

type MetaSetup = {
  available: boolean;
  missing: string[];
  verifyToken: string | null;
  callbackUrl: string;
  whatsappWebhookUrl: string;
  instagramWebhookUrl: string;
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

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "Henüz alınmadı";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Henüz alınmadı";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function SetupStatusBadge({
  status,
  provider,
  setupAvailable
}: {
  status: IntegrationStatus;
  provider: IntegrationProvider;
  setupAvailable?: boolean;
}) {
  const mapped =
    provider === IntegrationProvider.AI_ASSISTANT
      ? "Ready"
      : !setupAvailable && (provider === IntegrationProvider.WHATSAPP || provider === IntegrationProvider.INSTAGRAM)
        ? "Setup required"
        : status === IntegrationStatus.CONNECTED
          ? "Active"
          : status === IntegrationStatus.CONNECTING
            ? "Connecting"
            : status === IntegrationStatus.ERROR || status === IntegrationStatus.NEEDS_CONFIGURATION
              ? "Setup required"
              : "Not configured";

  const tone =
    mapped === "Active"
      ? "bg-emerald-100 text-emerald-800"
      : mapped === "Connecting"
        ? "bg-sky-100 text-sky-800"
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
        className="w-full max-w-3xl rounded-[32px] border border-white/40 bg-white p-6 shadow-[0_32px_80px_rgba(20,33,27,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">Entegrasyon</div>
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
  whatsappSampleMessage,
  metaSetup,
  canManageConnections
}: {
  cards: CardItem[];
  businessSlug: string;
  baseUrl: string;
  whatsappVerifyToken: string;
  whatsappSampleMessage: string;
  metaSetup: {
    whatsapp: MetaSetup;
    instagram: MetaSetup;
  };
  canManageConnections: boolean;
}) {
  const [openProvider, setOpenProvider] = useState<IntegrationProvider | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publicReservationLink = `${baseUrl}/r/${businessSlug}`;
  const widgetScript = `<iframe src="${publicReservationLink}?embed=1" title="Reservation Widget" style="width:100%;min-height:640px;border:0;border-radius:24px;"></iframe>`;
  const qrUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicReservationLink)}`,
    [publicReservationLink]
  );

  const whatsappCard = cards.find((item) => item.provider === IntegrationProvider.WHATSAPP);
  const instagramCard = cards.find((item) => item.provider === IntegrationProvider.INSTAGRAM);

  async function runConnectionTest(provider: "whatsapp" | "instagram") {
    setActionPending(`${provider}-test`);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/${provider}/test`, { method: "POST" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        if (payload?.error === "setup_required") {
          setError(`Meta kurulumu tamamlanmadan ${provider === "whatsapp" ? "WhatsApp" : "Instagram"} bağlantısı test edilemez.`);
          return;
        }

        if (payload?.error === "not_connected") {
          setError(`${provider === "whatsapp" ? "WhatsApp" : "Instagram"} hesabı henüz bağlı değil.`);
          return;
        }

        setError("Bağlantı doğrulanamadı. Kurulum adımlarını tekrar kontrol edin.");
        return;
      }

      setNotice(payload.message);
    } catch {
      setError("Test sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setActionPending(null);
    }
  }

  async function disconnectProvider(provider: "whatsapp" | "instagram") {
    setActionPending(`${provider}-disconnect`);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/${provider}/disconnect`, { method: "POST" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setError("Bağlantı kaldırılamadı. Lütfen tekrar deneyin.");
        return;
      }

      setNotice(`${provider === "whatsapp" ? "WhatsApp" : "Instagram"} bağlantısı kaldırıldı. Sayfayı yenilediğinizde durum güncellenecek.`);
    } catch {
      setError("Bağlantı kaldırılırken beklenmeyen bir hata oluştu.");
    } finally {
      setActionPending(null);
    }
  }

  function renderConnectButton(provider: "whatsapp" | "instagram", available: boolean) {
    if (!canManageConnections) {
      return (
        <Link href="/billing?upgrade=integrations" className="btn-primary w-full text-center">
          Pro ile Bağla
        </Link>
      );
    }

    if (!available) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Meta uygulama kurulumu tamamlandığında bu işletme bağlantıyı kendi panelinden başlatabilir.
        </div>
      );
    }

    return (
      <a href={`/api/integrations/${provider}/start`} className="btn-primary w-full text-center">
        {provider === "whatsapp" ? "WhatsApp’ı Bağla" : "Instagram’ı Bağla"}
      </a>
    );
  }

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-5">
        {cards.map((item) => {
          const copy = integrationDescriptions[item.provider];
          const isMetaProvider = item.provider === IntegrationProvider.WHATSAPP || item.provider === IntegrationProvider.INSTAGRAM;
          const setupAvailable =
            item.provider === IntegrationProvider.WHATSAPP
              ? metaSetup.whatsapp.available
              : item.provider === IntegrationProvider.INSTAGRAM
                ? metaSetup.instagram.available
                : true;
          const ctaLabel =
            item.provider === IntegrationProvider.WHATSAPP
              ? "WhatsApp’ı Bağla"
              : item.provider === IntegrationProvider.INSTAGRAM
                ? "Instagram’ı Bağla"
                : item.provider === IntegrationProvider.GOOGLE_WEB
                  ? "Etkinleştir"
                  : item.provider === IntegrationProvider.WEBSITE_WIDGET
                    ? "Scripti Gör"
                    : "AI Test Alanı";

          return (
            <div key={item.provider} className="glass-panel flex h-full flex-col rounded-[30px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="section-title">{copy.title}</div>
                  <div className="mt-3 text-lg font-semibold text-ink">{integrationProviderLabels[item.provider]}</div>
                </div>
                <SetupStatusBadge provider={item.provider} status={item.connection.status} setupAvailable={setupAvailable} />
              </div>
              <p className="mt-4 text-sm leading-6 text-sage">{copy.description}</p>

              <div className="mt-5 rounded-2xl bg-[color:var(--bg-strong)] px-4 py-4 text-sm leading-6 text-sage">
                {item.provider === IntegrationProvider.WHATSAPP ? (
                  item.connection.displayPhoneNumber ? (
                    <>
                      <div className="font-semibold text-ink">{item.connection.displayPhoneNumber}</div>
                      <div className="mt-1">Son webhook: {formatDate(item.connection.lastWebhookReceivedAt)}</div>
                    </>
                  ) : setupAvailable ? (
                    "Embedded Signup ile telefon numaranızı bağlayın. Mesajlar AI ile çözümlenir ve onay bekleyen talep olarak düşer."
                  ) : (
                    "Meta uygulama kurulumu tamamlanınca bu karttan self-serve bağlantı başlatabilirsiniz."
                  )
                ) : item.provider === IntegrationProvider.INSTAGRAM ? (
                  item.connection.instagramUsername ? (
                    <>
                      <div className="font-semibold text-ink">@{item.connection.instagramUsername}</div>
                      <div className="mt-1">Son DM: {formatDate(item.connection.lastWebhookReceivedAt)}</div>
                    </>
                  ) : setupAvailable ? (
                    "Instagram Professional hesabınızı bağlayın. DM talepleri otomatik olarak pending request olarak akacaktır."
                  ) : (
                    "Instagram Messaging API izinleri tamamlanınca self-serve bağlantı açılır."
                  )
                ) : item.provider === IntegrationProvider.GOOGLE_WEB ? (
                  "Public rezervasyon linkiniz ve QR kodunuz her zaman hazır."
                ) : item.provider === IntegrationProvider.WEBSITE_WIDGET ? (
                  "Widget script’ini kopyalayıp sitenize birkaç dakikada ekleyin."
                ) : (
                  "Mesajlar AI tarafından analiz edilir, güven skoru çıkarılır ve siz onaylamadan rezervasyon oluşmaz."
                )}
              </div>

              {item.latestRequest ? (
                <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-4 text-sm leading-6 text-sage">
                  <div className="font-semibold text-ink">{item.latestRequest.guestName}</div>
                  <div className="mt-1 line-clamp-3">{item.latestRequest.rawMessage ?? "Son talep içeriği burada görünür."}</div>
                </div>
              ) : null}

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

              {isMetaProvider && item.connection.errorMessage ? (
                <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{item.connection.errorMessage}</div>
              ) : null}
            </div>
          );
        })}
      </section>

      <IntegrationModal open={openProvider === IntegrationProvider.WHATSAPP} onClose={() => setOpenProvider(null)} title="WhatsApp Business self-serve bağlantı">
        <div className="space-y-5">
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
            <p className="mt-3 text-sm leading-6 text-sage">
              WhatsApp mesajları AI tarafından çözümlenir, bekleyen talep olarak düşer, siz onaylamadan rezervasyon oluşmaz.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                Webhook URL
                <span className="rounded-full bg-[color:var(--bg-strong)] px-2 py-1 text-[11px] font-medium text-sage" title="Meta callback URL alanına bu adresi girin.">
                  Kullanım
                </span>
              </div>
              <div className="mt-2 break-all text-sm text-sage">{metaSetup.whatsapp.whatsappWebhookUrl}</div>
              <div className="mt-3">
                <CopyButton value={metaSetup.whatsapp.whatsappWebhookUrl} label="Webhook URL kopyala" />
              </div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm font-semibold text-ink">Verify Token</div>
              <div className="mt-2 break-all text-sm text-sage">{whatsappVerifyToken}</div>
              <div className="mt-3">
                <CopyButton value={whatsappVerifyToken} label="Verify token kopyala" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
            <div className="text-sm font-semibold text-ink">Örnek WhatsApp mesajı</div>
            <div className="mt-3 rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">{whatsappSampleMessage}</div>
            <p className="mt-3 text-sm leading-6 text-sage">
              Sistem bu mesajı analiz eder, isim/tarih/saat/kişi sayısı alanlarını çıkarır ve pending request listesine düşürür.
            </p>
          </div>

          {renderConnectButton("whatsapp", metaSetup.whatsapp.available)}

          {whatsappCard?.connection.status === IntegrationStatus.CONNECTED ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
                <div className="font-semibold text-ink">Bağlı numara</div>
                <div className="mt-1">{whatsappCard.connection.displayPhoneNumber ?? "Telefon numarası okunamadı"}</div>
                <div className="mt-2">Son mesaj: {formatDate(whatsappCard.connection.lastWebhookReceivedAt)}</div>
              </div>
              <div className="flex flex-col gap-3">
                <button className="btn-secondary w-full" type="button" onClick={() => runConnectionTest("whatsapp")} disabled={actionPending === "whatsapp-test"}>
                  {actionPending === "whatsapp-test" ? "Test ediliyor..." : "Test Connection"}
                </button>
                <button className="btn-secondary w-full" type="button" onClick={() => disconnectProvider("whatsapp")} disabled={actionPending === "whatsapp-disconnect"}>
                  {actionPending === "whatsapp-disconnect" ? "Kaldırılıyor..." : "Disconnect"}
                </button>
              </div>
            </div>
          ) : null}

          {!metaSetup.whatsapp.available ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
              Meta kurulumu eksik. Gerekli değişkenler: {metaSetup.whatsapp.missing.join(", ")}
            </div>
          ) : null}

          {notice ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        </div>
      </IntegrationModal>

      <IntegrationModal open={openProvider === IntegrationProvider.INSTAGRAM} onClose={() => setOpenProvider(null)} title="Instagram DM self-serve bağlantı">
        <div className="space-y-5">
          <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
            Instagram Professional hesabınızı Meta Business Login ile bağladığınızda gelen DM rezervasyon talepleri pending request listesine düşer. İnsan onayı olmadan rezervasyon oluşmaz.
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
            <div className="text-sm font-semibold text-ink">Webhook URL</div>
            <div className="mt-2 break-all text-sm text-sage">{metaSetup.instagram.instagramWebhookUrl}</div>
            <div className="mt-3">
              <CopyButton value={metaSetup.instagram.instagramWebhookUrl} label="Webhook URL kopyala" />
            </div>
          </div>

          {renderConnectButton("instagram", metaSetup.instagram.available)}

          {instagramCard?.connection.status === IntegrationStatus.CONNECTED ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
                <div className="font-semibold text-ink">@{instagramCard.connection.instagramUsername ?? "username okunamadı"}</div>
                <div className="mt-1">Sayfa ID: {instagramCard.connection.facebookPageId ?? "Tanımsız"}</div>
                <div className="mt-2">Son DM: {formatDate(instagramCard.connection.lastWebhookReceivedAt)}</div>
              </div>
              <div className="flex flex-col gap-3">
                <button className="btn-secondary w-full" type="button" onClick={() => runConnectionTest("instagram")} disabled={actionPending === "instagram-test"}>
                  {actionPending === "instagram-test" ? "Test ediliyor..." : "Test Connection"}
                </button>
                <button className="btn-secondary w-full" type="button" onClick={() => disconnectProvider("instagram")} disabled={actionPending === "instagram-disconnect"}>
                  {actionPending === "instagram-disconnect" ? "Kaldırılıyor..." : "Disconnect"}
                </button>
              </div>
            </div>
          ) : null}

          {!metaSetup.instagram.available ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
              Meta kurulumu eksik. Gerekli değişkenler: {metaSetup.instagram.missing.join(", ")}
            </div>
          ) : null}

          {notice ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
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
    </>
  );
}
