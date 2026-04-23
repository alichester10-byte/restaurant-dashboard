import { requireAuth } from "@/lib/auth";
import { getBusinessEntitlement } from "@/lib/billing";
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
          {children}
        </div>
      </div>
    </main>
  );
}
