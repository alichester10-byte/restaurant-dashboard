import { AuditCategory, AuditSeverity, UserRole } from "@prisma/client";
import { AppHeader } from "@/components/layout/app-header";
import { SuperAdminControlNav } from "@/components/super-admin/control-center-nav";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { getSuperAdminAuditCenterData } from "@/lib/super-admin";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminAuditPage({
  searchParams
}: {
  searchParams?: { search?: string; severity?: AuditSeverity | "all"; category?: AuditCategory | "all" };
}) {
  const session = await requireSuperAdmin();
  const data = await getSuperAdminAuditCenterData({
    search: searchParams?.search,
    severity: searchParams?.severity,
    category: searchParams?.category
  });

  return (
    <div className="space-y-6">
      <AppHeader
        title="Merkezi Audit Log"
        subtitle="Kim neyi ne zaman yaptı? Kritik yönetici, güvenlik, billing ve veri işlemleri tek log akışında izlenir."
        businessName={session.user.business.name}
        role={UserRole.SUPER_ADMIN}
      />
      <SuperAdminControlNav />

      <Panel>
        <div className="section-title">Arama ve Filtre</div>
        <form className="mt-4 grid gap-4 md:grid-cols-[1fr_220px_220px_auto]">
          <input className="field" name="search" defaultValue={searchParams?.search ?? ""} placeholder="Aksiyon, mesaj veya target ara" />
          <select className="field" name="severity" defaultValue={searchParams?.severity ?? "all"}>
            <option value="all">Tüm Severity</option>
            {Object.values(AuditSeverity).map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
          <select className="field" name="category" defaultValue={searchParams?.category ?? "all"}>
            <option value="all">Tüm Kategori</option>
            {Object.values(AuditCategory).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button className="btn-secondary" type="submit">
            Uygula
          </button>
        </form>
      </Panel>

      <Panel>
        <div className="section-title">Kayıtlar</div>
        <div className="mt-5 space-y-3">
          {data.logs.map((log) => (
            <div key={log.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="font-semibold text-ink">{log.action}</div>
                  <div className="mt-1 text-sm text-sage">{log.message}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.16em] text-sage">
                    {log.category} • {log.severity} • Actor: {log.actorRole ?? "system"} • Target: {log.targetType ?? "-"} {log.targetId ?? ""}
                  </div>
                </div>
                <div className="text-sm text-sage">{formatDateTime(log.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
