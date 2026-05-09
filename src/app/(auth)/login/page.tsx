import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthToast } from "@/components/auth/auth-toast";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth";
import { hasBusinessAccess } from "@/lib/billing";

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

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { toast?: string };
}) {
  const session = await getCurrentSession();
  if (session) {
    redirect(
      session.user.role === "SUPER_ADMIN"
        ? "/super-admin"
        : hasBusinessAccess(session.user.business, session.user.role)
          ? "/dashboard"
          : "/billing"
    );
  }

  const toast = searchParams?.toast ? loginToasts[searchParams.toast] : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-6 md:p-8">
      {toast ? <AuthToast title={toast.title} description={toast.description} tone={toast.tone} /> : null}
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_0.8fr]">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="text-[11px] uppercase tracking-[0.24em] text-sage">Booking Operations</div>
          <h1 className="mt-4 max-w-lg font-[family-name:var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
            Ekibiniz için tek bir booking operasyon paneli.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-sage">
            Talepleri, müşterileri, kaynakları ve kanal akışlarını daha sakin bir operasyon deneyiminde yönetin.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              "WhatsApp, Instagram, web ve AI kaynaklı talepleri tek ekranda toplayın.",
              "Hizmet, ekip ve kaynak yapınızı işletme türünüze göre yönetin.",
              "Onay kontrollü akışla uygunluğu ekibinizin kararına bırakın."
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-[color:var(--border)] bg-white/80 px-4 py-4 text-sm leading-6 text-sage">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="rounded-[26px] border border-[color:var(--border)] bg-white/86 p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-sage">Yönetici Girişi</div>
            <div className="mt-2 text-2xl font-semibold text-ink">Giriş Yap</div>
            <p className="mt-2 text-sm leading-6 text-sage">
              Hesabınıza giriş yapın ve günlük operasyon akışınıza devam edin.
            </p>
          </div>
          <div className="mt-8">
            <LoginForm />
          </div>
          <div className="mt-4 grid gap-3">
            <Link href="/register" className="btn-secondary w-full">
              Hesap Oluştur
            </Link>
          </div>
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
            Demo veya canlı hesapla giriş yaptığınızda dashboard, talepler, kaynaklar ve kanal yönetimi aynı yapıda açılır.
          </div>
        </section>
      </div>
    </main>
  );
}
