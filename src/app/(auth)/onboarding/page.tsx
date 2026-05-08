import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function OnboardingPage({
  searchParams
}: {
  searchParams?: { error?: string; created?: string };
}) {
  void searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="text-xs uppercase tracking-[0.34em] text-sage">İşletme Onboarding</div>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl leading-tight text-ink">
            Çalışma alanınızı dakikalar içinde oluşturun.
          </h1>
          <p className="mt-5 text-base leading-8 text-sage">
            İşletme hesabı, ilk yönetici kullanıcısı, temel ayarlar ve isteğe bağlı kaynak planı tek akışta hazırlanır.
          </p>
          <div className="mt-8 rounded-[28px] bg-white/80 p-5 shadow-soft">
            <div className="text-sm font-semibold text-ink">Neler hazırlanır?</div>
            <div className="mt-3 space-y-2 text-sm text-sage">
              <div>İşletme hesabı ve çalışma alanı</div>
              <div>İlk yönetici hesabı</div>
              <div>Sektöre uygun varsayılan operasyon ayarları</div>
              <div>Opsiyonel örnek kaynak planı</div>
            </div>
          </div>
          <Link href="/login" className="btn-secondary mt-6">
            Girişe Dön
          </Link>
        </section>

        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="text-xs uppercase tracking-[0.28em] text-sage">Yeni İşletme</div>
          <RegisterForm />
        </section>
      </div>
    </main>
  );
}
