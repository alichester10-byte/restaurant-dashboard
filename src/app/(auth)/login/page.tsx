import Link from "next/link";
import { AuthToast } from "@/components/auth/auth-toast";
import { LoginForm } from "@/components/auth/login-form";

const loginToasts: Record<string, { title: string; description: string; tone?: "success" | "info" | "error" }> = {
  account_created: {
    title: "Account created successfully",
    description: "Workspace hesabınız hazır. Hoş geldiniz e-postası ve doğrulama bağlantısı gönderildi.",
    tone: "success"
  },
  password_reset_success: {
    title: "Şifre güncellendi",
    description: "Yeni şifreniz kaydedildi. Şimdi giriş yapabilirsiniz.",
    tone: "success"
  },
  email_verified: {
    title: "E-posta doğrulandı",
    description: "Hesabınız başarıyla doğrulandı.",
    tone: "success"
  }
};

export default function LoginPage({
  searchParams
}: {
  searchParams?: { toast?: string };
}) {
  const toast = searchParams?.toast ? loginToasts[searchParams.toast] : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      {toast ? <AuthToast title={toast.title} description={toast.description} tone={toast.tone} /> : null}
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="text-xs uppercase tracking-[0.34em] text-sage">Restaurant Revenue OS</div>
          <h1 className="mt-5 max-w-xl font-[family-name:var(--font-display)] text-5xl leading-tight text-ink">
            Rezervasyon ve salon operasyonlarını premium bir panelden yönetin.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-sage">
            Limon Masa Ops; rezervasyon takibi, çağrı yönetimi, masa planı, müşteri geçmişi ve günlük raporları tek akışta birleştirir.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { label: "Günlük Rezervasyon", value: "26+" },
              { label: "Canlı Doluluk", value: "%78" },
              { label: "Yanıtlanan Çağrı", value: "19" }
            ].map((item) => (
              <div key={item.label} className="rounded-[28px] bg-white/80 p-5 shadow-soft">
                <div className="text-3xl font-bold text-ink">{item.value}</div>
                <div className="mt-2 text-sm text-sage">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] p-6 text-white">
            <div className="text-xs uppercase tracking-[0.28em] text-white/60">Yönetici Girişi</div>
            <div className="mt-3 text-2xl font-semibold">Hoş geldiniz</div>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Demo hesabıyla giriş yapın ve bütün modülleri seeded gerçekçi veriyle inceleyin.
            </p>
          </div>
          <div className="mt-8">
            <LoginForm />
          </div>
          <div className="mt-4 grid gap-3">
            <Link href="/register" className="btn-secondary w-full">
              Hesap Oluştur
            </Link>
            <Link href="/onboarding" className="text-center text-sm font-semibold text-moss transition hover:text-ink">
              İşletme onboarding sayfasına git
            </Link>
          </div>
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4 text-sm text-sage">
            Varsayılan demo hesabı `.env` içindeki `ADMIN_EMAIL` ve `ADMIN_PASSWORD` değerlerinden üretilir.
          </div>
        </section>
      </div>
    </main>
  );
}
