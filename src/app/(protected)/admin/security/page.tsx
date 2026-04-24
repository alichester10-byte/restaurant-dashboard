import Link from "next/link";
import {
  confirmSuperAdminTwoFactorAction,
  disableSuperAdminTwoFactorAction,
  getPendingTwoFactorSetup,
  startSuperAdminTwoFactorSetupAction
} from "@/actions/super-admin-actions";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { getSecurityLogData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

export default async function SecurityPage({
  searchParams
}: {
  searchParams?: { setup?: string; saved?: string; error?: string };
}) {
  const session = await requireSuperAdmin();
  const data = await getSecurityLogData();
  const pendingSetup = await getPendingTwoFactorSetup(session.user.id);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Güvenlik Merkezi"
        subtitle="Kimlik doğrulama, şüpheli etkinlik ve webhook güvenliği için son olayları izleyin."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      {searchParams?.saved ? (
        <Panel className="border-emerald-200 bg-emerald-50/80">
          <div className="section-title text-emerald-700">Güvenlik Ayarı Güncellendi</div>
          <p className="mt-2 text-sm leading-6 text-emerald-700">
            {searchParams.saved === "two_factor_enabled"
              ? "İki adımlı doğrulama etkinleştirildi."
              : "İki adımlı doğrulama kapatıldı."}
          </p>
        </Panel>
      ) : null}

      {searchParams?.error ? (
        <Panel className="border-rose-200 bg-rose-50/80">
          <div className="section-title text-rose-700">İşlem Tamamlanamadı</div>
          <p className="mt-2 text-sm leading-6 text-rose-700">Güvenlik doğrulaması başarısız oldu. Lütfen kodu tekrar kontrol edin.</p>
        </Panel>
      ) : null}

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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="section-title">Süper Admin Hesabı</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Erişim güvenliği</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm text-sage">Hesap</div>
              <div className="mt-2 font-semibold text-ink">{session.user.email}</div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm text-sage">Son giriş</div>
              <div className="mt-2 font-semibold text-ink">
                {session.user.lastLoginAt ? formatDateTime(session.user.lastLoginAt) : "Henüz kayıt yok"}
              </div>
              <div className="mt-1 text-sm text-sage">{session.user.lastLoginIp ?? "IP kaydı yok"}</div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
              <div className="text-sm text-sage">2FA durumu</div>
              <div className="mt-2 font-semibold text-ink">
                {session.user.twoFactorEnabled ? "Etkin" : pendingSetup ? "Kurulum bekliyor" : "Kapalı"}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">İki Adımlı Doğrulama</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">TOTP ile giriş güvenliğini artırın</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Google Authenticator, 1Password veya Authy gibi uygulamalarla 30 saniyelik tek kullanımlık kod oluşturabilirsiniz.
          </p>

          {session.user.twoFactorEnabled ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-800">
                2FA şu anda aktif. Süper admin girişlerinde şifreye ek olarak 6 haneli doğrulama kodu gerekecek.
              </div>
              <form action={disableSuperAdminTwoFactorAction}>
                <button className="btn-secondary w-full" type="submit">
                  2FA&apos;yı Devre Dışı Bırak
                </button>
              </form>
            </div>
          ) : pendingSetup ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="text-sm text-sage">Manuel kurulum anahtarı</div>
                <div className="mt-2 break-all font-mono text-sm text-ink">{pendingSetup.secret}</div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="text-sm text-sage">OTP Auth URI</div>
                <div className="mt-2 break-all text-xs text-sage">{pendingSetup.otpauthUrl}</div>
              </div>
              <form action={confirmSuperAdminTwoFactorAction} className="space-y-3">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Uygulamadaki 6 haneli kod</span>
                  <input className="field" name="token" placeholder="123456" required />
                </label>
                <button className="btn-primary w-full" type="submit">
                  2FA&apos;yı Etkinleştir
                </button>
              </form>
            </div>
          ) : (
            <form action={startSuperAdminTwoFactorSetupAction} className="mt-5">
              <button className="btn-primary w-full" type="submit">
                2FA Kurulumunu Başlat
              </button>
            </form>
          )}
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
                  {log.ipAddress ? <span>IP: {log.ipAddress}</span> : null}
                  {log.businessId ? <span>İşletme: {log.businessId.slice(-6)}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="section-title">Kontrol Merkezi</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/super-admin" className="btn-secondary">
            İşletme Portföyüne Dön
          </Link>
        </div>
      </Panel>
    </div>
  );
}
