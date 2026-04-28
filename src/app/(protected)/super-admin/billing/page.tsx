import { SubscriptionPlan, UserRole } from "@prisma/client";
import { manualPlanOverrideAction, markBillingIssueAction } from "@/actions/super-admin-actions";
import { AppHeader } from "@/components/layout/app-header";
import { SuperAdminControlNav } from "@/components/super-admin/control-center-nav";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { billingPaymentStatusLabels, subscriptionPlanLabels, subscriptionStatusLabels } from "@/lib/constants";
import { getSuperAdminBillingCenterData } from "@/lib/super-admin";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminBillingPage() {
  const session = await requireSuperAdmin();
  const data = await getSuperAdminBillingCenterData();

  return (
    <div className="space-y-6">
      <AppHeader
        title="Billing & Planlar"
        subtitle="Trial bitişleri, Pro durumu, ödeme sorunları ve manuel plan override işlemleri."
        businessName={session.user.business.name}
        role={UserRole.SUPER_ADMIN}
      />
      <SuperAdminControlNav />

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <div className="section-title">İşletme Planları</div>
          <div className="mt-5 space-y-4">
            {data.businesses.map((business) => (
              <div key={business.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="font-semibold text-ink">{business.name}</div>
                    <div className="mt-1 text-sm text-sage">
                      {subscriptionPlanLabels[business.subscriptionPlan]} • {subscriptionStatusLabels[business.subscriptionStatus]}
                    </div>
                    <div className="mt-2 text-sm text-sage">
                      Trial: {business.trialEndsAt ? formatDateTime(business.trialEndsAt) : "Tanımsız"} • Son ödeme:{" "}
                      {business.billingPayments[0] ? billingPaymentStatusLabels[business.billingPayments[0].status] : "Kayıt yok"}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <form action={manualPlanOverrideAction}>
                      <input type="hidden" name="businessId" value={business.id} />
                      <input type="hidden" name="redirectTo" value="/super-admin/billing" />
                      <select className="field" name="plan" defaultValue={business.subscriptionPlan}>
                        {Object.values(SubscriptionPlan).map((plan) => (
                          <option key={plan} value={plan}>
                            {subscriptionPlanLabels[plan]}
                          </option>
                        ))}
                      </select>
                      <button className="btn-secondary mt-3 w-full" type="submit">
                        Planı Güncelle
                      </button>
                    </form>
                    <form action={markBillingIssueAction}>
                      <input type="hidden" name="businessId" value={business.id} />
                      <input type="hidden" name="redirectTo" value="/super-admin/billing" />
                      <button className="btn-danger w-full" type="submit">
                        Ödeme Sorunu İşaretle
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Başarısız Ödemeler</div>
          <div className="mt-5 space-y-4">
            {data.failedPayments.map((payment) => (
              <div key={payment.id} className="rounded-[24px] border border-rose-200 bg-rose-50 p-5">
                <div className="font-semibold text-rose-900">{payment.business.name}</div>
                <div className="mt-1 text-sm text-rose-800">
                  {subscriptionPlanLabels[payment.plan]} • {billingPaymentStatusLabels[payment.status]}
                </div>
                <div className="mt-2 text-sm text-rose-800">
                  OID: {payment.merchantOid} • {formatDateTime(payment.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
