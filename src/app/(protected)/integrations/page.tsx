import { ReservationRequestStatus, UserRole } from "@prisma/client";
import { configureIntegrationAction, reviewReservationRequestAction } from "@/actions/integration-actions";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireBusinessAccess } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { integrationDescriptions } from "@/lib/integrations";
import { integrationProviderLabels, integrationStatusLabels, reservationRequestStatusLabels, reservationSourceLabels } from "@/lib/constants";
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
                : "Bağlantı akışı yapılandırma aşamasına alındı."}
          </p>
        </Panel>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-5">
        {data.cards.map((item) => {
          const copy = integrationDescriptions[item.provider];
          return (
            <Panel key={item.provider} className="flex h-full flex-col">
              <div className="section-title">{copy.title}</div>
              <div className="mt-3 text-lg font-semibold text-ink">{integrationProviderLabels[item.provider]}</div>
              <div className="mt-2 inline-flex">
                <StatusBadge value={item.connection.status} />
              </div>
              <p className="mt-4 text-sm leading-6 text-sage">{copy.description}</p>
              <div className="mt-auto pt-5">
                <form action={configureIntegrationAction}>
                  <input type="hidden" name="provider" value={item.provider} />
                  <button className="btn-secondary w-full" type="submit">
                    {item.connection.status === "CONNECTED" ? "Bağlantıyı Gör" : copy.buttonLabel}
                  </button>
                </form>
              </div>
            </Panel>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="section-title">Bekleyen Talepler</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Mesajdan rezervasyona dönüşen talepler</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Tüm dış kanal talepleri önce onay bekleyen istek olarak düşer. Ekip onayı olmadan canlı rezervasyon oluşmaz.
          </p>

          <div className="mt-6 space-y-4">
            {data.pendingRequests.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/80 p-6 text-sm leading-6 text-sage">
                Henüz bekleyen dış kanal talebi yok. WhatsApp, Instagram veya web widget akışı bağlandığında talepler burada görünecek.
              </div>
            ) : (
              data.pendingRequests.map((request) => (
                <div key={request.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-ink">{request.guestName}</div>
                        <RequestBadge value={request.status} />
                      </div>
                      <div className="mt-2 text-sm text-sage">
                        {reservationSourceLabels[request.source]} • {request.guestPhone ?? "Telefon bekleniyor"} • {formatDateTime(request.createdAt)}
                      </div>
                      <div className="mt-2 text-sm text-sage">
                        {request.requestedDate ?? "Tarih yok"} • {request.requestedTime ?? "Saat yok"} • {request.guestCount ?? "-"} kişi
                      </div>
                      <div className="mt-3 rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
                        {request.rawMessage ?? request.notes ?? "Mesaj içeriği yok"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] px-4 py-3 text-sm">
                      AI güven skoru: %{Math.round((request.confidenceScore ?? 0) * 100)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <form action={reviewReservationRequestAction} className="space-y-3">
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value={ReservationRequestStatus.APPROVED} />
                      <input type="hidden" name="redirectTo" value="/integrations" />
                      <input className="field" name="reason" placeholder="İsteğe bağlı onay notu" />
                      <FormSubmitButton className="w-full" idleLabel="Onayla ve Rezervasyona Dönüştür" pendingLabel="Onaylanıyor..." />
                    </form>
                    <form action={reviewReservationRequestAction} className="space-y-3">
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="decision" value={ReservationRequestStatus.REJECTED} />
                      <input type="hidden" name="redirectTo" value="/integrations" />
                      <input className="field" name="reason" placeholder="Reddetme nedeni" />
                      <FormSubmitButton className="w-full" variant="danger" idleLabel="Reddet" pendingLabel="Reddediliyor..." />
                    </form>
                  </div>
                </div>
              ))
            )}
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
