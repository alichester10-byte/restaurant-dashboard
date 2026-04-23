import Link from "next/link";
import { AuthToast } from "@/components/auth/auth-toast";
import { AuthFlowError, verifyEmailToken } from "@/lib/auth-service";

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token;
  let success = false;
  let message = "Doğrulama bağlantısı eksik.";

  if (token) {
    try {
      await verifyEmailToken(token);
      success = true;
      message = "E-posta adresiniz doğrulandı. Şimdi giriş yapabilirsiniz.";
    } catch (error) {
      message = error instanceof AuthFlowError ? error.message : "Doğrulama tamamlanamadı.";
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <AuthToast title={success ? "E-posta doğrulandı" : "Doğrulama başarısız"} description={message} tone={success ? "success" : "error"} />
      <div className="glass-panel w-full max-w-2xl rounded-[32px] p-8 md:p-10">
        <div className="text-xs uppercase tracking-[0.34em] text-sage">Verify Email</div>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-tight text-ink">
          {success ? "Doğrulama tamamlandı" : "Doğrulama bağlantısı geçersiz"}
        </h1>
        <p className="mt-4 text-base leading-8 text-sage">{message}</p>
        <Link href={success ? "/login?toast=email_verified" : "/login"} className="btn-primary mt-6">
          Girişe Git
        </Link>
      </div>
    </main>
  );
}
