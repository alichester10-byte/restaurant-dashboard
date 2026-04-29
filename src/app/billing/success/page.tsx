import Link from "next/link";
import { destroyCurrentSessionIfPresent } from "@/lib/auth";

export default async function PublicBillingSuccessPage() {
  await destroyCurrentSessionIfPresent();

  return (
    <main className="app-shell min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="text-xs uppercase tracking-[0.28em] text-sage">Ödeme Sonucu</div>
          <div className="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] p-6 text-white">
              <div className="text-sm text-white/70">Ödeme Durumu</div>
              <div className="mt-2 font-[family-name:var(--font-display)] text-4xl">Ödeme başarılı</div>
              <div className="mt-3 text-sm leading-6 text-white/75">
                Güvenlik nedeniyle mevcut panel oturumu kapatıldı. Pro aktivasyonu sunucu tarafında ödeme kaydınıza göre işlenir; bu ekran hiçbir işletmeye otomatik giriş yapmaz.
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
                <div className="text-sm text-sage">Sonraki Adım</div>
                <div className="mt-2 text-2xl font-semibold text-ink">Doğru hesapla yeniden giriş yapın</div>
                <p className="mt-4 text-sm leading-7 text-sage">
                  Ödeme sonrasında yanlış işletme paneline düşmemek için oturum sıfırlandı. Ödemeyi başlatan işletme hesabıyla giriş yaptıktan sonra Faturalama ekranında sonucu güvenle görebilirsiniz.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="btn-primary">
                  Doğru Hesapla Giriş Yap
                </Link>
                <Link href="/" className="btn-secondary">
                  Ana Sayfa
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
