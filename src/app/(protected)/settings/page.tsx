import Link from "next/link";
import { updateSettingsAction } from "@/actions/settings-actions";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireBusinessUser } from "@/lib/auth";
import { getSettingsData } from "@/lib/data";

export default async function SettingsPage() {
  const session = await requireBusinessUser();
  const settings = await getSettingsData(session.user.businessId);
  const openingHours = settings.openingHours as Record<string, string>;

  return (
    <div className="space-y-6">
      <AppHeader
        title="Ayarlar"
        subtitle="Restoran profilini, çalışma saatlerini ve rezervasyon kurallarını merkezi olarak yönetin."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="section-title">Restoran Profili</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Operasyon ayarları</h2>
          <form action={updateSettingsAction} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Restoran Adı</span>
                <input className="field" name="restaurantName" defaultValue={settings.restaurantName} required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Telefon</span>
                <input className="field" name="phone" defaultValue={settings.phone} required />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">E-posta</span>
                <input className="field" name="email" type="email" defaultValue={settings.email ?? ""} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Adres</span>
                <input className="field" name="address" defaultValue={settings.address ?? ""} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Toplam Kapasite</span>
                <input className="field" type="number" name="seatingCapacity" defaultValue={settings.seatingCapacity} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Ortalama Servis Süresi</span>
                <input className="field" type="number" name="averageDiningDurationMin" defaultValue={settings.averageDiningDurationMin} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Maks. Parti</span>
                <input className="field" type="number" name="maxPartySize" defaultValue={settings.maxPartySize} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Rezervasyon Ufku</span>
                <input className="field" type="number" name="reservationLeadTimeDays" defaultValue={settings.reservationLeadTimeDays} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Walk-in kabulü</span>
                <select className="field" name="allowWalkIns" defaultValue={String(settings.allowWalkIns)}>
                  <option value="true">Açık</option>
                  <option value="false">Kapalı</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Telefon doğrulama</span>
                <select className="field" name="requirePhoneVerification" defaultValue={String(settings.requirePhoneVerification)}>
                  <option value="false">Kapalı</option>
                  <option value="true">Açık</option>
                </select>
              </label>
            </div>

            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm font-semibold text-ink">Açılış Saatleri</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
                  <label key={day} className="space-y-2">
                    <span className="text-sm font-semibold capitalize text-ink">{day}</span>
                    <input className="field" name={day} defaultValue={openingHours[day]} />
                  </label>
                ))}
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Notlar ve Kurallar</span>
              <textarea className="field min-h-28" name="notes" defaultValue={settings.notes ?? ""} />
            </label>

            <button className="btn-primary w-full" type="submit">
              Ayarları Kaydet
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="section-title">Entegrasyonlar</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Hazır bağlayıcı alanları</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            MVP kapsamında entegrasyonlar placeholder bırakıldı; yapı gelecekte POS, telephony ve Google rezervasyon senaryolarına açık.
          </p>

          <Link href="/billing" className="btn-secondary mt-6">
            Billing ve Plan Yönetimi
          </Link>

          <div className="mt-6 space-y-4">
            {[
              { title: "Telefon Santrali", body: "Çağrı kayıtlarını otomatik içeri almak için webhook ve sağlayıcı eşleme alanı." },
              { title: "POS / Adisyon", body: "Masa döngüsü ve servis süresi verilerini operasyon paneline taşımak için hazır bölüm." },
              { title: "Google / Web Rezervasyon", body: "Dış kaynak rezervasyonlarını normalize etmek için kaynak eşleme alanı." }
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/70 p-5">
                <div className="font-semibold text-ink">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-sage">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] bg-[color:var(--bg-strong)] p-5">
            <div className="text-sm font-semibold text-ink">Güvenlik Notu</div>
            <p className="mt-2 text-sm leading-6 text-sage">
              Gerçek üretimde kimlik doğrulama olay logları, rate limiting adaptörü, CSRF yaklaşımı ve rol bazlı izin katmanı daha da sertleştirilmelidir.
            </p>
          </div>
        </Panel>
      </section>
    </div>
  );
}
