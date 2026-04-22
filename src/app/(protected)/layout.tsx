import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <main className="app-shell min-h-screen p-4 md:p-6">
      <div className="mx-auto flex max-w-[1560px] gap-6">
        <Sidebar />
        <div className="min-w-0 flex-1 space-y-4 md:space-y-6">
          <MobileNav />
          {children}
        </div>
      </div>
    </main>
  );
}
