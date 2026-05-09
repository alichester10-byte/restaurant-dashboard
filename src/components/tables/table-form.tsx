import { TableArea, TableShape, TableStatus } from "@prisma/client";
import { archiveTableAction, saveTableAction } from "@/actions/table-actions";
import { LockedAction } from "@/components/demo/locked-action";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { tableAreaLabels, tableShapeLabels, tableStatusLabels } from "@/lib/constants";
import type { IndustryConfig } from "@/lib/industry-config";

function getResourceCodePlaceholder(industry: IndustryConfig) {
  if (industry.businessType === "RESTAURANT" || industry.businessType === "CAFE") {
    return "T12";
  }

  return `${industry.primaryResourceLabel.slice(0, 1).toUpperCase()}-01`;
}

function getResourceLabelPlaceholder(industry: IndustryConfig) {
  return industry.resourceExamples[0] ?? `${industry.primaryResourceLabel} Alanı`;
}

function getResourceZonePlaceholder(industry: IndustryConfig) {
  if (industry.businessType === "RESTAURANT" || industry.businessType === "CAFE") {
    return "İç Salon";
  }

  return "Ana Alan";
}

function getAreaDisplayLabel(label: string, industry: IndustryConfig) {
  if (industry.businessType === "RESTAURANT" || industry.businessType === "CAFE") {
    return label;
  }

  const normalized = label.trim().toLocaleLowerCase("tr-TR");
  if (normalized.includes("cam")) return "Ön Alan";
  if (normalized.includes("kapı")) return "Giriş";
  if (normalized.includes("bahçe") || normalized.includes("teras")) return "Dış Alan";
  if (normalized.includes("vip") || normalized.includes("özel")) return "Özel Alan";
  if (normalized.includes("bar")) return "Servis Alanı";
  return "Ana Alan";
}

function getShapeDisplayLabel(label: string, industry: IndustryConfig) {
  if (industry.businessType === "RESTAURANT" || industry.businessType === "CAFE") {
    return label;
  }

  const normalized = label.trim().toLocaleLowerCase("tr-TR");
  if (normalized.includes("yuvarlak")) return "Dairesel";
  if (normalized.includes("dikdörtgen")) return "Standart";
  if (normalized.includes("kare")) return "Kompakt";
  if (normalized.includes("booth")) return "Özel";
  if (normalized.includes("bar")) return "Servis";
  return "Standart";
}

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
            <input className="field" name="number" defaultValue={table?.number} placeholder={getResourceCodePlaceholder(industry)} required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Görünür Etiket</span>
            <input className="field" name="label" defaultValue={table?.label} placeholder={getResourceLabelPlaceholder(industry)} required />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Alan / Bölge</span>
            <input className="field" name="zone" defaultValue={table?.zone} placeholder={getResourceZonePlaceholder(industry)} required />
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
                  {getAreaDisplayLabel(tableAreaLabels[value], industry)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">{industry.primaryResourceLabel} Tipi</span>
            <select className="field" name="shape" defaultValue={table?.shape ?? TableShape.RECTANGLE}>
              {Object.values(TableShape).map((value) => (
                <option key={value} value={value}>
                  {getShapeDisplayLabel(tableShapeLabels[value], industry)}
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
