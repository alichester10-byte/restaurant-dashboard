import { TableArea, TableShape, TableStatus } from "@prisma/client";
import { archiveTableAction, saveTableAction } from "@/actions/table-actions";
import { LockedAction } from "@/components/demo/locked-action";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { tableAreaLabels, tableShapeLabels, tableStatusLabels } from "@/lib/constants";
import type { IndustryConfig } from "@/lib/industry-config";

export function TableForm({
  table,
  locked = false,
  industry
}: {
  table?: {
    id: string;
    number: string;
    label: string;
    zone: string;
    area: TableArea;
    shape: TableShape;
    seatCapacity: number;
    status: TableStatus;
    notes: string | null;
  } | null;
  locked?: boolean;
  industry: IndustryConfig;
}) {
  if (locked) {
    return (
      <LockedAction
        fullWidth
        href="/billing?upgrade=tables"
        title={`${industry.primaryResourceLabel} yönetimi Pro planıyla açılır`}
        description={`Demo modunda ${industry.primaryResourceLabelPlural.toLocaleLowerCase("tr-TR")} yapısını inceleyebilirsiniz. Oluşturma, düzenleme ve arşivleme akışları için Pro planına geçin.`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <form action={saveTableAction} className="space-y-4">
        <input type="hidden" name="id" defaultValue={table?.id} />
        <input type="hidden" name="redirectTo" value={table ? `/tables?tableId=${table.id}` : "/tables"} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">{industry.primaryResourceLabel} Kodu</span>
            <input className="field" name="number" defaultValue={table?.number} placeholder="T12" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Görünür Etiket</span>
            <input className="field" name="label" defaultValue={table?.label} placeholder="Cam Önü 2" required />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Salon / Bölge</span>
            <input className="field" name="zone" defaultValue={table?.zone} placeholder="İç Salon" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Kapasite</span>
            <input className="field" type="number" name="seatCapacity" min={1} max={20} defaultValue={table?.seatCapacity ?? 4} required />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Konum</span>
            <select className="field" name="area" defaultValue={table?.area ?? TableArea.MAIN_DINING}>
              {Object.values(TableArea).map((value) => (
                <option key={value} value={value}>
                  {tableAreaLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">{industry.primaryResourceLabel} Tipi</span>
            <select className="field" name="shape" defaultValue={table?.shape ?? TableShape.RECTANGLE}>
              {Object.values(TableShape).map((value) => (
                <option key={value} value={value}>
                  {tableShapeLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Durum</span>
            <select className="field" name="status" defaultValue={table?.status ?? TableStatus.EMPTY}>
              {Object.values(TableStatus).map((value) => (
                <option key={value} value={value}>
                  {tableStatusLabels[value]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Özel Not</span>
          <textarea className="field min-h-24" name="notes" defaultValue={table?.notes ?? ""} placeholder="Sessiz bölüm, çocuk sandalyesine yakın, VIP servis önceliği..." />
        </label>

        <FormSubmitButton
          className="w-full"
          idleLabel={table ? `${industry.primaryResourceLabel} Güncelle` : `Yeni ${industry.primaryResourceLabel} Oluştur`}
          pendingLabel={table ? `${industry.primaryResourceLabel} Güncelleniyor...` : `${industry.primaryResourceLabel} Oluşturuluyor...`}
        />
      </form>

      {table ? (
        <form action={archiveTableAction}>
          <input type="hidden" name="tableId" value={table.id} />
          <input type="hidden" name="redirectTo" value={`/tables?tableId=${table.id}`} />
          <FormSubmitButton className="w-full" variant="danger" idleLabel={`${industry.primaryResourceLabel} Arşivle`} pendingLabel="Arşivleniyor..." />
        </form>
      ) : null}
    </div>
  );
}
