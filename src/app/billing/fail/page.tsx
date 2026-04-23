import Link from "next/link";

export default async function PublicBillingFailPage() {
  return (
    <main className="app-shell min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="text-xs uppercase tracking-[0.28em] text-sage">PAYTR Result</div>
          <div className="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
              <div className="text-sm text-rose-600">Ödeme Durumu</div>
              <div className="mt-2 font-[family-name:var(--font-display)] text-4xl text-rose-700">Payment failed</div>
              <div className="mt-3 text-sm leading-6 text-rose-700">Ödeme tamamlanamadı veya kullanıcı tarafından iptal edildi.</div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
                <div className="text-sm text-sage">Sonraki Adım</div>
                <p className="mt-4 text-sm leading-7 text-sage">
                  İsterseniz faturalama ekranına dönüp ödemeyi tekrar başlatabilirsiniz. Oturumunuz yoksa önce giriş ekranına yönlenebilirsiniz.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/billing" className="btn-secondary">
                  Tekrar Dene
                </Link>
                <Link href="/dashboard" className="btn-primary">
                  Dashboarda Dön
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
