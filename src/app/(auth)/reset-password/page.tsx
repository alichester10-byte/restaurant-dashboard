import Link from "next/link";
import { AuthToast } from "@/components/auth/auth-toast";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthFlowError, validatePasswordResetToken } from "@/lib/auth-service";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token;
  let errorMessage: string | null = null;

  if (!token) {
    errorMessage = "Şifre sıfırlama bağlantısı eksik.";
  } else {
    try {
      await validatePasswordResetToken(token);
    } catch (error) {
      errorMessage = error instanceof AuthFlowError ? error.message : "Bağlantı doğrulanamadı.";
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      {errorMessage ? <AuthToast title="Bağlantı geçersiz" description={errorMessage} tone="error" /> : null}
      <div className="glass-panel w-full max-w-2xl rounded-[32px] p-8 md:p-10">
        <div className="text-xs uppercase tracking-[0.34em] text-sage">Reset Password</div>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-tight text-ink">Yeni şifrenizi belirleyin</h1>
        <p className="mt-4 text-base leading-8 text-sage">
          Güvenliğiniz için bu bağlantı yalnızca bir kez kullanılabilir ve 1 saat sonra sona erer.
        </p>
        {token && !errorMessage ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Link href="/forgot-password" className="btn-secondary mt-6">
            Yeni Bağlantı İste
          </Link>
        )}
      </div>
    </main>
  );
}
