import { ComplianceRequestStatus, ComplianceRequestType, UserRole } from "@prisma/client";
import { createComplianceRequestAction, updateComplianceRequestStatusAction, updatePlatformConfigAction } from "@/actions/super-admin-actions";
import { AppHeader } from "@/components/layout/app-header";
import { SuperAdminControlNav } from "@/components/super-admin/control-center-nav";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { getSuperAdminLegalCenterData } from "@/lib/super-admin";
import { formatDateTime } from "@/lib/utils";

export default async function SuperAdminLegalPage() {
  const session = await requireSuperAdmin();
  const data = await getSuperAdminLegalCenterData();

  return (
    <div className="space-y-6">
      <AppHeader
        title="Hukuk & Veri Uyum Merkezi"
        subtitle="Gizlilik, kullanım şartları, veri talepleri, silme/ihracat süreçleri ve şirket iletişim bilgileri."
        businessName={session.user.business.name}
        role={UserRole.SUPER_ADMIN}
      />
      <SuperAdminControlNav />

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <div className="section-title">Platform & Yasal Görünürlük</div>
          <form action={updatePlatformConfigAction} className="mt-5 space-y-4">
            <input type="hidden" name="redirectTo" value="/super-admin/legal" />
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Şirket / Hukuki Ünvan</span>
              <input className="field" name="companyName" defaultValue={data.platformConfig.companyName} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">İletişim E-postası</span>
              <input className="field" type="email" name="contactEmail" defaultValue={data.platformConfig.contactEmail} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">İş Adresi</span>
              <textarea className="field min-h-24" name="businessAddress" defaultValue={data.platformConfig.businessAddress ?? ""} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <input className="field" name="privacyPolicyVersion" defaultValue={data.platformConfig.privacyPolicyVersion} placeholder="Privacy version" />
              <input className="field" name="termsVersion" defaultValue={data.platformConfig.termsVersion} placeholder="Terms version" />
            </div>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Veri Silme Talep URL</span>
              <input className="field" name="dataDeletionRequestUrl" defaultValue={data.platformConfig.dataDeletionRequestUrl ?? ""} placeholder="https://..." />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Uyum Notları</span>
              <textarea className="field min-h-24" name="complianceNotes" defaultValue={data.platformConfig.complianceNotes ?? ""} />
            </label>
            <button className="btn-primary w-full" type="submit">
              Hukuk Bilgilerini Kaydet
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="section-title">Veri Talebi Oluştur</div>
          <form action={createComplianceRequestAction} className="mt-5 space-y-4">
            <input type="hidden" name="redirectTo" value="/super-admin/legal" />
            <div className="grid gap-4 md:grid-cols-2">
              <select className="field" name="type" defaultValue={ComplianceRequestType.EXPORT}>
                {Object.values(ComplianceRequestType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input className="field" name="subjectEmail" placeholder="Talep sahibi e-posta" />
            </div>
            <input className="field" name="businessId" placeholder="İşletme ID (opsiyonel)" />
            <input className="field" name="requestedByUserId" placeholder="Kullanıcı ID (opsiyonel)" />
            <textarea className="field min-h-24" name="notes" placeholder="Talep notu / kapsam" />
            <button className="btn-secondary w-full" type="submit">
              Talep Kaydı Aç
            </button>
          </form>
        </Panel>
      </section>

      <Panel>
        <div className="section-title">GDPR-Style Talep Takibi</div>
        <div className="mt-5 space-y-4">
          {data.complianceRequests.map((request) => (
            <div key={request.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="font-semibold text-ink">
                    {request.type} • {request.status}
                  </div>
                  <div className="mt-1 text-sm text-sage">
                    {request.subjectEmail ?? "E-posta yok"} • {request.business?.name ?? "Platform düzeyi"} • {formatDateTime(request.createdAt)}
                  </div>
                  {request.notes ? <div className="mt-2 text-sm text-sage">{request.notes}</div> : null}
                </div>
                <form action={updateComplianceRequestStatusAction} className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
                  <input type="hidden" name="id" value={request.id} />
                  <input type="hidden" name="redirectTo" value="/super-admin/legal" />
                  <select className="field" name="status" defaultValue={request.status}>
                    {Object.values(ComplianceRequestStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <input className="field" name="notes" defaultValue={request.notes ?? ""} placeholder="Durum notu" />
                  <button className="btn-secondary" type="submit">
                    Güncelle
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
