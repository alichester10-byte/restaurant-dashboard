import Link from "next/link";
import { ReminderChannel } from "@prisma/client";
import { updateSettingsAction } from "@/actions/settings-actions";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { LockedAction } from "@/components/demo/locked-action";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireBusinessUser } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { reminderChannelLabels } from "@/lib/constants";
import { getSettingsData } from "@/lib/data";

export default async function SettingsPage() {
  const session = await requireBusinessUser();
  const settings = await getSettingsData(session.user.businessId);
  const openingHours = settings.openingHours as Record<string, string>;
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);

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
