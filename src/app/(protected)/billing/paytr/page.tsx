import { BillingPaymentStatus, UserRole } from "@prisma/client";
import { headers } from "next/headers";
import Link from "next/link";
import Script from "next/script";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { getPlanPricing } from "@/lib/billing";
import { requireBusinessAccess } from "@/lib/auth";
import { createPaytrIframeToken, formatMinorAmount, getRequestIp } from "@/lib/paytr";
import { prisma } from "@/lib/prisma";

export default async function PaytrPaymentPage({
  searchParams
}: {
  searchParams: { payment?: string };
}) {
  const session = await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });

  const paymentId = searchParams.payment;
  if (!paymentId) {
    throw new Error("payment id is required");
  }

  const payment = await prisma.billingPayment.findFirstOrThrow({
    where: {
      id: paymentId,
      businessId: session.user.businessId
    }
  });
  const business = await prisma.business.findUniqueOrThrow({
    where: {
      id: session.user.businessId
    },
    include: {
      settings: true
    }
  });

  const pricing = getPlanPricing(payment.plan);
  let iframeToken: string | null = null;
  let tokenError: string | null = null;

  if (payment.status === BillingPaymentStatus.PENDING) {
    try {
      const tokenResult = await createPaytrIframeToken({
        plan: payment.plan,
        merchantOid: payment.merchantOid,
        email: session.user.email,
        userName: session.user.name,
        userPhone: business.settings[0]?.phone ?? "+90 000 000 00 00",
        userAddress: business.settings[0]?.address ?? "Istanbul",
        userIp: getRequestIp(headers())
      });
      iframeToken = tokenResult.token;
    } catch (error) {
      tokenError = (error as Error).message;
    }
  }

  return (
    <div className="space-y-6">
      <AppHeader
        title="PAYTR Ödeme"
        subtitle="Ödeme formu PAYTR tarafından güvenli iframe içinde sunulur. Onay sonrası abonelik callback ile aktive edilir."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Panel>
          <div className="section-title">Ödeme Özeti</div>
          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] p-5 text-white">
              <div className="text-sm text-white/70">Plan</div>
              <div className="mt-2 text-3xl font-bold">{pricing.title}</div>
              <div className="mt-2 text-sm text-white/75">{pricing.amountLabel}</div>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4 text-sm leading-6 text-sage">
              Sipariş no: <span className="font-semibold text-ink">{payment.merchantOid}</span>
              <br />
              Tutar: <span className="font-semibold text-ink">{formatMinorAmount(payment.amountMinor)}</span>
              <br />
              Durum: <span className="font-semibold text-ink">{payment.status}</span>
            </div>

            <div className="rounded-2xl bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
              PAYTR başarılı ödeme dönüşü tek başına erişim açmaz; asıl aktivasyon callback ile yapılır. Bu yüzden kullanıcı başarılı sayfaya düşse bile panel erişimi callback tamamlandığında açılır.
            </div>

            <Link href="/billing" className="btn-secondary w-full text-center">
              Faturalamaya Dön
            </Link>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Güvenli Ödeme Formu</div>
          <div className="mt-5">
            {payment.status !== BillingPaymentStatus.PENDING ? (
              <div className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-5 text-sm leading-6 text-sage">
                Bu ödeme artık beklemede değil. Güncel durum için faturalama ekranına dönebilirsiniz.
              </div>
            ) : tokenError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-700">
                PAYTR iframe token oluşturulamadı: {tokenError}
              </div>
            ) : iframeToken ? (
              <div className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-white">
                <Script src="https://www.paytr.com/js/iframeResizer.min.js" strategy="afterInteractive" />
                <iframe
                  src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                  id="paytriframe"
                  frameBorder="0"
                  scrolling="no"
                  style={{ width: "100%", minHeight: "720px" }}
                  title="PAYTR Secure Payment"
                />
              </div>
            ) : null}
          </div>
        </Panel>
      </section>
    </div>
  );
}
