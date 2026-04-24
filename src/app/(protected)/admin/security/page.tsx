import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { getSecurityLogData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

export default async function SecurityPage() {
  const session = await requireSuperAdmin();
  const data = await getSecurityLogData();

  return (
    <div className="space-y-6">
      <AppHeader
        title="Güvenlik Merkezi"
        subtitle="Kimlik doğrulama, şüpheli etkinlik ve webhook güvenliği için son olayları izleyin."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Panel>
          <div className="text-sm text-sage">Başarısız giriş olayları</div>
          <div className="mt-3 text-3xl font-bold text-ink">
            {data.failedLogins.reduce((sum, item) => sum + item._count._all, 0)}
          </div>
        </Panel>
        <Panel>
          <div className="text-sm text-sage">Şüpheli güvenlik olayları</div>
          <div className="mt-3 text-3xl font-bold text-ink">
            {data.suspiciousSummary.reduce((sum, item) => sum + item._count._all, 0)}
          </div>
        </Panel>
        <Panel>
          <div className="text-sm text-sage">Son log kaydı</div>
          <div className="mt-3 text-lg font-semibold text-ink">
            {data.recentLogs[0] ? formatDateTime(data.recentLogs[0].createdAt) : "Henüz yok"}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <div className="section-title">Özet</div>
          <div className="mt-5 space-y-3">
            {data.failedLogins.map((item) => (
              <div key={item.action} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="text-sm text-sage">{item.action}</div>
                <div className="mt-2 text-2xl font-semibold text-ink">{item._count._all}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Son Güvenlik Olayları</div>
          <div className="mt-5 space-y-3">
            {data.recentLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{log.action}</div>
                    <div className="mt-1 text-sm text-sage">{log.message}</div>
                  </div>
                  <div className="text-sm text-sage">{formatDateTime(log.createdAt)}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-sage">
                  <span>{log.category}</span>
                  <span>{log.severity}</span>
                  {log.businessId ? <span>İşletme: {log.businessId.slice(-6)}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
