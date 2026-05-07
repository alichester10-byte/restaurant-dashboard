import { UserRole } from "@prisma/client";
import { LockedAction } from "@/components/demo/locked-action";
import { AiAssistantComposer } from "@/components/integrations/ai-assistant-composer";
import { IntegrationQueryFeedback } from "@/components/integrations/integration-query-feedback";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireBusinessAccess } from "@/lib/auth";
import { getAppBaseUrl, getBusinessEntitlement } from "@/lib/billing";
import { getIntegrationsPageDataSafe } from "@/lib/data";

const roadmapCards = [
  {
    title: "WhatsApp Business",
    status: "Yakında aktif",
    body: "Meta onayı tamamlandığında restoran sahibi kendi panelinden WhatsApp hesabını bağlayabilecek. Gelen mesajlar rezervasyon talebi olarak bekleyen kuyruğa düşecek."
  },
  {
    title: "Instagram DM",
    status: "Meta onayı bekleniyor",
    body: "Instagram Professional hesaplarından gelen DM'ler, Meta review tamamlandıktan sonra doğrudan Kanal Talepleri akışına taşınacak."
  },
  {
    title: "Website Widget",
    status: "Canlı kullanıma hazır",
    body: "Widget kodunu sitenize ekleyerek rezervasyon talebini doğrudan Limon Masa akışına alabilirsiniz. Son onay yine restoran ekibindedir."
  },
  {
    title: "AI Reservation Assistant",
    status: "Panel içinde hazır",
    body: "AI operasyon asistanı müşteri mesajlarını talebe dönüştürür, eksik alanları bulur ve rezervasyon ekibine düzenli bir ön izleme sunar."
  }
];

const steps = [
  "Müşteri WhatsApp, Instagram, web formu veya AI destekli sohbet üzerinden mesaj bırakır.",
  "Sistem isim, telefon, tarih, saat ve kişi sayısını çıkarır.",
  "Talep Rezervasyonlar > Kanal Talepleri alanına düşer.",
  "Restoran ekibi talebi inceler, onaylar veya reddeder.",
  "Onaylanan kayıt gerçek rezervasyona dönüşür."
];

const afterApproval = [
  "WhatsApp ve Instagram hesapları işletme sahibi tarafından panel içinden bağlanabilecek.",
  "Gelen DM ve mesajlar otomatik olarak AI ile çözümlenecek.",
  "Mesaj akışları bekleyen talepler olarak tek kuyrukta toplanacak.",
  "Operasyon ekibi tek tıkla onay / red verecek.",
  "Tüm kanal performansı raporlara yansıyacak."
];

const nowAvailable = [
  "Website rezervasyon talep formu",
  "Public reservation page",
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
  const publicReservationLink = `${getAppBaseUrl()}/r/${session.user.business.slug}`;
  const widgetScript = `<iframe src="${publicReservationLink}?embed=1" title="Limon Masa Reservation Widget" style="width:100%;min-height:640px;border:0;border-radius:24px;"></iframe>`;

  return (
    <div className="space-y-6">
      <AppHeader
        title="Rezervasyon Kanalları"
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
      </Panel>

      <section className="grid gap-6 xl:grid-cols-4">
        {roadmapCards.map((card) => (
          <Panel key={card.title}>
            <div className="section-title">{card.status}</div>
            <h3 className="mt-2 text-xl font-semibold text-ink">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-sage">{card.body}</p>
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
          <div className="section-title">AI Reservation Assistant</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Mesajı yapıştır, talebi önizle</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Müşteriden gelen bir WhatsApp, Instagram veya web mesajını buraya yapıştırın. Sistem önce rezervasyon talebini çıkarır, sonra siz onay verirsiniz.
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
          <div className="section-title">Website Widget</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Şimdi canlı kullanabilirsiniz</h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm leading-6 text-sage">
              Website Widget, public rezervasyon talep sayfanızı sitenize gömmek için hazır. Müşteri rezervasyonu kesinleştirmez; yalnızca talep bırakır.
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm leading-6 text-sage">
              Bu bağlantıyı doğrudan paylaşabilirsiniz:
              <div className="mt-3 break-all rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 font-medium text-ink">{publicReservationLink}</div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm leading-6 text-sage">
              Sitene gömülecek örnek widget kodu:
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-[color:var(--bg-strong)] p-4 text-xs leading-6 text-ink">{widgetScript}</pre>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm leading-6 text-sage">
              Tüm web talepleri <span className="font-semibold text-ink">Rezervasyonlar &gt; Kanal Talepleri</span> alanında toplanır. Ekip onay verdikten sonra gerçek rezervasyona dönüşür.
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}
