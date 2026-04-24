import { ReservationRequestStatus, UserRole } from "@prisma/client";
import { reviewReservationRequestAction } from "@/actions/integration-actions";
import { LockedAction } from "@/components/demo/locked-action";
import { AiAssistantComposer } from "@/components/integrations/ai-assistant-composer";
import { IntegrationCardGrid } from "@/components/integrations/integration-card-grid";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { requireBusinessAccess } from "@/lib/auth";
import { getAppBaseUrl, getBusinessEntitlement } from "@/lib/billing";
import { reservationRequestStatusLabels, reservationSourceLabels } from "@/lib/constants";
import { getIntegrationsPageData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

function RequestBadge({ value }: { value: ReservationRequestStatus }) {
  const tone =
    value === ReservationRequestStatus.APPROVED
      ? "bg-emerald-100 text-emerald-800"
      : value === ReservationRequestStatus.REJECTED
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-800";

  return <span className={`badge ${tone}`}>{reservationRequestStatusLabels[value]}</span>;
}

function ConfidenceBadge({ score }: { score: number | null }) {
  const value = Math.round((score ?? 0) * 100);
  const tone = value >= 75 ? "bg-emerald-100 text-emerald-800" : value >= 45 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700";

  return <span className={`badge ${tone}`}>Güven %{value}</span>;
}

export default async function IntegrationsPage({
  searchParams
}: {
  searchParams?: { configured?: string; saved?: string; error?: string };
}) {
  const session = await requireBusinessAccess({
    roles: [UserRole.BUSINESS_ADMIN, UserRole.STAFF]
  });
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const data = await getIntegrationsPageData(session.user.businessId);

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

      {(searchParams?.configured || searchParams?.saved) ? (
        <Panel className="border-emerald-200 bg-emerald-50/80">
          <div className="section-title text-emerald-700">Kanal Güncellendi</div>
          <p className="mt-2 text-sm leading-6 text-emerald-700">
            {searchParams.saved === "approved"
              ? "Bekleyen talep onaylanarak rezervasyona dönüştürüldü."
              : searchParams.saved === "rejected"
                ? "Talep reddedildi ve nedeni kaydedildi."
                : searchParams.saved === "created"
                  ? "Mesaj AI asistanı tarafından çözümelendi ve onay bekleyen talep olarak eklendi."
                : "Bağlantı akışı yapılandırma aşamasına alındı."}
          </p>
        </Panel>
      ) : null}

      <IntegrationCardGrid cards={data.cards} businessSlug={session.user.business.slug} baseUrl={getAppBaseUrl()} />

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
            <div className="section-title">Bekleyen Talepler</div>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Mesajdan rezervasyona dönüşen talepler</h2>
            <p className="mt-2 text-sm leading-6 text-sage">
              Tüm dış kanal talepleri önce onay bekleyen istek olarak düşer. Ekip onayı olmadan canlı rezervasyon oluşmaz.
            </p>

            <div className="mt-6 space-y-4">
              {data.pendingRequests.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/80 p-6 text-sm leading-6 text-sage">
                  Test etmek için yukarıya bir mesaj yazın.
                </div>
              ) : (
                data.pendingRequests.map((request) => (
                  <div key={request.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-lg font-semibold text-ink">{request.guestName}</div>
                          <RequestBadge value={request.status} />
                          <ConfidenceBadge score={request.confidenceScore} />
                        </div>
                        <div className="mt-2 text-sm text-sage">
                          {reservationSourceLabels[request.source]} • {request.guestPhone ?? "Telefon bekleniyor"} • {formatDateTime(request.createdAt)}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">İsim</div>
                            <div className="mt-1">{request.guestName}</div>
                          </div>
                          <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">Telefon</div>
                            <div className="mt-1">{request.guestPhone ?? "Belirlenemedi"}</div>
                          </div>
                          <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">Kaynak</div>
                            <div className="mt-1">{reservationSourceLabels[request.source]}</div>
                          </div>
                          <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">Tarih</div>
                            <div className="mt-1">{request.requestedDate ?? "Belirlenemedi"}</div>
                          </div>
                          <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">Saat</div>
                            <div className="mt-1">{request.requestedTime ?? "Belirlenemedi"}</div>
                          </div>
                          <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">Kişi Sayısı</div>
                            <div className="mt-1">{request.guestCount ?? "-"}</div>
                          </div>
                          <div className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage md:col-span-2 xl:col-span-3">
                            <div className="font-semibold text-ink">Notlar</div>
                            <div className="mt-1">{request.notes ?? request.rawMessage ?? "Not eklenmedi"}</div>
                          </div>
                        </div>
                        <div className="mt-3 rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
                          {request.rawMessage ?? request.notes ?? "Mesaj içeriği yok"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(244,239,227,0.92)_100%)] px-4 py-4 text-sm">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">AI Önerisi</div>
                        <div className="mt-3 flex items-center gap-2">
                          <ConfidenceBadge score={request.confidenceScore} />
                        </div>
                        <p className="mt-3 max-w-[14rem] leading-6 text-sage">
                          Düşük güvenli taleplerde alanları düzeltip ardından onaylamanız önerilir.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                      <form action={reviewReservationRequestAction} className="space-y-3">
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="decision" value={ReservationRequestStatus.APPROVED} />
                        <input type="hidden" name="redirectTo" value="/integrations" />
                        <div className="grid gap-3 md:grid-cols-2">
                          <input className="field" name="guestName" defaultValue={request.guestName} placeholder="Misafir adı" />
                          <input className="field" name="guestPhone" defaultValue={request.guestPhone ?? ""} placeholder="Telefon" />
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          <input className="field" name="requestedDate" type="date" defaultValue={request.requestedDate ?? ""} />
                          <input className="field" name="requestedTime" type="time" defaultValue={request.requestedTime ?? ""} />
                          <input className="field" name="guestCount" type="number" min={1} max={20} defaultValue={request.guestCount ?? 2} />
                        </div>
                        <textarea className="field min-h-24" name="notes" defaultValue={request.notes ?? request.rawMessage ?? ""} placeholder="Rezervasyon notu" />
                        <input className="field" name="reason" placeholder="İsteğe bağlı onay notu" />
                        <FormSubmitButton className="w-full" idleLabel="Onayla ve Rezervasyona Dönüştür" pendingLabel="Onaylanıyor..." />
                      </form>
                      <form action={reviewReservationRequestAction} className="space-y-3">
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="decision" value={ReservationRequestStatus.REJECTED} />
                        <input type="hidden" name="redirectTo" value="/integrations" />
                        <input type="hidden" name="guestName" value={request.guestName} />
                        <input type="hidden" name="guestPhone" value={request.guestPhone ?? ""} />
                        <input type="hidden" name="requestedDate" value={request.requestedDate ?? ""} />
                        <input type="hidden" name="requestedTime" value={request.requestedTime ?? ""} />
                        <input type="hidden" name="guestCount" value={request.guestCount ?? 2} />
                        <input type="hidden" name="notes" value={request.notes ?? request.rawMessage ?? ""} />
                        <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
                          İsterseniz sol tarafta alanları düzelttikten sonra onaylayın. Uygun değilse reddedip nedeni kaydedin.
                        </div>
                        <input className="field" name="reason" placeholder="Reddetme nedeni" />
                        <FormSubmitButton className="w-full" variant="danger" idleLabel="Reddet" pendingLabel="Reddediliyor..." />
                      </form>
                    </div>
                  </div>
                ))
              )}
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
