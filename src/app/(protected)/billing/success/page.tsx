import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireBusinessAccess } from "@/lib/auth";
import { subscriptionPlanLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function BillingSuccessPage() {
  const session = await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });

  const business = await prisma.business.findUniqueOrThrow({
    where: {
      id: session.user.businessId
    }
  });

  return (
    <div className="space-y-6">
      <AppHeader
        title="Ödeme Başarılı"
        subtitle="PAYTR ödemesi alındı. Abonelik aktivasyonu callback ile tamamlanırken plan durumunuz kısa süre içinde güncellenecek."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="section-title">Ödeme Durumu</div>
          <div className="mt-5 rounded-[24px] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] p-5 text-white">
            <div className="text-sm text-white/70">Durum</div>
            <div className="mt-2 text-3xl font-bold">Payment successful</div>
            <div className="mt-2 text-sm text-white/75">Abonelik aktivasyonu başlatıldı</div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Abonelik Bilgisi</div>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-white/90 p-5">
              <div className="text-sm text-sage">Mevcut Plan</div>
              <div className="mt-2 text-2xl font-semibold text-ink">{subscriptionPlanLabels[business.subscriptionPlan]}</div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-5 text-sm leading-6 text-sage">
              Ödeme başarıyla alındı. PAYTR callback işlenirken aboneliğiniz aktive ediliyor. Plan durumu birkaç saniye içinde faturalama ve dashboard tarafında görünür hale gelir.
            </div>
            <Link href="/dashboard" className="btn-primary inline-flex">
              Dashboarda Dön
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}
