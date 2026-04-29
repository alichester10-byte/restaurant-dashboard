import { UserRole } from "@prisma/client";
import { LockedAction } from "@/components/demo/locked-action";
import { AiAssistantComposer } from "@/components/integrations/ai-assistant-composer";
import { IntegrationCardGrid } from "@/components/integrations/integration-card-grid";
import { IntegrationQueryFeedback } from "@/components/integrations/integration-query-feedback";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireBusinessAccess } from "@/lib/auth";
import { getAppBaseUrl, getBusinessEntitlement } from "@/lib/billing";
import { getIntegrationsPageDataSafe } from "@/lib/data";
import { getInstagramSetupStatus, getMetaEnvironmentDiagnostics, getMetaSetupStatus, getWhatsappSetupStatus } from "@/lib/meta";
import { getWhatsAppVerifyToken, WHATSAPP_SAMPLE_MESSAGE } from "@/lib/whatsapp";

export default async function IntegrationsPage() {
  const session = await requireBusinessAccess({
    roles: [UserRole.BUSINESS_ADMIN, UserRole.STAFF]
  });
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const data = await getIntegrationsPageDataSafe(session.user.businessId);
  const metaSetup = {
    meta: getMetaSetupStatus(),
    whatsapp: getWhatsappSetupStatus(),
    instagram: getInstagramSetupStatus()
  };
  const metaDiagnostics = getMetaEnvironmentDiagnostics();

  return (
    <div className="space-y-6">
      <AppHeader
        title="Rezervasyon Kanalları"
        subtitle="WhatsApp, Instagram, web ve AI destekli talep akışlarını tek panelde yönetin."
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      <IntegrationQueryFeedback />

      {data.loadError ? (
        <Panel className="border-amber-200 bg-amber-50/80">
          <div className="section-title text-amber-800">Kurtarma Modu</div>
          <p className="mt-2 text-sm leading-6 text-amber-800">{data.loadError}</p>
        </Panel>
      ) : null}

      <IntegrationCardGrid
        cards={data.cards}
        businessSlug={session.user.business.slug}
        baseUrl={getAppBaseUrl()}
        whatsappVerifyToken={getWhatsAppVerifyToken()}
        whatsappSampleMessage={WHATSAPP_SAMPLE_MESSAGE}
        metaSetup={metaSetup}
        canManageConnections={entitlement.canWrite && session.user.role === UserRole.BUSINESS_ADMIN}
        pendingRequestCount={data.pendingRequests.length}
      />

      {session.user.role === UserRole.BUSINESS_ADMIN ? (
        <Panel>
          <div className="section-title">Meta Diagnostics</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Bağlantı ayarları kontrolü</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm text-sage">
              <div className="font-semibold text-ink">Redirect URI</div>
              <div className="mt-2 break-all">{metaDiagnostics.redirectUri}</div>
              <div className="mt-2">
                {metaDiagnostics.redirectUriExactMatch
                  ? `${metaDiagnostics.expectedBaseUrl} ile uyumlu.`
                  : `NEXT_PUBLIC_APP_URL tam olarak ${metaDiagnostics.expectedBaseUrl} olmalı.`}
              </div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm text-sage">
              <div className="font-semibold text-ink">Temel Kontroller</div>
              <div className="mt-2">App ID eşleşmesi: {metaDiagnostics.appIdsMatch ? "Evet" : "Hayır"}</div>
              <div className="mt-1">Webhook secret eşleşmesi: {metaDiagnostics.webhookSecretMatchesAppSecret ? "Evet" : "Hayır / farklı"}</div>
              <div className="mt-1">WhatsApp Config ID: {metaDiagnostics.whatsappConfigIdLooksValid ? "Uygun görünüyor" : "Şüpheli"}</div>
              <div className="mt-1">Instagram Config ID: {metaDiagnostics.instagramConfigIdLooksValid ? "Uygun görünüyor" : "Şüpheli"}</div>
              <div className="mt-1">Verify token önizleme: {metaDiagnostics.verifyTokenPreview}</div>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {metaDiagnostics.diagnostics.map((item) => (
              <div key={item.key} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold text-ink">{item.key}</div>
                  <span className={`badge ${item.level === "ok" ? "bg-emerald-100 text-emerald-800" : item.level === "missing" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>
                    {item.level === "ok" ? "Hazır" : item.level === "missing" ? "Eksik" : "Kontrol Et"}
                  </span>
                </div>
                <div className="mt-2 text-sage">{item.maskedValue}</div>
                <div className="mt-1 text-sage">{item.message}</div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel id="ai-assistant-testing">
          <div className="section-title">AI Reservation Assistant</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Mesajı yapıştır, talebi önizle</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            WhatsApp, Instagram veya web üzerinden gelebilecek mesajları önce pending request olarak oluşturun. İnsan onayı olmadan canlı rezervasyon oluşmaz.
          </p>

          <div className="mt-6">
            {entitlement.isDemo ? (
              <LockedAction
                fullWidth
                href="/billing?upgrade=ai-assistant"
                title="AI asistanından talep oluşturmak için Pro gerekir"
                description="Demo modunda pending request akışını inceleyebilirsiniz. Yeni talep oluşturma ve onay işlemleri Pro ile açılır."
              />
            ) : (
              <AiAssistantComposer />
            )}
          </div>

          <div className="mt-8 border-t border-[color:var(--border)] pt-8">
            <div className="section-title">Kanal Talepleri</div>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Tüm dış kanal taleplerini Rezervasyonlar içinde yönetin</h2>
            <p className="mt-2 text-sm leading-6 text-sage">
              WhatsApp, Instagram, web ve AI kaynaklı tüm talepler artık Rezervasyonlar sayfasındaki özel Kanal Talepleri bölümünde toplanır. Entegrasyonlar sayfası yalnızca bağlantı durumlarını ve kurulum adımlarını gösterir.
            </p>

            <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-ink">{data.pendingRequests.length} bekleyen talep</div>
                  <p className="mt-2 text-sm leading-6 text-sage">
                    Onay ve red işlemleri, müşteri mesajı ve AI çıkarımlarıyla birlikte Rezervasyonlar sayfasında tek akışta yönetilir.
                  </p>
                </div>
                <a href="/reservations#channel-requests" className="btn-primary text-center">
                  Rezervasyonlarda Gör
                </a>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Kanal Mimarisi</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Hazır temeller</h2>
          <div className="mt-5 space-y-3">
            {[
              "WhatsApp ve Instagram için webhook doğrulama endpointleri hazır.",
              "Google / web talepleri public request endpointine düşer.",
              "AI extraction katmanı isim, telefon, tarih, saat ve kişi sayısı için preview çıkarır.",
              "Tüm dış kaynak talepleri önce pending request olarak saklanır.",
              "Onay/reddet akışı tenant ve rol kontrolüyle korunur."
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm leading-6 text-sage">
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
