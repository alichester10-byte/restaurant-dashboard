import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 md:p-8">
      <div className="glass-panel grid w-full max-w-6xl gap-6 rounded-[32px] p-8 md:p-10 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-5">
          <div className="text-[11px] uppercase tracking-[0.24em] text-sage">Yeni Hesap</div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-ink">
            İşletmeniz için sade ve profesyonel bir başlangıç oluşturun.
          </h1>
          <p className="max-w-md text-base leading-7 text-sage">
            Hesap, işletme türü, temel iletişim bilgileri ve ilk operasyon yapısını tek akışta hazırlayın.
          </p>
          <div className="grid gap-3">
            {[
              "Hesap bilgileri",
              "İşletme bilgileri",
              "İşletme türü ve hizmet odağı",
              "İlk kapasite / kaynak ayarı"
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-[color:var(--border)] bg-white/80 px-4 py-4 text-sm font-medium text-sage">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section>
        <RegisterForm />
        </section>
      </div>
    </main>
  );
}
