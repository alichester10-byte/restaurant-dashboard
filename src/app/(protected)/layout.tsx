import { requireAuth } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
import { stopImpersonationAction } from "@/actions/super-admin-actions";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);

  return (
    <main className="app-shell min-h-screen p-4 md:p-6">
      <div className="mx-auto flex max-w-[1560px] gap-6">
        <Sidebar
          role={session.user.role}
          businessName={session.user.business.name}
          modeLabel={entitlement.modeLabel}
          canWrite={entitlement.canWrite}
        />
        <div className="min-w-0 flex-1 space-y-4 md:space-y-6">
          <MobileNav role={session.user.role} modeLabel={entitlement.modeLabel} canWrite={entitlement.canWrite} />
          {session.impersonatedByUserId ? (
            <div className="glass-panel flex flex-col gap-3 rounded-[24px] border border-amber-200 bg-amber-50/90 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">İmpersonation</div>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Bu oturum süper admin tarafından işletme görünümüyle açıldı. Dilediğiniz an güvenli şekilde süper admin paneline dönebilirsiniz.
                </p>
              </div>
              <form action={stopImpersonationAction}>
                <button className="btn-secondary" type="submit">
                  Süper Admin&apos;e Dön
                </button>
              </form>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </main>
  );
}
