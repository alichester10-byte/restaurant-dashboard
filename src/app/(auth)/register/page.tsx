import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-panel w-full max-w-4xl rounded-[32px] p-8 md:p-10">
        <div className="text-xs uppercase tracking-[0.34em] text-sage">Limon Masa</div>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl leading-tight text-ink">
          İşletmeniz için birkaç dakikada canlı kullanıma hazır hesap açın.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-sage">
          Restoran, salon, klinik, otel ve diğer hizmet işletmeleri için ilk yönetici hesabı, temel operasyon ayarları ve rezervasyon akışı aynı onboarding içinde hazırlanır.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
