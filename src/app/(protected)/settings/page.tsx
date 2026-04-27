import Link from "next/link";
import { ReminderChannel } from "@prisma/client";
import { disableEmailTwoFactorAction, enableEmailTwoFactorAction, updateSettingsAction } from "@/actions/settings-actions";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { LockedAction } from "@/components/demo/locked-action";
import { AppHeader } from "@/components/layout/app-header";
import { FormMessage } from "@/components/ui/form-message";
import { Panel } from "@/components/ui/panel";
import { requireBusinessUser } from "@/lib/auth";
import { getEmailTwoFactorSettingsState } from "@/lib/auth-service";
import { getBusinessEntitlement } from "@/lib/billing";
import { reminderChannelLabels } from "@/lib/constants";
import { getSettingsData } from "@/lib/data";

const securityMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  email_2fa_enabled: { tone: "success", text: "E-posta ile iki adımlı doğrulama etkinleştirildi." },
  email_2fa_disabled: { tone: "success", text: "E-posta ile iki adımlı doğrulama kapatıldı." },
  email_2fa_setup_required: { tone: "error", text: "Email 2FA setup required. Önce e-posta gönderim ayarlarını tamamlayın." },
  email_2fa_schema_missing: { tone: "error", text: "Email 2FA veritabanı migration'ı henüz uygulanmadı." }
};

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: { security?: string };
}) {
  const session = await requireBusinessUser();
  const settings = await getSettingsData(session.user.businessId);
  const emailTwoFactorState = await getEmailTwoFactorSettingsState();
  const openingHours = settings.openingHours as Record<string, string>;
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const securityFeedback = searchParams?.security ? securityMessages[searchParams.security] : null;

  return (
    <div className="space-y-6">
      <AppHeader
        title="Ayarlar"
        subtitle="Restoran profilini, çalışma saatlerini ve rezervasyon kurallarını merkezi olarak yönetin."
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      {entitlement.isDemo ? (
        <DemoModeBanner
          title="Ayarlar görünür, değişiklikler Pro ile açılır."
          description="Restoran profilinizi, çalışma saatlerinizi ve servis kurallarınızı önizleyebilirsiniz. Kalıcı güncellemeler için Pro planını etkinleştirin."
          href="/billing?upgrade=settings"
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="section-title">Restoran Profili</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Operasyon ayarları</h2>
          <form action={updateSettingsAction} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Restoran Adı</span>
                <input className="field" name="restaurantName" defaultValue={settings.restaurantName} required disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Telefon</span>
                <input className="field" name="phone" defaultValue={settings.phone} required disabled={entitlement.isDemo} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">E-posta</span>
                <input className="field" name="email" type="email" defaultValue={settings.email ?? ""} disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Adres</span>
                <input className="field" name="address" defaultValue={settings.address ?? ""} disabled={entitlement.isDemo} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Toplam Kapasite</span>
                <input className="field" type="number" name="seatingCapacity" defaultValue={settings.seatingCapacity} disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Ortalama Servis Süresi</span>
                <input className="field" type="number" name="averageDiningDurationMin" defaultValue={settings.averageDiningDurationMin} disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Maks. Parti</span>
                <input className="field" type="number" name="maxPartySize" defaultValue={settings.maxPartySize} disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Rezervasyon Ufku</span>
                <input className="field" type="number" name="reservationLeadTimeDays" defaultValue={settings.reservationLeadTimeDays} disabled={entitlement.isDemo} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Hatırlatıcılar</span>
                <select className="field" name="reminderEnabled" defaultValue={String(settings.reminderEnabled)} disabled={entitlement.isDemo}>
                  <option value="true">Açık</option>
                  <option value="false">Kapalı</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Hatırlatıcı Kanalı</span>
                <select className="field" name="reminderChannel" defaultValue={settings.reminderChannel} disabled={entitlement.isDemo}>
                  {Object.values(ReminderChannel).map((channel) => (
                    <option key={channel} value={channel}>
                      {reminderChannelLabels[channel]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Walk-in kabulü</span>
                <select className="field" name="allowWalkIns" defaultValue={String(settings.allowWalkIns)} disabled={entitlement.isDemo}>
                  <option value="true">Açık</option>
                  <option value="false">Kapalı</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Telefon doğrulama</span>
                <select className="field" name="requirePhoneVerification" defaultValue={String(settings.requirePhoneVerification)} disabled={entitlement.isDemo}>
                  <option value="false">Kapalı</option>
                  <option value="true">Açık</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Hatırlatma Zamanı</span>
                <select className="field" name="reminderTimingHours" defaultValue={String(settings.reminderTimingHours)} disabled={entitlement.isDemo}>
                  <option value="2">2 saat önce</option>
                  <option value="6">6 saat önce</option>
                  <option value="24">24 saat önce</option>
                </select>
              </label>
            </div>

            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm font-semibold text-ink">Açılış Saatleri</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
                  <label key={day} className="space-y-2">
                    <span className="text-sm font-semibold capitalize text-ink">{day}</span>
                    <input className="field" name={day} defaultValue={openingHours[day]} disabled={entitlement.isDemo} />
                  </label>
                ))}
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Notlar ve Kurallar</span>
              <textarea className="field min-h-28" name="notes" defaultValue={settings.notes ?? ""} disabled={entitlement.isDemo} />
            </label>

            {entitlement.isDemo ? (
              <LockedAction
                fullWidth
                href="/billing?upgrade=settings-save"
                title="Ayarları kaydetmek için Pro gerekir"
                description="Demo modunda profilinizi ve servis kurallarınızı önizleyebilirsiniz. Kaydetme açmak için Pro planını etkinleştirin."
              />
            ) : (
              <button className="btn-primary w-full" type="submit">
                Ayarları Kaydet
              </button>
            )}
          </form>
        </Panel>

        <Panel>
          <div className="section-title">Güven ve Otomasyon</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Hatırlatıcılar ve veri koruma</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Pro planda rezervasyon hatırlatıcıları zamanlanır, güvenlik olayları izlenir ve ekip erişimi kontrollü biçimde yönetilir.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/billing" className="btn-secondary">
              Planı Yönet
            </Link>
            <Link href="/security" className="btn-secondary">
              Güvenlik & Veri
            </Link>
          </div>

          <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
            <div className="section-title">Güvenlik</div>
            <h3 className="mt-2 text-lg font-semibold text-ink">E-posta ile iki adımlı doğrulama</h3>
            <p className="mt-2 text-sm leading-6 text-sage">
              İsterseniz girişten sonra e-posta adresinize tek kullanımlık 6 haneli bir kod gönderilir. Kod 10 dakika geçerlidir ve
              doğrulama tamamlanmadan panel açılmaz.
            </p>
            <div className="mt-4 rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-ink">
              Durum:{" "}
              <span className="font-semibold">
                {emailTwoFactorState.available && session.user.emailTwoFactorEnabled ? "Etkin" : "Kapalı"}
              </span>
            </div>
            {!emailTwoFactorState.available && emailTwoFactorState.warning ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {emailTwoFactorState.warning}
              </div>
            ) : null}
            {securityFeedback ? (
              securityFeedback.tone === "error" ? (
                <div className="mt-4">
                  <FormMessage message={securityFeedback.text} />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {securityFeedback.text}
                </div>
              )
            ) : null}
            <div className="mt-4">
              {!emailTwoFactorState.available ? (
                <button className="btn-secondary w-full cursor-not-allowed opacity-70" type="button" disabled>
                  Migration Bekleniyor
                </button>
              ) : session.user.emailTwoFactorEnabled ? (
                <form action={disableEmailTwoFactorAction}>
                  <button className="btn-secondary w-full" type="submit">
                    E-posta 2FA&apos;yı Kapat
                  </button>
                </form>
              ) : entitlement.isDemo ? (
                <LockedAction
                  fullWidth
                  href="/billing?upgrade=security"
                  title="Gelişmiş güvenlik için Pro gerekir"
                  description="Demo modunda güvenlik akışını görüntüleyebilirsiniz. Etkinleştirmek için Pro planına geçin."
                />
              ) : (
                <form action={enableEmailTwoFactorAction}>
                  <button className="btn-primary w-full" type="submit">
                    E-posta 2FA&apos;yı Etkinleştir
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
            <div className="text-sm font-semibold text-ink">Hatırlatıcı Akışı</div>
            <div className="mt-3 grid gap-3">
              {[
                "Yaklaşan rezervasyonlar seçilen saat aralığına göre planlanır.",
                "E-posta kanalı hazırdır; WhatsApp ve SMS akışları provider bağlandığında etkinleşir.",
                "Cron endpoint'i Vercel Scheduler ile bağlanmaya hazırdır."
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm leading-6 text-sage">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              { title: "Veri izolasyonu", body: "Her işletmenin verisi ayrı tenant yapısında tutulur; farklı restoran kayıtları birbirine karışmaz." },
              { title: "Oturum ve erişim", body: "Rol bazlı erişim, güvenli oturum çerezleri ve yazma işlemlerinde ek yetki kontrolleri uygulanır." },
              { title: "Ödeme güveni", body: "Ödeme akışı PAYTR tarafından işlenir; kart verileri uygulama içinde tutulmaz." }
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/70 p-5">
                <div className="font-semibold text-ink">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-sage">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] bg-[color:var(--bg-strong)] p-5">
            <div className="text-sm font-semibold text-ink">Ürün yol haritası hazır</div>
            <p className="mt-2 text-sm leading-6 text-sage">
              WhatsApp/SMS hatırlatıcıları, gelişmiş entegrasyonlar ve daha derin operasyon otomasyonları mevcut mimari üzerine güvenle eklenebilir.
            </p>
          </div>
        </Panel>
      </section>
    </div>
  );
}
