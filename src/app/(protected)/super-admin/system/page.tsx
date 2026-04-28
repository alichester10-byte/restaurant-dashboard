import { UserRole } from "@prisma/client";
import { AppHeader } from "@/components/layout/app-header";
import { SuperAdminControlNav } from "@/components/super-admin/control-center-nav";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { getSuperAdminSystemCenterData } from "@/lib/super-admin";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminSystemPage() {
  const session = await requireSuperAdmin();
  const data = await getSuperAdminSystemCenterData();

  return (
    <div className="space-y-6">
      <AppHeader
        title="Sistem Sağlığı"
        subtitle="Veritabanı, auth, email, Meta env tanıları, cron/reminder hazırlığı ve son build marker burada görünür."
        businessName={session.user.business.name}
        role={UserRole.SUPER_ADMIN}
      />
      <SuperAdminControlNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel><div className="text-sm text-sage">Database</div><div className="mt-2 text-2xl font-bold text-ink">{data.dbHealthy ? "Healthy" : "Issue"}</div></Panel>
        <Panel><div className="text-sm text-sage">Email</div><div className="mt-2 text-2xl font-bold text-ink">{data.emailConfigured ? "Configured" : "Missing"}</div></Panel>
        <Panel><div className="text-sm text-sage">Cron</div><div className="mt-2 text-2xl font-bold text-ink">{data.cronReady ? "Ready" : "Missing"}</div></Panel>
        <Panel><div className="text-sm text-sage">Build Marker</div><div className="mt-2 break-all text-sm font-bold text-ink">{data.buildMarker}</div></Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <div className="section-title">Runtime Görünümü</div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm text-sage">Email 2FA Şeması: <span className="font-semibold text-ink">{data.schemaStatus.ready ? "Hazır" : "Migration bekleniyor"}</span></div>
            <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm text-sage">Reminder Etkin İşletme: <span className="font-semibold text-ink">{data.reminderBusinesses}</span></div>
            <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm text-sage">Meta Redirect URI: <span className="font-semibold break-all text-ink">{data.metaDiagnostics.redirectUri}</span></div>
            <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm text-sage">Meta Eksik Env: <span className="font-semibold text-ink">{data.metaDiagnostics.missing.join(", ") || "Yok"}</span></div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Kritik Hata Akışı</div>
          <div className="mt-5 space-y-3">
            {data.criticalLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="font-semibold text-rose-900">{log.action}</div>
                <div className="mt-2 text-sm text-rose-800">{log.message}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em] text-rose-700">{formatDateTime(log.createdAt)}</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
