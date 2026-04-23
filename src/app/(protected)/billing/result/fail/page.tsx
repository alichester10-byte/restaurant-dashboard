import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireBusinessAccess } from "@/lib/auth";

export default async function BillingFailPage() {
  const session = await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });

  return (
    <div className="space-y-6">
      <AppHeader
        title="Ödeme Tamamlanmadı"
        subtitle="PAYTR kullanıcı dönüşü başarısız veya iptal edilmiş görünüyor. Detaylar callback sonrası ödeme geçmişine yansır."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      <Panel className="border-rose-200 bg-rose-50/80">
        <div className="section-title text-rose-600">Ödeme Başarısız</div>
        <p className="mt-4 text-sm leading-7 text-rose-700">
          Kart doğrulama, limit veya kullanıcı iptali nedeniyle ödeme tamamlanmamış olabilir. Faturalama ekranından yeni bir işlem başlatabilirsiniz.
        </p>
        <Link href="/billing" className="btn-secondary mt-6 inline-flex">
          Tekrar Dene
        </Link>
      </Panel>
    </div>
  );
}
