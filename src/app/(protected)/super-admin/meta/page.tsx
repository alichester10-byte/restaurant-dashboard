import { UserRole } from "@prisma/client";
import {
  resetBusinessIntegrationStatusAction,
  runMetaDiagnosticsAction,
  testWebhookEndpointAction,
  updatePlatformConfigAction
} from "@/actions/super-admin-actions";
import { AppHeader } from "@/components/layout/app-header";
import { SuperAdminControlNav } from "@/components/super-admin/control-center-nav";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { integrationProviderLabels, integrationStatusLabels } from "@/lib/constants";
import { getSuperAdminMetaCenterData } from "@/lib/super-admin";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminMetaPage() {
  const session = await requireSuperAdmin();
  const data = await getSuperAdminMetaCenterData();

  return (
    <div className="space-y-6">
      <AppHeader
        title="Meta / WhatsApp / Instagram"
        subtitle="Env tanıları, webhook sağlığı, WABA/telefon numarası eşleşmeleri ve business bazlı bağlantı durumları."
        businessName={session.user.business.name}
        role={UserRole.SUPER_ADMIN}
      />
      <SuperAdminControlNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Meta App ID", value: data.masked.appId },
          { label: "Config ID", value: data.masked.configId },
          { label: "Verify Token", value: data.masked.verifyToken },
          { label: "App Secret", value: data.masked.appSecret },
          { label: "Access Token", value: data.masked.accessToken }
        ].map((item) => (
          <Panel key={item.label}>
            <div className="text-sm text-sage">{item.label}</div>
            <div className="mt-2 break-all text-sm font-semibold text-ink">{item.value}</div>
          </Panel>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="section-title">Tanı Merkezi</div>
          <div className="mt-5 space-y-3">
            {data.diagnostics.diagnostics.map((item) => (
              <div key={item.key} className="rounded-2xl border border-[color:var(--border)] bg-white/90 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-ink">{item.key}</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-sage">{item.level}</div>
                </div>
                <div className="mt-2 text-sm text-sage">{item.message}</div>
                <div className="mt-2 text-xs text-ink">{item.maskedValue}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <form action={runMetaDiagnosticsAction}>
              <input type="hidden" name="redirectTo" value="/super-admin/meta" />
              <button className="btn-secondary w-full" type="submit">
                Meta Tanısını Çalıştır
              </button>
            </form>
            <form action={testWebhookEndpointAction}>
              <input type="hidden" name="redirectTo" value="/super-admin/meta" />
              <button className="btn-secondary w-full" type="submit">
                Webhook Endpoint Testi
              </button>
            </form>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Manuel Durum Alanları</div>
          <form action={updatePlatformConfigAction} className="mt-5 space-y-4">
            <input type="hidden" name="redirectTo" value="/super-admin/meta" />
            <input type="hidden" name="companyName" value={data.platformConfig.companyName} />
            <input type="hidden" name="contactEmail" value={data.platformConfig.contactEmail} />
            <input type="hidden" name="privacyPolicyVersion" value={data.platformConfig.privacyPolicyVersion} />
            <input type="hidden" name="termsVersion" value={data.platformConfig.termsVersion} />
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Domain Verification</span>
              <input className="field" name="metaDomainVerificationStatus" defaultValue={data.platformConfig.metaDomainVerificationStatus ?? ""} placeholder="Verified / pending" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Business Verification</span>
              <input className="field" name="metaBusinessVerificationStatus" defaultValue={data.platformConfig.metaBusinessVerificationStatus ?? ""} placeholder="Approved / pending" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">App Review</span>
              <input className="field" name="metaAppReviewStatus" defaultValue={data.platformConfig.metaAppReviewStatus ?? ""} placeholder="Live / review required" />
            </label>
            <button className="btn-primary w-full" type="submit">
              Meta Durumlarını Kaydet
            </button>
          </form>
        </Panel>
      </section>

      <Panel>
        <div className="section-title">Bağlı İşletme Kanalları</div>
        <div className="mt-5 space-y-4">
          {data.connections.map((connection) => (
            <div key={connection.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="font-semibold text-ink">{connection.business.name}</div>
                  <div className="mt-1 text-sm text-sage">
                    {integrationProviderLabels[connection.provider]} • {integrationStatusLabels[connection.status]}
                  </div>
                  <div className="mt-2 text-sm text-sage">
                    WABA: {connection.wabaId ?? "-"} • Phone: {connection.phoneNumberId ?? "-"} • Son webhook:{" "}
                    {connection.lastWebhookReceivedAt ? formatDateTime(connection.lastWebhookReceivedAt) : "Yok"}
                  </div>
                  {connection.errorMessage ? <div className="mt-2 text-sm text-rose-700">{connection.errorMessage}</div> : null}
                </div>
                <form action={resetBusinessIntegrationStatusAction}>
                  <input type="hidden" name="businessId" value={connection.businessId} />
                  <input type="hidden" name="redirectTo" value="/super-admin/meta" />
                  <button className="btn-secondary" type="submit">
                    İşletme Bağlantısını Sıfırla
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
