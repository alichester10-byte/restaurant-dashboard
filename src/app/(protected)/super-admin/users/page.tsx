import { UserRole } from "@prisma/client";
import {
  forcePasswordResetAction,
  revokeUserSessionsAction,
  setUserAccountStatusAction,
  setUserEmailTwoFactorRequirementAction
} from "@/actions/super-admin-actions";
import { AppHeader } from "@/components/layout/app-header";
import { SuperAdminControlNav } from "@/components/super-admin/control-center-nav";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { userRoleLabels } from "@/lib/constants";
import { getSuperAdminUsersCenterData } from "@/lib/super-admin";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminUsersPage({
  searchParams
}: {
  searchParams?: { search?: string };
}) {
  const session = await requireSuperAdmin();
  const data = await getSuperAdminUsersCenterData({
    search: searchParams?.search
  });

  return (
    <div className="space-y-6">
      <AppHeader
        title="Kullanıcı Yönetimi"
        subtitle="Rol, 2FA, oturum, son giriş ve hesap durumu görünürlüğü ile erişimi güvenli biçimde yönetin."
        businessName={session.user.business.name}
        role={UserRole.SUPER_ADMIN}
      />
      <SuperAdminControlNav />

      <Panel>
        <div className="section-title">Arama</div>
        <form className="mt-4 flex flex-col gap-3 md:flex-row">
          <input className="field flex-1" name="search" defaultValue={searchParams?.search ?? ""} placeholder="Ad, e-posta, işletme ara" />
          <button className="btn-secondary" type="submit">
            Filtrele
          </button>
        </form>
      </Panel>

      <Panel>
        <div className="section-title">Kullanıcılar</div>
        {!data.schemaStatus.ready ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            E-posta 2FA şeması henüz migration bekliyor. Bu ekranda zorunlu 2FA alanları güvenli fallback ile gösteriliyor.
          </div>
        ) : null}
        <div className="mt-5 space-y-4">
          {data.users.map((user) => (
            <div key={user.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="text-xl font-semibold text-ink">{user.name}</div>
                  <div className="text-sm text-sage">{user.email}</div>
                  <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
                    <span>{userRoleLabels[user.role]}</span>
                    <span>{user.business.name}</span>
                    <span>{user.disabledAt ? "Devre dışı" : "Aktif"}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm text-sage">
                      2FA:{" "}
                      <span className="font-semibold text-ink">
                        {user.role === UserRole.SUPER_ADMIN || user.emailTwoFactorRequiredByAdmin
                          ? "Zorunlu"
                          : user.emailTwoFactorEnabled
                            ? "Etkin"
                            : "Kapalı"}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm text-sage">
                      Son giriş: <span className="font-semibold text-ink">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Yok"}</span>
                    </div>
                    <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm text-sage">
                      IP: <span className="font-semibold text-ink">{user.lastLoginIp ?? "Yok"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid w-full max-w-xl gap-3 md:grid-cols-2">
                  <form action={forcePasswordResetAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="redirectTo" value="/super-admin/users" />
                    <button className="btn-secondary w-full" type="submit">
                      Şifre Sıfırlat
                    </button>
                  </form>
                  <form action={revokeUserSessionsAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="redirectTo" value="/super-admin/users" />
                    <button className="btn-secondary w-full" type="submit">
                      Oturumları İptal Et
                    </button>
                  </form>
                  <form action={setUserEmailTwoFactorRequirementAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="redirectTo" value="/super-admin/users" />
                    <input
                      type="hidden"
                      name="mode"
                      value={user.role === UserRole.SUPER_ADMIN || user.emailTwoFactorRequiredByAdmin ? "disable" : "enable"}
                    />
                    <button className="btn-secondary w-full" type="submit">
                      {user.role === UserRole.SUPER_ADMIN || user.emailTwoFactorRequiredByAdmin ? "2FA Zorunluluğunu Kaldır" : "2FA Zorunlu Kıl"}
                    </button>
                  </form>
                  <form action={setUserAccountStatusAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="redirectTo" value="/super-admin/users" />
                    <input type="hidden" name="mode" value={user.disabledAt ? "restore" : "disable"} />
                    <button className={user.disabledAt ? "btn-secondary w-full" : "btn-danger w-full"} type="submit">
                      {user.disabledAt ? "Hesabı Geri Aç" : "Hesabı Devre Dışı Bırak"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
