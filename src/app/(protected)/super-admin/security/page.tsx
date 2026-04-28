import { UserRole } from "@prisma/client";
import { forceLogoutAllSessionsAction } from "@/actions/super-admin-actions";
import { AppHeader } from "@/components/layout/app-header";
import { SuperAdminControlNav } from "@/components/super-admin/control-center-nav";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { getSuperAdminSecurityCenterData } from "@/lib/super-admin";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminSecurityPage() {
  const session = await requireSuperAdmin();
  const data = await getSuperAdminSecurityCenterData(session.user.id);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Güvenlik Merkezi"
        subtitle="Super admin 2FA zorunluluğu, aktif oturumlar, şüpheli girişler ve kritik güvenlik uyarıları burada toplanır."
        businessName={session.user.business.name}
        role={UserRole.SUPER_ADMIN}
      />
      <SuperAdminControlNav />

      <section className="grid gap-4 md:grid-cols-4">
        <Panel><div className="text-sm text-sage">Super Admin 2FA</div><div className="mt-2 text-2xl font-bold text-ink">Zorunlu</div></Panel>
        <Panel><div className="text-sm text-sage">Aktif Oturum</div><div className="mt-2 text-2xl font-bold text-ink">{data.sessions.length}</div></Panel>
        <Panel><div className="text-sm text-sage">Şüpheli Olay</div><div className="mt-2 text-2xl font-bold text-ink">{data.suspiciousLogins.length}</div></Panel>
        <Panel><div className="text-sm text-sage">Başarısız Giriş</div><div className="mt-2 text-2xl font-bold text-ink">{data.failedLogins.length}</div></Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="section-title">Super Admin Hesapları</div>
          <div className="mt-5 space-y-3">
            {data.activeSuperAdmins.map((admin) => (
              <div key={admin.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="font-semibold text-ink">{admin.name}</div>
                <div className="mt-1 text-sm text-sage">{admin.email}</div>
                <div className="mt-2 text-sm text-sage">
                  Email 2FA: <span className="font-semibold text-ink">{admin.emailTwoFactorRequiredByAdmin ? "Zorunlu" : admin.emailTwoFactorEnabled ? "Etkin" : "Kapalı"}</span>
                </div>
              </div>
            ))}
          </div>
          <form action={forceLogoutAllSessionsAction} className="mt-5">
            <input type="hidden" name="redirectTo" value="/super-admin/security" />
            <button className="btn-danger w-full" type="submit">
              Tüm Platform Oturumlarını Kapat
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="section-title">Aktif Oturum Listesi</div>
          <div className="mt-5 space-y-3">
            {data.sessions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{item.user.name}</div>
                    <div className="mt-1 text-sm text-sage">{item.user.email} • {item.user.business.name}</div>
                  </div>
                  <div className="text-sm text-sage">{formatDateTime(item.lastSeenAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel>
          <div className="section-title">Şüpheli Uyarılar</div>
          <div className="mt-5 space-y-3">
            {data.suspiciousLogins.map((log) => (
              <div key={log.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">{log.action}</div>
                <div className="mt-2">{log.message}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em]">{formatDateTime(log.createdAt)} • {log.ipAddress ?? "IP yok"}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Şifre Sıfırlama Olayları</div>
          <div className="mt-5 space-y-3">
            {data.passwordResetEvents.map((log) => (
              <div key={log.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm text-sage">
                <div className="font-semibold text-ink">{log.action}</div>
                <div className="mt-2">{log.message}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">2FA Logları</div>
          <div className="mt-5 space-y-3">
            {data.twoFactorLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm text-sage">
                <div className="font-semibold text-ink">{log.action}</div>
                <div className="mt-2">{log.message}</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
