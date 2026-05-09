import Image from "next/image";
import { UserRole } from "@prisma/client";
import { LockedAction } from "@/components/demo/locked-action";
import { AiAssistantComposer } from "@/components/integrations/ai-assistant-composer";
import { IntegrationQueryFeedback } from "@/components/integrations/integration-query-feedback";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireBusinessAccess } from "@/lib/auth";
import { getAppBaseUrl, getBusinessEntitlement } from "@/lib/billing";
import { getIntegrationsPageDataSafe } from "@/lib/data";
import { getIndustryConfig } from "@/lib/industry-config";

const roadmapCards = [
  {
    title: "WhatsApp Business",
    status: "Meta approval pending",
    tone: "waiting",
    body: "Meta onayı tamamlandığında işletme sahibi kendi panelinden WhatsApp hesabını bağlayabilecek. Gelen mesajlar talep olarak bekleyen kuyruğa düşecek."
  },
  {
    title: "Instagram DM",
    status: "Ready after approval",
    tone: "waiting",
    body: "Instagram Professional hesaplarından gelen DM'ler, Meta review tamamlandıktan sonra doğrudan Kanal Talepleri akışına taşınacak."
  },
  {
    title: "Website Widget",
    status: "Available now",
    tone: "ready",
    body: "Paylaşım bağlantısını veya widget akışını kullanarak talebi doğrudan işletme akışına alabilirsiniz. Son onay yine işletme ekibindedir."
  },
  {
    title: "AI Operasyon Asistanı",
    status: "Available now",
    tone: "ready",
    body: "AI operasyon asistanı müşteri mesajlarını talebe dönüştürür, eksik alanları bulur ve operasyon ekibine düzenli bir ön izleme sunar."
  }
];

const steps = [
  "Müşteri WhatsApp, Instagram, web formu veya AI destekli sohbet üzerinden mesaj bırakır.",
  "Sistem gerekli alanları çıkarır ve eksik bilgileri işaretler.",
  "Talep Rezervasyonlar > Kanal Talepleri alanına düşer.",
  "İşletme ekibi talebi inceler, onaylar veya reddeder.",
  "Onaylanan talep ana kayıt akışına taşınır."
];

const afterApproval = [
  "WhatsApp ve Instagram hesapları işletme sahibi tarafından panel içinden bağlanabilecek.",
  "Gelen DM ve mesajlar otomatik olarak AI ile çözümlenecek.",
  "Mesaj akışları bekleyen talepler olarak tek kuyrukta toplanacak.",
  "Operasyon ekibi tek tıkla onay / red verecek.",
  "Tüm kanal performansı raporlara yansıyacak."
];

const nowAvailable = [
  "Website talep formu",
  "Public talep sayfası",
  "AI ile manuel mesaj çözümleme",
  "Kanal Talepleri içinde onay / red akışı",
  "Tenant ve rol kontrollü güvenli pending request sistemi"
];

