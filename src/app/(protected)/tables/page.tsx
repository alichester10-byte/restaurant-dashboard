import Link from "next/link";
import { TableStatus } from "@prisma/client";
import { assignReservationToTableAction, updateTableStatusAction } from "@/actions/reservation-actions";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { LockedAction } from "@/components/demo/locked-action";
import { AppHeader } from "@/components/layout/app-header";
import { TableForm } from "@/components/tables/table-form";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireBusinessUser } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { tableAreaLabels, tableShapeLabels, tableStatusLabels } from "@/lib/constants";
import { getTablesPageData } from "@/lib/data";
import { getIndustryConfig } from "@/lib/industry-config";
import { formatDateTime } from "@/lib/utils";

export default async function TablesPage({
  searchParams
}: {
  searchParams: { tableId?: string; saved?: string; error?: string; create?: string };
}) {
  const session = await requireBusinessUser();
  const data = await getTablesPageData(session.user.businessId, searchParams.tableId);
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const industry = getIndustryConfig(session.user.business.businessType);
  const feedback =
    searchParams.saved === "created"
      ? `Yeni ${industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")} eklendi.`
      : searchParams.saved === "updated"
        ? `${industry.primaryResourceLabel} bilgileri güncellendi.`
        : searchParams.saved === "archived"
          ? `${industry.primaryResourceLabel} arşive taşındı.`
          : searchParams.error
            ? `${industry.primaryResourceLabel} işlemi tamamlanamadı. Alanları kontrol edip tekrar deneyin.`
            : null;

  return (
    <div className="space-y-6">
      <AppHeader
        title={industry.resourceBoardTitle}
        subtitle={`${industry.primaryResourceLabelPlural} görünümünü tek ekranda yönetin ve ${industry.reservationLabelPlural.toLocaleLowerCase("tr-TR")} doğru kapasiteye atayın.`}
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      {entitlement.isDemo ? (
        <DemoModeBanner
          title={`${industry.primaryResourceLabelPlural} görünümünü canlı gibi görüntüleyin.`}
          description={`Demo modunda tüm ${industry.primaryResourceLabelPlural.toLocaleLowerCase("tr-TR")} durumlarını ve önerilen eşleşmeleri inceleyebilirsiniz. Durum güncelleme ve atama akışları Pro ile açılır.`}
          href="/billing?upgrade=tables"
        />
      ) : null}

      {feedback ? (
        <Panel className={searchParams.error ? "border-rose-200 bg-rose-50/80" : "border-emerald-200 bg-emerald-50/80"}>
          <div className={`section-title ${searchParams.error ? "text-rose-600" : "text-emerald-700"}`}>
            {searchParams.error ? "İşlem Başarısız" : `${industry.primaryResourceLabel} Güncellendi`}
          </div>
          <p className={`mt-2 text-sm leading-6 ${searchParams.error ? "text-rose-700" : "text-emerald-700"}`}>{feedback}</p>
        </Panel>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Panel><div className="text-sm text-sage">Müsait</div><div className="mt-2 text-3xl font-bold">{data.summary.empty}</div><div className="mt-2 text-sm text-sage">Hemen atamaya uygun kaynaklar</div></Panel>
        <Panel><div className="text-sm text-sage">Dolu</div><div className="mt-2 text-3xl font-bold">{data.summary.occupied}</div><div className="mt-2 text-sm text-sage">Aktif kayıt taşıyan kaynaklar</div></Panel>
        <Panel><div className="text-sm text-sage">Ayrılmış</div><div className="mt-2 text-3xl font-bold">{data.summary.reserved}</div><div className="mt-2 text-sm text-sage">Yaklaşan kayıt için bloklu</div></Panel>
        <Panel><div className="text-sm text-sage">Pasif / Bakım</div><div className="mt-2 text-3xl font-bold">{data.summary.maintenance}</div><div className="mt-2 text-sm text-sage">Geçici olarak kullanıma kapalı</div></Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="section-title">Kaynak Panosu</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Canlı {industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")} görünümü</h2>
            </div>
            {!entitlement.isDemo ? (
              <Link href="/tables?create=1" scroll={false} className="btn-secondary">
                Yeni {industry.primaryResourceLabel}
              </Link>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-sage">
            Konum, kapasite ve durum bilgisine göre tüm {industry.primaryResourceLabelPlural.toLocaleLowerCase("tr-TR")} tek ekranda yönetin.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.tables.map((table) => (
              <Link
                key={table.id}
                href={`/tables?tableId=${table.id}`}
                scroll={false}
                className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5 transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-sage">
                      {table.zone} • {tableAreaLabels[table.area]}
                    </div>
                    <div className="mt-1 text-xl font-semibold text-ink">{table.number}</div>
                    <div className="mt-1 text-sm text-sage">{table.label}</div>
                  </div>
                  <StatusBadge value={table.status} />
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div className="font-[family-name:var(--font-display)] text-4xl text-ink">{table.seatCapacity}</div>
                  <div className="text-sm text-sage">{tableShapeLabels[table.shape]}</div>
                </div>
                <div className="mt-4 text-sm text-sage">{table.notes || `${industry.primaryResourceLabel} planına operasyon notu eklenmedi.`}</div>
              </Link>
            ))}
          </div>
          {data.tables.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/80 p-6 text-sm leading-6 text-sage">
              Henüz {industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")} tanımlanmadı. Planı oluşturmak için ilk kaynağınızı ekleyin.
            </div>
          ) : null}
        </Panel>

        <Panel>
          {data.selectedTable ? (
            <>
              <div className="section-title">Seçili {industry.primaryResourceLabel}</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">
                {data.selectedTable.number} • {data.selectedTable.label}
              </h2>
              <div className="mt-4">
                <StatusBadge value={data.selectedTable.status} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white/80 p-4">
                  <div className="text-sm text-sage">Konum</div>
                  <div className="mt-2 font-semibold text-ink">{tableAreaLabels[data.selectedTable.area]}</div>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <div className="text-sm text-sage">{industry.primaryResourceLabel} tipi</div>
                  <div className="mt-2 font-semibold text-ink">{tableShapeLabels[data.selectedTable.shape]}</div>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <div className="text-sm text-sage">Kapasite</div>
                  <div className="mt-2 font-semibold text-ink">{data.selectedTable.seatCapacity} kişi</div>
                </div>
              </div>

              {entitlement.isDemo ? (
                <div className="mt-6">
                  <LockedAction
                    fullWidth
                    href="/billing?upgrade=table-status"
                    title={`${industry.primaryResourceLabel} durumu güncelleme Pro ile açılır`}
                    description={`${industry.primaryResourceLabelPlural} durumlarını değiştirmek ve operasyon akışını canlı yönetmek için Pro planına geçin.`}
                  />
                </div>
              ) : (
                <form action={updateTableStatusAction} className="mt-6 space-y-4">
                  <input type="hidden" name="tableId" value={data.selectedTable.id} />
                  <input type="hidden" name="redirectTo" value={`/tables?tableId=${data.selectedTable.id}`} />
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink">{industry.primaryResourceLabel} Durumu</span>
                    <select className="field" name="status" defaultValue={data.selectedTable.status}>
                      {Object.values(TableStatus).map((status) => (
                        <option key={status} value={status}>
                          {tableStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn-secondary w-full" type="submit">
                    Durumu Güncelle
                  </button>
                </form>
              )}

              <div className="mt-8">
                <div className="text-sm font-semibold text-ink">{industry.primaryResourceLabel} {industry.reservationLabelPlural}</div>
                <div className="mt-3 space-y-3">
                  {data.selectedTable.reservations.map((reservation) => (
                    <div key={reservation.id} className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4">
                      <div className="font-semibold text-ink">{reservation.guestName}</div>
                      <div className="mt-1 text-sm text-sage">
                        {formatDateTime(reservation.startAt)} • {reservation.guestCount} kişi
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {entitlement.isDemo ? (
                <div className="mt-8">
                  <LockedAction
                    fullWidth
                    href="/billing?upgrade=table-assign"
                    title={`${industry.reservationLabel} atama akışı Pro ile açılır`}
                    description={`Bekleyen ${industry.reservationLabelPlural.toLocaleLowerCase("tr-TR")} ${industry.primaryResourceLabelPlural.toLocaleLowerCase("tr-TR")} ile eşlemek için Pro planını etkinleştirin.`}
                  />
                </div>
              ) : (
                <form action={assignReservationToTableAction} className="mt-8 space-y-4">
                  <input type="hidden" name="tableId" value={data.selectedTable.id} />
                  <input type="hidden" name="redirectTo" value={`/tables?tableId=${data.selectedTable.id}`} />
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink">{industry.reservationLabel} Ata</span>
                    <select className="field" name="reservationId" defaultValue="">
                      <option value="" disabled>
                        {industry.reservationLabel} seçin
                      </option>
                      {data.reservations.map((reservation) => (
                        <option key={reservation.id} value={reservation.id}>
                          {reservation.guestName} • {formatDateTime(reservation.startAt)} • {reservation.guestCount} kişi
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn-primary w-full" type="submit">
                    {industry.reservationLabel}u {industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")} ata
                  </button>
                </form>
              )}

              <div className="mt-8 border-t border-[color:var(--border)] pt-8">
                <div className="section-title">{industry.primaryResourceLabel} Ayarları</div>
                <h3 className="mt-2 text-xl font-semibold text-ink">Seçili {industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")} kaydını güncelleyin</h3>
                <p className="mt-2 text-sm leading-6 text-sage">
                  Konum, kapasite, etiket ve operasyon notlarını tek yerden güncelleyebilirsiniz.
                </p>
                <div className="mt-6">
                  <TableForm
                    industry={industry}
                    locked={entitlement.isDemo}
                    table={{
                      id: data.selectedTable.id,
                      number: data.selectedTable.number,
                      label: data.selectedTable.label,
                      zone: data.selectedTable.zone,
                      area: data.selectedTable.area,
                      shape: data.selectedTable.shape,
                      seatCapacity: data.selectedTable.seatCapacity,
                      status: data.selectedTable.status,
                      notes: data.selectedTable.notes
                    }}
                  />
                </div>
              </div>
            </>
          ) : searchParams.create === "1" ? (
            <>
              <div className="section-title">Yeni {industry.primaryResourceLabel}</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Planınıza yeni {industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")} ekleyin</h2>
              <p className="mt-2 text-sm leading-6 text-sage">
                Kod, konum, kapasite ve tip bilgisiyle planınızı hızlıca büyütün.
              </p>
              <div className="mt-6">
                <TableForm locked={entitlement.isDemo} industry={industry} />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="section-title">Detay Paneli</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Bir {industry.primaryResourceLabel.toLocaleLowerCase("tr-TR")} seçin</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-sage">
                Sağ panelden durum, atamalar ve detay düzenleme akışlarını yönetebilir veya yeni kaynak ekleyebilirsiniz.
              </p>
              {!entitlement.isDemo ? (
                <Link href="/tables?create=1" scroll={false} className="btn-primary mt-6">
                  İlk {industry.primaryResourceLabel}ı Oluştur
                </Link>
              ) : null}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
