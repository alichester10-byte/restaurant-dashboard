import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-panel w-full max-w-4xl rounded-[32px] p-8 md:p-10">
        <div className="text-xs uppercase tracking-[0.34em] text-sage">Create Account</div>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl leading-tight text-ink">
          İşletmeniz için birkaç dakikada üretim hazır hesap açın.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-sage">
          İlk yönetici hesabı, varsayılan operasyon ayarları ve onboarding e-postaları aynı akış içinde otomatik hazırlanır.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
