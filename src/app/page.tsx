import { UserRole } from "@prisma/client";
import type { Route } from "next";
import { HomeRedirect } from "@/components/home/home-redirect";
import { hasBusinessAccess } from "@/lib/billing";
import { getCurrentSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getCurrentSession();
  const href: Route = session
    ? session.user.role === UserRole.SUPER_ADMIN
      ? "/super-admin"
      : hasBusinessAccess(session.user.business, session.user.role)
        ? "/dashboard"
        : "/billing"
    : "/login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f2e8_0%,#efe7d8_100%)] px-6">
      <HomeRedirect href={href} />
      <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-10 text-center shadow-[0_30px_120px_rgba(44,62,45,0.12)] backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">Limon Masa</div>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-ink">
          Restoran operasyonları için tek merkez
        </h1>
        <p className="mt-4 text-base leading-7 text-sage">
          Güvenli yönlendirme hazırlanıyor. Birkaç saniye içinde hesabınıza geçeceksiniz.
        </p>
      </div>
    </main>
  );
}
