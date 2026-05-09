import Link from "next/link";
import { UserRole } from "@prisma/client";
import { logoutAction } from "@/actions/auth-actions";
import { formatDate } from "@/lib/utils";

export function AppHeader({
  title,
  subtitle,
  businessName,
  role,
  modeLabel,
  modeDescription,
  showUpgradeCta
}: {
  title: string;
  subtitle: string;
  businessName?: string;
  role?: UserRole;
  modeLabel?: string;
  modeDescription?: string;
  showUpgradeCta?: boolean;
}) {
  return (
    <header className="glass-panel flex flex-col gap-4 rounded-[26px] p-5 md:flex-row md:items-start md:justify-between">
      <div className="max-w-3xl">
        <div className="text-[11px] uppercase tracking-[0.18em] text-sage">{formatDate(new Date())}</div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[30px] leading-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-sage">{subtitle}</p>
        {businessName ? (
          <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">
            {role === UserRole.SUPER_ADMIN ? "Platform Workspace" : businessName}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        {modeLabel ? (
          <div className="min-w-[200px] rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">{modeLabel}</div>
            {modeDescription ? <div className="mt-1 text-sm leading-6 text-sage">{modeDescription}</div> : null}
          </div>
        ) : null}
        {showUpgradeCta ? (
          <Link href="/billing?upgrade=header" className="btn-primary">
            Pro&apos;ya Geç
          </Link>
        ) : null}
        <form action={logoutAction}>
          <button className="btn-secondary" type="submit">
            Çıkış Yap
          </button>
        </form>
      </div>
    </header>
  );
}
