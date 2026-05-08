import Link from "next/link";
import { ReservationRequestStatus, ReservationStatus } from "@prisma/client";
import { reviewReservationRequestAction } from "@/actions/integration-actions";
import { updateReservationStatusAction } from "@/actions/reservation-actions";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { LockedAction } from "@/components/demo/locked-action";
import { UpgradeButton } from "@/components/demo/upgrade-button";
import { ReservationEditLink } from "@/components/reservations/reservation-edit-link";
import { AppHeader } from "@/components/layout/app-header";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { ReservationPrimaryCta } from "@/components/reservations/reservation-primary-cta";
import { Panel } from "@/components/ui/panel";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireBusinessUser } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { reservationRequestStatusLabels, reservationSourceLabels } from "@/lib/constants";
import { getReservationsPageData } from "@/lib/data";
import { getIndustryConfig } from "@/lib/industry-config";
import { formatDateTime, formatPhone } from "@/lib/utils";

const noShowLockedStatuses = new Set<ReservationStatus>([
  ReservationStatus.NO_SHOW,
  ReservationStatus.CANCELLED,
  ReservationStatus.COMPLETED
]);

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

export default async function ReservationsPage({
  searchParams
}: {
  searchParams: { reservationId?: string; saved?: string; error?: string; compose?: string };
}) {
  const session = await requireBusinessUser();
  const data = await getReservationsPageData(session.user.businessId, searchParams.reservationId);
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const industry = getIndustryConfig(session.user.business.businessType);
  const feedback =
    searchParams.saved === "created"
      ? {
          tone: "success",
          title: "Rezervasyon oluşturuldu",
          description: "Yeni rezervasyon kaydı başarıyla eklendi."
        }
      : searchParams.saved === "updated"
        ? {
            tone: "success",
            title: "Rezervasyon güncellendi",
            description: "Seçili rezervasyon başarıyla güncellendi."
          }
        : searchParams.saved === "status"
          ? {
              tone: "success",
              title: "Rezervasyon durumu güncellendi",
              description: "Durum değişikliği yalnızca seçili kayıt için uygulandı."
            }
          : searchParams.saved === "approved"
            ? {
                tone: "success",
                title: "Kanal talebi onaylandı",
                description: "Talep gerçek rezervasyona dönüştürüldü ve ana rezervasyon listesine taşındı."
              }
            : searchParams.saved === "rejected"
              ? {
                  tone: "success",
                  title: "Kanal talebi reddedildi",
                  description: "Talep reddedildi ve onay bekleyen rezervasyon akışından çıkarıldı."
                }
          : searchParams.error
            ? {
                tone: "error",
                title: "Rezervasyon işlemi tamamlanamadı",
                description: "Lütfen form alanlarını kontrol edip tekrar deneyin."
              }
            : null;

  return (
    <div className="space-y-6">
      <AppHeader
        title={`${industry.reservationLabel} Yönetimi`}
        subtitle={`${industry.reservationLabelPlural} oluşturun, güncelleyin, onaylayın ve operasyon akışını kontrol altında tutun.`}
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      {entitlement.isDemo ? (
        <DemoModeBanner
          title="Rezervasyon akışını keşfedin, Pro ile aksiyona geçin."
          description="Demo modunda yaklaşan kayıtları, durumları ve masa atamalarını inceleyebilirsiniz. Yeni rezervasyon, onay, iptal ve düzenleme işlemleri Pro planıyla açılır."
          href="/billing?upgrade=reservations"
        />
      ) : null}

      {feedback ? (
        <Panel className={feedback.tone === "error" ? "border-rose-200 bg-rose-50/80" : "border-emerald-200 bg-emerald-50/80"}>
          <div className={`section-title ${feedback.tone === "error" ? "text-rose-600" : "text-emerald-700"}`}>{feedback.title}</div>
          <p className={`mt-2 text-sm leading-6 ${feedback.tone === "error" ? "text-rose-700" : "text-emerald-700"}`}>{feedback.description}</p>
        </Panel>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Onaylı {industry.reservationLabelPlural}</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Ana {industry.reservationLabel.toLocaleLowerCase("tr-TR")} listesi</h2>
            </div>
            <ReservationPrimaryCta locked={entitlement.isDemo} />
          </div>

          <div className="mt-6 space-y-3">
            {data.reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-lg font-semibold text-ink">{reservation.guestName}</div>
                      <StatusBadge value={reservation.status} />
                    </div>
                    <div className="mt-2 text-sm text-sage">
                      {formatDateTime(reservation.startAt)} • {reservation.guestCount} {industry.guestCountLabel.toLocaleLowerCase("tr-TR")} • {reservation.assignedTable?.number ?? `${industry.primaryResourceLabel} bekliyor`}
                    </div>
                    <div className="mt-1 text-sm text-sage">{formatPhone(reservation.guestPhone)}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {entitlement.isDemo ? (
                      <UpgradeButton
                        href="/billing?upgrade=reservations"
                        label="Pro ile Düzenle"
                        title="Bu özellik Pro planı gerektirir"
                        description="Rezervasyon düzenleme ve durum güncelleme akışları Pro ile açılır."
                      />
                    ) : (
                      <>
                        <ReservationEditLink reservationId={reservation.id} />

                        {reservation.status === ReservationStatus.PENDING ? (
                          <form action={updateReservationStatusAction}>
                            <input type="hidden" name="id" value={reservation.id} />
                            <input type="hidden" name="status" value={ReservationStatus.CONFIRMED} />
                            <input type="hidden" name="redirectTo" value="/reservations" />
                            <FormSubmitButton idleLabel="Onayla" pendingLabel="Kaydediliyor..." />
                          </form>
                        ) : null}

                        {(reservation.status === ReservationStatus.PENDING || reservation.status === ReservationStatus.CONFIRMED) ? (
                          <form action={updateReservationStatusAction}>
                            <input type="hidden" name="id" value={reservation.id} />
                            <input type="hidden" name="status" value={ReservationStatus.SEATED} />
                            <input type="hidden" name="redirectTo" value="/reservations" />
                            <FormSubmitButton variant="secondary" idleLabel="Karşılandı" pendingLabel="Kaydediliyor..." />
                          </form>
                        ) : null}

                        {(reservation.status === ReservationStatus.SEATED || reservation.status === ReservationStatus.CONFIRMED) ? (
                          <form action={updateReservationStatusAction}>
                            <input type="hidden" name="id" value={reservation.id} />
                            <input type="hidden" name="status" value={ReservationStatus.COMPLETED} />
                            <input type="hidden" name="redirectTo" value="/reservations" />
                            <FormSubmitButton variant="secondary" idleLabel="Tamamlandı" pendingLabel="Kaydediliyor..." />
                          </form>
                        ) : null}

                        {!noShowLockedStatuses.has(reservation.status) ? (
                          <form action={updateReservationStatusAction}>
                            <input type="hidden" name="id" value={reservation.id} />
                            <input type="hidden" name="status" value={ReservationStatus.NO_SHOW} />
                            <input type="hidden" name="redirectTo" value="/reservations" />
                            <FormSubmitButton variant="danger" idleLabel="No-show" pendingLabel="Kaydediliyor..." />
                          </form>
                        ) : null}

                        {reservation.status !== ReservationStatus.CANCELLED && reservation.status !== ReservationStatus.COMPLETED ? (
                          <form action={updateReservationStatusAction}>
                            <input type="hidden" name="id" value={reservation.id} />
                            <input type="hidden" name="status" value={ReservationStatus.CANCELLED} />
                            <input type="hidden" name="redirectTo" value="/reservations" />
                            <FormSubmitButton variant="danger" idleLabel="İptal Et" pendingLabel="Kaydediliyor..." />
                          </form>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-[color:var(--border)] pt-8">
            <div className="flex items-center justify-between gap-4">
              <div>
              <div className="section-title">{industry.channelRequestsLabel}</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Dış kanallardan gelen {industry.requestLabel.toLocaleLowerCase("tr-TR")} istekleri</h2>
                <p className="mt-2 text-sm leading-6 text-sage">
                  WhatsApp, Instagram, Google/Web, Website Widget ve AI Assistant kaynaklı talepler burada toplanır. İnsan onayı olmadan {industry.reservationLabel.toLocaleLowerCase("tr-TR")} kesinleşmez.
                </p>
              </div>
              <div className="badge bg-[color:var(--bg-strong)] text-ink">{data.channelRequests.filter((request) => request.status === ReservationRequestStatus.PENDING).length} bekleyen talep</div>
            </div>

            <div className="mt-6 space-y-4" id="channel-requests">
              {data.channelRequests.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/80 p-6 text-sm leading-6 text-sage">
                  Henüz dış kanallardan gelen talep yok. Yeni talepler WhatsApp, Instagram, web formu ve AI akışlarından geldikçe burada görünecek.
                </div>
              ) : (
                data.channelRequests.map((request) => (
                  <div key={request.id} className="rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(244,239,227,0.92)_100%)] p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-lg font-semibold text-ink">{request.guestName || "İsim bekleniyor"}</div>
                          <RequestBadge value={request.status} />
                          {request.confidenceScore !== null ? <ConfidenceBadge score={request.confidenceScore} /> : null}
                        </div>
                        <div className="mt-2 text-sm text-sage">
                          {reservationSourceLabels[request.source]} • {request.guestPhone ?? "Telefon bekleniyor"} • {formatDateTime(request.createdAt)}
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">Müşteri mesajı</div>
                            <div className="mt-1 line-clamp-4">{request.rawMessage ?? request.notes ?? "Mesaj içeriği yok"}</div>
                          </div>
                          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">Tarih</div>
                            <div className="mt-1">{request.requestedDate ?? "Belirlenemedi"}</div>
                          </div>
                          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">Saat</div>
                            <div className="mt-1">{request.requestedTime ?? "Belirlenemedi"}</div>
                          </div>
                          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">{industry.guestCountLabel}</div>
                            <div className="mt-1">{request.guestCount ?? "-"}</div>
                          </div>
                          {request.extractedData && typeof request.extractedData === "object" && "serviceType" in request.extractedData ? (
                            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                              <div className="font-semibold text-ink">{industry.serviceTypeLabel}</div>
                              <div className="mt-1">{String((request.extractedData as Record<string, unknown>).serviceType ?? "-")}</div>
                            </div>
                          ) : null}
                          {request.extractedData && typeof request.extractedData === "object" && "staffName" in request.extractedData ? (
                            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                              <div className="font-semibold text-ink">Ekip / Uzman</div>
                              <div className="mt-1">{String((request.extractedData as Record<string, unknown>).staffName ?? "-")}</div>
                            </div>
                          ) : null}
                          {request.extractedData && typeof request.extractedData === "object" && "resourceName" in request.extractedData ? (
                            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                              <div className="font-semibold text-ink">{industry.primaryResourceLabel}</div>
                              <div className="mt-1">{String((request.extractedData as Record<string, unknown>).resourceName ?? "-")}</div>
                            </div>
                          ) : null}
                          {request.extractedData && typeof request.extractedData === "object" && "endDate" in request.extractedData ? (
                            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                              <div className="font-semibold text-ink">Bitiş Tarihi</div>
                              <div className="mt-1">{String((request.extractedData as Record<string, unknown>).endDate ?? "-")}</div>
                            </div>
                          ) : null}
                          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">İsim / Telefon</div>
                            <div className="mt-1">{request.guestName || "İsim yok"} • {request.guestPhone ?? "Telefon yok"}</div>
                          </div>
                          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-sage">
                            <div className="font-semibold text-ink">Durum</div>
                            <div className="mt-1">{reservationRequestStatusLabels[request.status]}</div>
                          </div>
                        </div>

                        {request.notes ? (
                          <div className="mt-3 rounded-2xl bg-white/80 p-4 text-sm leading-6 text-sage">
                            <div className="font-semibold text-ink">Ek notlar</div>
                            <div className="mt-1">{request.notes}</div>
                          </div>
                        ) : null}

                        {request.status === ReservationRequestStatus.APPROVED && request.approvedReservationId ? (
                          <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            Talep onaylandı ve rezervasyona dönüştürüldü.
                            <Link className="ml-2 font-semibold underline" href={`/reservations?reservationId=${request.approvedReservationId}`}>
                              Rezervasyonu aç
                            </Link>
                          </div>
                        ) : null}

                        {request.status === ReservationRequestStatus.REJECTED ? (
                          <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {request.reviewReason ? `Reddetme nedeni: ${request.reviewReason}` : "Bu kanal talebi reddedildi."}
                          </div>
                        ) : null}
                      </div>

                      <div className="w-full max-w-[320px] rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm xl:shrink-0">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">Kaynak Özeti</div>
                        <div className="mt-3 space-y-2 text-sage">
                          <div><span className="font-semibold text-ink">Kaynak:</span> {reservationSourceLabels[request.source]}</div>
                          <div><span className="font-semibold text-ink">Confidence:</span> {request.confidenceScore !== null ? `%${Math.round(request.confidenceScore * 100)}` : "Yok"}</div>
                          <div><span className="font-semibold text-ink">Son durum:</span> {reservationRequestStatusLabels[request.status]}</div>
                        </div>
                      </div>
                    </div>

                    {request.status === ReservationRequestStatus.PENDING ? (
                      entitlement.isDemo ? (
                        <div className="mt-4">
                          <LockedAction
                            fullWidth
                            href="/billing?upgrade=channel-requests"
                            title="Kanal taleplerini işlemek için Pro gerekir"
                            description="Demo modunda gelen talepleri görüntüleyebilirsiniz. Onaylama, reddetme ve rezervasyona dönüştürme işlemleri Pro planıyla açılır."
                          />
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                          <form action={reviewReservationRequestAction} className="space-y-3">
                            <input type="hidden" name="requestId" value={request.id} />
                            <input type="hidden" name="decision" value={ReservationRequestStatus.APPROVED} />
                            <input type="hidden" name="redirectTo" value="/reservations#channel-requests" />
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
                            <input type="hidden" name="redirectTo" value="/reservations#channel-requests" />
                            <input type="hidden" name="guestName" value={request.guestName} />
                            <input type="hidden" name="guestPhone" value={request.guestPhone ?? ""} />
                            <input type="hidden" name="requestedDate" value={request.requestedDate ?? ""} />
                            <input type="hidden" name="requestedTime" value={request.requestedTime ?? ""} />
                            <input type="hidden" name="guestCount" value={request.guestCount ?? 2} />
                            <input type="hidden" name="notes" value={request.notes ?? request.rawMessage ?? ""} />
                            <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
                              Uygun olmayan veya eksik bilgili talepleri reddedebilir, nedeni ekip geçmişi için kaydedebilirsiniz.
                            </div>
                            <input className="field" name="reason" placeholder="Reddetme nedeni" />
                            <FormSubmitButton className="w-full" variant="danger" idleLabel="Reddet" pendingLabel="Reddediliyor..." />
                          </form>
                        </div>
                      )
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </Panel>

        <Panel className="scroll-mt-28" id="reservation-form-panel">
          <div className="section-title">{data.selectedReservation ? "Rezervasyon Düzenle" : "Yeni Rezervasyon"}</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            {data.selectedReservation ? "Detayları güncelleyin" : "Yeni kayıt oluşturun"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Sunucu tarafında doğrulanan form akışıyla müşteri, masa ve durum bilgisini aynı anda yönetin.
          </p>
          {data.selectedReservation ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white/80 p-4">
                <div className="text-sm text-sage">Misafir</div>
                <div className="mt-2 font-semibold text-ink">{data.selectedReservation.guestName}</div>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <div className="text-sm text-sage">Telefon</div>
                <div className="mt-2 font-semibold text-ink">{formatPhone(data.selectedReservation.guestPhone)}</div>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <div className="text-sm text-sage">Durum</div>
                <div className="mt-2 font-semibold text-ink">{formatDateTime(data.selectedReservation.startAt)}</div>
              </div>
            </div>
          ) : null}
          {data.selectedReservation && data.customerHistorySummary ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4">
                <div className="text-sm text-sage">Müşteri değeri</div>
                <div className="mt-2 text-lg font-semibold text-ink">{data.customerHistorySummary.valueLabel}</div>
                <p className="mt-2 text-sm leading-6 text-sage">Bu misafirin tamamlanan, iptal edilen ve no-show geçmişi anlık olarak hesaplanır.</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4">
                <div className="text-sm text-sage">Ziyaret Özeti</div>
                <div className="mt-2 text-lg font-semibold text-ink">{data.customerHistorySummary.totalVisits} toplam ziyaret</div>
                <div className="mt-2 text-sm text-sage">
                  {data.customerHistorySummary.completedReservations} tamamlandı • {data.customerHistorySummary.noShowCount} no-show • {data.customerHistorySummary.cancelledCount} iptal
                </div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4">
                <div className="text-sm text-sage">Hatırlatıcı Önizlemesi</div>
                <div className="mt-2 text-lg font-semibold text-ink">
                  {data.reminderSettings?.enabled ? `${data.reminderSettings.timingHours} saat önce` : "Hatırlatıcı kapalı"}
                </div>
                <div className="mt-2 text-sm text-sage">
                  {data.reminderSettings?.enabled
                    ? `Kanal: ${data.reminderSettings.channel} • Durum: ${data.selectedReservation.reminderStatus}`
                    : "Ayarlar sayfasından e-posta, WhatsApp veya SMS önizlemesini aktif edebilirsiniz."}
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-6">
            <ReservationForm
              key={data.selectedReservation?.id ?? (searchParams.compose ? "compose" : "new")}
              locked={entitlement.isDemo}
              businessType={session.user.business.businessType}
              tables={data.tables}
              reservation={data.selectedReservation
                ? {
                    id: data.selectedReservation.id,
                    guestName: data.selectedReservation.guestName,
                    guestPhone: data.selectedReservation.guestPhone,
                    startAt: data.selectedReservation.startAt,
                    guestCount: data.selectedReservation.guestCount,
                    status: data.selectedReservation.status,
                    source: data.selectedReservation.source,
                    assignedTableId: data.selectedReservation.assignedTableId,
                    occasion: data.selectedReservation.occasion,
                    notes: data.selectedReservation.notes
                  }
                : null}
            />
          </div>
          {entitlement.isDemo ? (
            <div className="mt-6">
              <LockedAction
                fullWidth
                href="/billing?upgrade=reservations-panel"
                title="Kaydetme işlemleri şu anda kilitli"
                description="Demo modunda form deneyimini görebilir, ancak gerçek rezervasyon verisi oluşturamaz veya güncelleyemezsiniz."
              />
            </div>
          ) : null}
        </Panel>
      </section>
    </div>
  );
}
