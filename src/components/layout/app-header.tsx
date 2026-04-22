import { UserRole } from "@prisma/client";
import { logoutAction } from "@/actions/auth-actions";
import { formatDate } from "@/lib/utils";

export function AppHeader({
  title,
  subtitle,
  businessName,
  role
}: {
  title: string;
  subtitle: string;
  businessName?: string;
  role?: UserRole;
}) {
  return (
    <header className="glass-panel flex flex-col gap-4 rounded-[28px] p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-sage">{formatDate(new Date())}</div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">{title}</h1>
        <p className="mt-1 text-sm text-sage">{subtitle}</p>
        {businessName ? (
          <div className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-sage">
            {role === UserRole.SUPER_ADMIN ? "Platform Workspace" : businessName}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-sage">
          Bugün • Akşam Servisi
        </div>
        <form action={logoutAction}>
          <button className="btn-secondary" type="submit">
            Çıkış Yap
          </button>
        </form>
      </div>
    </header>
  );
}
