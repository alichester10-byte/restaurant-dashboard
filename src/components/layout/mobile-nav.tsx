"use client";

import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { NavItemLink } from "@/components/layout/nav-item-link";

const businessItems = [
  { href: "/dashboard" as Route, label: "Panel" },
  { href: "/reservations" as Route, label: "Rezervasyon" },
  { href: "/tables" as Route, label: "Masalar" },
  { href: "/customers" as Route, label: "Müşteriler" },
  { href: "/integrations" as Route, label: "Kanallar" },
  { href: "/billing" as Route, label: "Faturalama" },
  { href: "/reports" as Route, label: "Raporlar" },
  { href: "/settings" as Route, label: "Ayarlar" }
];

const superAdminItems = [
  { href: "/super-admin" as Route, label: "İşletmeler" },
  { href: "/admin/security" as Route, label: "Güvenlik" },
  { href: "/onboarding" as Route, label: "Onboarding" }
];

export function MobileNav({
  role,
  modeLabel,
  canWrite
}: {
  role: UserRole;
  modeLabel: string;
  canWrite: boolean;
}) {
  const items = role === UserRole.SUPER_ADMIN ? superAdminItems : businessItems;

  return (
    <div className="glass-panel space-y-3 rounded-[28px] p-3 lg:hidden">
      <div className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">{modeLabel}</div>
        {role !== UserRole.SUPER_ADMIN && !canWrite ? (
          <Link href="/billing?upgrade=mobile-nav" className="btn-primary px-3 py-2 text-xs">
            Go Pro
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <NavItemLink key={item.href} href={item.href} label={item.label} compact />
        ))}
      </div>
    </div>
  );
}
