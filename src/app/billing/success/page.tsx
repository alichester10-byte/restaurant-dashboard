import Link from "next/link";
import { BillingPaymentStatus } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function resolvePaymentContext(paymentId?: string) {
  if (!paymentId) {
    return { session: await getCurrentSession(), payment: null as null };
  }

  const session = await getCurrentSession();
  if (!session) {
    return { session, payment: null as null };
  }

  const payment = await prisma.billingPayment.findFirst({
    where: {
      id: paymentId,
      businessId: session.user.businessId
    }
  });

  return { session, payment };
}

export default async function PublicBillingSuccessPage({
  searchParams
}: {
  searchParams?: { payment?: string };
}) {
  const { session, payment } = await resolvePaymentContext(searchParams?.payment);
  const canOpenBusinessPanel = !!session && !!payment;

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
                PAYTR doğrulaması sonrası Pro aktivasyonu sunucu tarafında tamamlanır. Başka bir işletmenin paneli bu ekrandan otomatik açılmaz.
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
                {canOpenBusinessPanel ? (
                  <>
                    <div className="text-sm text-sage">Güncel Plan</div>
                    <div className="mt-2 text-2xl font-semibold text-ink">Pro</div>
                    <p className="mt-4 text-sm leading-7 text-sage">
                      Ödeme kaydı hesabınızla eşleşti. {payment?.status === BillingPaymentStatus.SUCCEEDED ? "Pro aktivasyonu tamamlandı." : "Sunucu doğrulaması tamamlandığında Pro hesabınıza işlenecek."}
                    </p>
                    <div className="mt-4 rounded-2xl bg-[color:var(--bg-strong)] px-4 py-4 text-sm leading-6 text-sage">
                      {payment ? `${formatCurrency(payment.amountMinor / 100)} • ${formatDateTime(payment.updatedAt)}` : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-sage">Güvenli Hesap Erişimi</div>
                    <div className="mt-2 text-2xl font-semibold text-ink">Ödeme alındı</div>
                    <p className="mt-4 text-sm leading-7 text-sage">
                      Güvenlik nedeniyle bu ekran yalnızca ödemeyi başlatan işletme oturumuyla eşleşirse panel kısayollarını gösterir. Farklı bir hesap açıksa otomatik giriş yapılmaz.
                    </p>
                    <div className="mt-4 rounded-2xl bg-[color:var(--bg-strong)] px-4 py-4 text-sm leading-6 text-sage">
                      Doğru işletme hesabıyla giriş yaparak faturalama ekranında ödeme sonucunu görebilirsiniz.
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {canOpenBusinessPanel ? (
                  <>
                    <Link href="/dashboard" className="btn-primary">
                      Panele Dön
                    </Link>
                    <Link href="/billing" className="btn-secondary">
                      Faturalama
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-primary">
                      Doğru Hesapla Giriş Yap
                    </Link>
                    <Link href="/" className="btn-secondary">
                      Ana Sayfa
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
