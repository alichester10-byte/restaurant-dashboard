import { UserRole } from "@prisma/client";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireBusinessAccess } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { getBusinessSecurityData } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

export default async function SecurityPage() {
  const session = await requireBusinessAccess({
    roles: [UserRole.BUSINESS_ADMIN, UserRole.STAFF]
  });
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const data = await getBusinessSecurityData(session.user.businessId);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Güvenlik & Veri"
        subtitle="Restoran verilerinizin nasıl korunduğunu ve son güvenlik olaylarını tek sayfada görün."
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="section-title">Güvenlik Güçlendirmeleri</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Veri ve erişim koruması</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "İşletme verileriniz ayrı tenant yapısında tutulur.",
              "Sadece yetkili kullanıcılar rol bazlı erişimle işlem yapabilir.",
              "Ödeme bilgileri PAYTR tarafından işlenir.",
              "Şifreler güçlü hash algoritmalarıyla saklanır.",
              "Oturum ve erişim kontrolleri düzenli olarak uygulanır.",
              "Sistem aktiviteleri güvenlik için loglanır."
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm leading-6 text-sage">
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Şeffaflık Merkezi</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Yetkisiz erişime karşı koruma</h2>
          <div className="mt-5 space-y-3">
            {[
              "Yeni giriş denemeleri, başarısız denemeler ve şifre sıfırlama olayları izlenir.",
              "Yazma işlemleri tenant ve rol kontrolleriyle sınırlandırılır.",
              "Webhook ve ödeme uç noktalarında rate limiting ve doğrulama uygulanır."
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm leading-6 text-sage">
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel>
          <div className="section-title">Son Girişler</div>
          <div className="mt-4 space-y-3">
            {data.recentLogins.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/90 px-4 py-3">
                <div className="font-semibold text-ink">{item.message}</div>
                <div className="mt-1 text-sm text-sage">{formatDateTime(item.createdAt)}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Başarısız Denemeler</div>
          <div className="mt-4 space-y-3">
            {data.failedAttempts.length === 0 ? (
              <div className="rounded-2xl bg-white/90 px-4 py-3 text-sm text-sage">Yakın dönemde başarısız giriş kaydı yok.</div>
            ) : (
              data.failedAttempts.map((item) => (
                <div key={item.id} className="rounded-2xl bg-white/90 px-4 py-3">
                  <div className="font-semibold text-ink">{item.message}</div>
                  <div className="mt-1 text-sm text-sage">{formatDateTime(item.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Şifre İşlemleri</div>
          <div className="mt-4 space-y-3">
            {data.passwordResetEvents.length === 0 ? (
              <div className="rounded-2xl bg-white/90 px-4 py-3 text-sm text-sage">Henüz şifre sıfırlama olayı kaydı yok.</div>
            ) : (
              data.passwordResetEvents.map((item) => (
                <div key={item.id} className="rounded-2xl bg-white/90 px-4 py-3">
                  <div className="font-semibold text-ink">{item.message}</div>
                  <div className="mt-1 text-sm text-sage">{formatDateTime(item.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}
