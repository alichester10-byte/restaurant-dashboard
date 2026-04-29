import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function hasMatchingBusinessSession(paymentId?: string) {
  if (!paymentId) {
    return false;
  }

  const session = await getCurrentSession();
  if (!session) {
    return false;
  }

  const payment = await prisma.billingPayment.findFirst({
    where: {
      id: paymentId,
      businessId: session.user.businessId
    },
    select: {
      id: true
    }
  });

  return !!payment;
}

export default async function PublicBillingFailPage({
  searchParams
}: {
  searchParams?: { payment?: string };
}) {
  const canOpenBusinessPanel = await hasMatchingBusinessSession(searchParams?.payment);

  return (
    <main className="app-shell min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="text-xs uppercase tracking-[0.28em] text-sage">PAYTR Result</div>
          <div className="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
              <div className="text-sm text-rose-600">Ödeme Durumu</div>
              <div className="mt-2 font-[family-name:var(--font-display)] text-4xl text-rose-700">Ödeme başarısız</div>
              <div className="mt-3 text-sm leading-6 text-rose-700">Ödeme tamamlanamadı veya kullanıcı tarafından iptal edildi.</div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
                <div className="text-sm text-sage">Sonraki Adım</div>
                <p className="mt-4 text-sm leading-7 text-sage">
                  Güvenlik nedeniyle başarısız ödeme dönüşü de yalnızca doğru işletme oturumuyla eşleşirse panel kısayollarını gösterir. Farklı bir hesap açıksa otomatik giriş yapılmaz.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {canOpenBusinessPanel ? (
                  <>
                    <Link href="/billing" className="btn-secondary">
                      Tekrar Dene
                    </Link>
                    <Link href="/dashboard" className="btn-primary">
                      Dashboarda Dön
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
