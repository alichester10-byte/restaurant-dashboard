import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-panel w-full max-w-2xl rounded-[32px] p-8 md:p-10">
        <div className="text-xs uppercase tracking-[0.34em] text-sage">Password Recovery</div>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-tight text-ink">Şifrenizi sıfırlayın</h1>
        <p className="mt-4 text-base leading-8 text-sage">
          Hesabınızla ilişkili e-posta adresini girin. Hesap varsa 1 saat geçerli sıfırlama bağlantısı gönderilir.
        </p>
        <ForgotPasswordForm />
        <Link href="/login" className="btn-secondary mt-4">
          Girişe Dön
        </Link>
      </div>
    </main>
  );
}
