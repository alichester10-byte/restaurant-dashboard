import Link from "next/link";
import { ReservationStatus } from "@prisma/client";
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
import { getReservationsPageData } from "@/lib/data";
import { formatDateTime, formatPhone } from "@/lib/utils";

const noShowLockedStatuses = new Set<ReservationStatus>([
  ReservationStatus.NO_SHOW,
  ReservationStatus.CANCELLED,
  ReservationStatus.COMPLETED
]);

export default async function ReservationsPage({
  searchParams
}: {
  searchParams: { reservationId?: string; saved?: string; error?: string; compose?: string };
}) {
  const session = await requireBusinessUser();
  const data = await getReservationsPageData(session.user.businessId, searchParams.reservationId);
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
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
        title="Rezervasyon Yönetimi"
        subtitle="Rezervasyonları oluşturun, güncelleyin, onaylayın ve servis akışını kontrol altında tutun."
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
              <div className="section-title">Yaklaşan ve Geçmiş Kayıtlar</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Rezervasyon listesi</h2>
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
                      {formatDateTime(reservation.startAt)} • {reservation.guestCount} kişi • {reservation.assignedTable?.number ?? "Masa bekliyor"}
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
