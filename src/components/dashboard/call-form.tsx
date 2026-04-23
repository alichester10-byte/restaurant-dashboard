import { CallOutcome } from "@prisma/client";
import { createCallAction } from "@/actions/dashboard-actions";
import { LockedAction } from "@/components/demo/locked-action";
import { callOutcomeLabels } from "@/lib/constants";

export function CallForm({ locked = false }: { locked?: boolean }) {
  if (locked) {
    return (
      <LockedAction
        fullWidth
        href="/billing?upgrade=calls"
        title="Yeni çağrı kaydı Pro ile açılır"
        description="Demo modunda çağrı performansını inceleyebilirsiniz. Yeni çağrı eklemek ve ekibe aktarmak için Pro planını etkinleştirin."
      />
    );
  }

  return (
    <form action={createCallAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value="/dashboard" />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Arayan</span>
          <input className="field" name="callerName" placeholder="Misafir adı" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Telefon</span>
          <input className="field" name="phone" required placeholder="+90 5xx xxx xx xx" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Çağrı Sonucu</span>
          <select className="field" name="outcome" defaultValue={CallOutcome.ANSWERED}>
            {Object.values(CallOutcome).map((outcome) => (
              <option key={outcome} value={outcome}>
                {callOutcomeLabels[outcome]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Süre (sn)</span>
          <input className="field" type="number" name="durationSeconds" defaultValue={120} min={0} />
        </label>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Not</span>
        <textarea className="field min-h-24" name="notes" placeholder="Çağrı özeti, özel istek, takip notu..." />
      </label>
      <button className="btn-secondary w-full" type="submit">
        Çağrıyı Kaydet
      </button>
    </form>
  );
}
