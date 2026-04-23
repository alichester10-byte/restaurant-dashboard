import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppHeader } from "@/components/layout/app-header";
import { Panel } from "@/components/ui/panel";
import { requireBusinessAccess } from "@/lib/auth";

export default async function BillingSuccessPage() {
  const session = await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });

  return (
    <div className="space-y-6">
      <AppHeader
        title="Ödeme Alındı"
        subtitle="PAYTR kullanıcı dönüşü başarılı görünüyor. Asıl aktivasyon callback işlendiğinde faturalama ekranında görünür."
        businessName={session.user.business.name}
        role={session.user.role}
      />

      <Panel>
        <div className="section-title">Sonraki Adım</div>
        <p className="mt-4 text-sm leading-7 text-sage">
          Callback henüz birkaç saniye içinde işlenebilir. Plan durumunuzun aktifleştiğini doğrulamak için faturalama ekranına dönün.
        </p>
        <Link href="/billing" className="btn-primary mt-6 inline-flex">
          Faturalamaya Dön
        </Link>
      </Panel>
    </div>
  );
}
