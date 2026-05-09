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
    <header className="glass-panel flex flex-col gap-4 rounded-[26px] p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] uppercase tracking-[0.14em] text-sage">{formatDate(new Date())}</div>
            {modeLabel ? <span className="rounded-full border border-[color:var(--border)] bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sage">{modeLabel}</span> : null}
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[26px] leading-[1.1] text-ink md:text-[30px]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-sage">{subtitle}</p>
          {businessName ? (
            <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">
              {role === UserRole.SUPER_ADMIN ? "Platform Workspace" : businessName}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          {showUpgradeCta ? (
            <Link href="/billing?upgrade=header" className="btn-primary min-w-[140px]">
              Pro&apos;ya Geç
            </Link>
          ) : null}
          <form action={logoutAction}>
            <button className="btn-secondary min-w-[120px]" type="submit">
              Çıkış Yap
            </button>
          </form>
        </div>
      </div>

      {modeLabel || modeDescription ? (
        <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[22px] border border-[color:var(--border)] bg-white/92 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Durum özeti</div>
            <div className="mt-2 text-base font-semibold text-ink">{modeLabel}</div>
            {modeDescription ? <div className="mt-1 text-sm leading-6 text-sage">{modeDescription}</div> : null}
          </div>
          <div className="rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(243,237,227,0.88)_100%)] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Operasyon odağı</div>
            <div className="mt-2 text-sm leading-6 text-ink">
              Bugünkü görünüm; özet metrikleri, bekleyen aksiyonları ve ekipte dikkat isteyen alanları tek üst blokta toplar.
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
