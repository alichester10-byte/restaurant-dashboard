import Link from "next/link";
import { onboardingCreateBusinessAction } from "@/actions/tenant-actions";

const onboardingErrorMessages: Record<string, string> = {
  validation: "Form alanlarını kontrol edin. Bazı bilgiler eksik veya hatalı.",
  slug_exists: "Bu slug zaten kullanılıyor. Lütfen farklı bir işletme adresi seçin.",
  admin_email_exists: "Bu yönetici e-postası zaten kullanımda. Farklı bir e-posta girin.",
  unknown: "İşletme oluşturulurken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
};

export default function OnboardingPage({
  searchParams
}: {
  searchParams?: { error?: string; created?: string };
}) {
  const errorMessage = searchParams?.error ? onboardingErrorMessages[searchParams.error] ?? onboardingErrorMessages.unknown : null;
  const created = searchParams?.created === "1";

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="text-xs uppercase tracking-[0.34em] text-sage">SaaS Onboarding</div>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl leading-tight text-ink">
            Kendi restoran workspace’inizi dakikalar içinde oluşturun.
          </h1>
          <p className="mt-5 text-base leading-8 text-sage">
            İşletme, ilk yönetici hesabı, varsayılan ayarlar ve isteğe bağlı masa planı tek akışta hazırlanır.
          </p>
          <div className="mt-8 rounded-[28px] bg-white/80 p-5 shadow-soft">
            <div className="text-sm font-semibold text-ink">Neler hazırlanır?</div>
            <div className="mt-3 space-y-2 text-sm text-sage">
              <div>İşletme tenant kaydı</div>
              <div>İlk business admin hesabı</div>
              <div>Varsayılan restoran ayarları</div>
              <div>Opsiyonel örnek masa planı</div>
            </div>
          </div>
          <Link href="/login" className="btn-secondary mt-6">
            Girişe Dön
          </Link>
        </section>

        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="text-xs uppercase tracking-[0.28em] text-sage">Yeni İşletme</div>
          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          {created ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              İşletme oluşturuldu. Şimdi yönetici hesabınızla giriş yapabilirsiniz.
            </div>
          ) : null}
          <form action={onboardingCreateBusinessAction} className="mt-6 space-y-4">
            <input type="hidden" name="redirectTo" value="/login" />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İşletme Adı</span>
                <input className="field" name="businessName" placeholder="Mavi Masa" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Slug</span>
                <input className="field" name="slug" placeholder="mavi-masa" required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Restoran Adı</span>
                <input className="field" name="restaurantName" placeholder="Mavi Masa" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Telefon</span>
                <input className="field" name="phone" placeholder="+90 555 123 45 67" required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Yönetici Adı</span>
                <input className="field" name="adminName" placeholder="Ayşe Operasyon" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Yönetici E-postası</span>
                <input className="field" type="email" name="adminEmail" placeholder="admin@restoran.com" required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Şifre</span>
                <input className="field" type="password" name="adminPassword" placeholder="En az 8 karakter" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Toplam Kapasite</span>
                <input className="field" type="number" name="seatingCapacity" defaultValue={80} required />
              </label>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-ink">
              <input type="checkbox" name="createDefaultTables" value="true" defaultChecked />
              Varsayılan masa planını oluştur
            </label>
            <button className="btn-primary w-full" type="submit">
              Workspace Oluştur
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