export default async function IntegrationsPage() {
  const session = await requireBusinessAccess({
    roles: [UserRole.BUSINESS_ADMIN, UserRole.STAFF]
  });
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const data = await getIntegrationsPageDataSafe(session.user.businessId);
  const industry = getIndustryConfig(session.user.business.businessType);
  const publicReservationLink = `${getAppBaseUrl()}/r/${session.user.business.slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicReservationLink)}`;
  const readinessItems = [
    { label: "Website Widget", value: "Available now", tone: "ready" as const },
    { label: "AI Assistant", value: entitlement.isDemo ? "Plan required" : "Available now", tone: entitlement.isDemo ? "plan" as const : "ready" as const },
    { label: "WhatsApp", value: "Meta approval pending", tone: "waiting" as const },
    { label: "Instagram", value: "Meta approval pending", tone: "waiting" as const }
  ];
  const toneClasses = {
    ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    waiting: "border-amber-200 bg-amber-50 text-amber-800",
    plan: "border-slate-200 bg-slate-100 text-slate-700"
  } as const;

  return (
    <div className="space-y-6">
      <AppHeader
        title={`${industry.requestLabelPlural} Kanalları`}
        subtitle="WhatsApp, Instagram, web ve AI destekli talepleri tek operasyon akışında toplamaya hazırlanın."
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

      <Panel className="overflow-hidden">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="section-title">Yakında Geliyor</div>
            <h2 className="text-3xl font-semibold text-ink">Tüm rezervasyon kanalları tek merkezde toplanacak</h2>
            <p className="max-w-2xl text-sm leading-7 text-sage">
              Limon Masa&apos;nın kanal yapısı; WhatsApp, Instagram, web ve AI destekli talep akışlarını tek yerde toplayacak şekilde hazırlanıyor.
              Şu anda Meta onay süreci devam ettiği için sosyal kanal bağlantıları kontrollü ilerliyor. Bu sayfa artık durumu net anlatır; yanlışlıkla
              aktifmiş gibi hissettirmez.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/reservations#channel-requests" className="btn-primary">
                Kanal Taleplerini Aç
              </a>
              <a href={`/r/${session.user.business.slug}`} className="btn-secondary">
                Public Talep Sayfasını Gör
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-moss">Bekleyen Talep</div>
              <div className="mt-3 text-4xl font-semibold text-ink">{data.pendingRequests.length}</div>
              <div className="mt-2 text-sm text-sage">Şu anda dış kanallardan gelen ve onay bekleyen talepler</div>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-moss">Meta Durumu</div>
              <div className="mt-3 text-lg font-semibold text-ink">
                Kurulum / onay bekleniyor
              </div>
              <div className="mt-2 text-sm text-sage">Instagram ve WhatsApp self-serve açılışı Meta onayından sonra yayınlanacak.</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-[color:var(--border)] pt-6 lg:grid-cols-4">
          {readinessItems.map((item) => (
            <div key={item.label} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-ink">{item.label}</div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClasses[item.tone]}`}>
                  {item.value}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[color:var(--bg-strong)]">
                <div
                  className={`h-full rounded-full ${
                    item.tone === "ready" ? "w-full bg-emerald-500" : item.tone === "plan" ? "w-1/2 bg-slate-500" : "w-2/3 bg-amber-400"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-4">
        {roadmapCards.map((card) => (
          <Panel key={card.title}>
            <div className="flex items-center justify-between gap-3">
              <div className="section-title">{card.title}</div>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClasses[card.tone as keyof typeof toneClasses]}`}>
                {card.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-sage">{card.body}</p>
            <div className="mt-5 border-t border-[color:var(--border)] pt-4 text-sm font-medium text-ink">
              {card.tone === "ready" ? "Yönetim ve paylaşım akışına hazır." : "Meta review tamamlandığında açılacak."}
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="section-title">Sistem Nasıl Çalışacak?</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Uçtan uca kanal akışı</h2>
          <div className="mt-6 space-y-3">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--bg-strong)] text-sm font-semibold text-moss">
                  {index + 1}
                </div>
                <div className="text-sm leading-6 text-sage">{step}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-[color:var(--border)] pt-8">
            <div className="section-title">Şu Anda Hazır Olanlar</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {nowAvailable.map((item) => (
                <div key={item} className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm leading-6 text-sage">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Meta Onayından Sonra</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Instagram ve WhatsApp ile neler açılacak?</h2>
          <div className="mt-6 space-y-3">
            {afterApproval.map((item) => (
              <div key={item} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4 text-sm leading-6 text-sage">
                {item}
              </div>
            ))}
          </div>

          {entitlement.isDemo ? (
            <div className="mt-8">
              <LockedAction
                fullWidth
                href="/billing?upgrade=integrations"
                title="Pro ile tüm kanal operasyonu açılır"
                description="Pro planda AI destekli talep yönetimi, daha yoğun kullanım, kanal işleme akışı ve operasyon ekibi için hızlandırılmış rezervasyon onay sistemi açılır."
              />
            </div>
          ) : null}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel id="ai-assistant-testing">
          <div className="section-title">AI Operasyon Asistanı</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Mesajı yapıştır, talebi önizle</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Müşteriden gelen bir WhatsApp, Instagram veya web mesajını buraya yapıştırın. Sistem önce {industry.requestLabel.toLocaleLowerCase("tr-TR")} bilgisini çıkarır, sonra siz onay verirsiniz.
          </p>

          <div className="mt-6">
            {entitlement.isDemo ? (
              <LockedAction
                fullWidth
                href="/billing?upgrade=ai-assistant"
                title="AI destekli talep yönetimi Pro ile açılır"
                description="Demo modunda sistemi inceleyebilirsiniz. Pro planında AI mesaj çözümleme, daha yoğun kullanım ve gerçek operasyon akışı açılır."
              />
            ) : (
              <AiAssistantComposer />
            )}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Paylaşılabilir Rezervasyon Linki</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">QR ve bio bağlantısı hazır</h2>
          <p className="mt-3 text-sm leading-6 text-sage">
            Bu alan yalnızca paylaşmanız gereken müşteri bağlantısını gösterir. Instagram bio, WhatsApp profil ve Google Business için kullanabilirsiniz.
          </p>

          <details className="mt-6 rounded-[28px] border border-[color:var(--border)] bg-white/90 p-5 group" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-moss">Paylaşım kartı</div>
                <div className="mt-2 text-lg font-semibold text-ink">Talep sayfasını aç</div>
                <div className="mt-2 text-sm text-sage">Tıklayınca QR kod ve sosyal medya biyografisine koyacağınız bağlantı görünür.</div>
              </div>
              <div className="rounded-full bg-[color:var(--bg-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-moss transition group-open:bg-emerald-100 group-open:text-emerald-800">
                Açık
              </div>
            </summary>

            <div className="mt-5 grid gap-4 lg:grid-cols-[200px_1fr]">
              <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4">
                <Image
                  src={qrUrl}
                  alt="Rezervasyon bağlantısı QR kodu"
                  width={160}
                  height={160}
                  className="mx-auto h-[160px] w-[160px] rounded-2xl border border-[color:var(--border)] bg-white p-2"
                />
                <div className="mt-3 text-center text-xs uppercase tracking-[0.24em] text-moss">QR ile paylaş</div>
                <div className="mt-2 text-center text-sm leading-6 text-sage">Bio, profil, masaüstü kartı veya vitrin için hazır.</div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-[color:var(--border)] bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-moss">Bio / profil bağlantısı</div>
                  <div className="mt-3 break-all rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 font-medium text-ink">{publicReservationLink}</div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a href={publicReservationLink} target="_blank" rel="noreferrer" className="btn-primary">
                        Bağlantıyı Aç
                      </a>
                      <a href="#ai-assistant-testing" className="btn-secondary">
                        AI Asistanı Aç
                      </a>
                    </div>
                  </div>

                <div className="rounded-[24px] border border-[color:var(--border)] bg-white p-4 text-sm leading-6 text-sage">
                  Müşteri bu linkten yalnızca talep bırakır. Talep <span className="font-semibold text-ink">Rezervasyonlar &gt; Kanal Talepleri</span> alanına düşer ve ekip onayından sonra ana kayıt akışına taşınır.
                </div>
              </div>
            </div>
          </details>
        </Panel>
      </section>
    </div>
  );
}
