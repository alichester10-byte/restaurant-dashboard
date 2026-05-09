"use client";

import Link from "next/link";
import type { Route } from "next";
import { BusinessType, UserRole } from "@prisma/client";
import { NavItemLink } from "@/components/layout/nav-item-link";
import { getIndustrySidebarLabels } from "@/lib/industry-config";

const superAdminItems = [
  { href: "/super-admin" as Route, label: "Genel Bakış" },
  { href: "/super-admin/businesses" as Route, label: "İşletmeler" },
  { href: "/super-admin/users" as Route, label: "Kullanıcılar" },
  { href: "/super-admin/security" as Route, label: "Güvenlik" },
  { href: "/super-admin/meta" as Route, label: "Meta" },
  { href: "/super-admin/billing" as Route, label: "Billing" },
  { href: "/super-admin/legal" as Route, label: "Hukuk" },
  { href: "/super-admin/audit" as Route, label: "Audit" },
  { href: "/super-admin/system" as Route, label: "Sistem" }
];

export function MobileNav({
  role,
  businessType,
  modeLabel,
  canWrite
}: {
  role: UserRole;
  businessType?: BusinessType | null;
  modeLabel: string;
  canWrite: boolean;
}) {
  const labels = getIndustrySidebarLabels(businessType);
  const businessItems = [
    { href: "/dashboard" as Route, label: "Genel Bakış" },
    { href: "/reservations" as Route, label: labels.reservations },
    { href: "/tables" as Route, label: labels.tables },
    { href: "/customers" as Route, label: labels.customers },
    { href: "/integrations" as Route, label: labels.integrations },
    { href: "/security" as Route, label: "Güvenlik" },
    { href: "/billing" as Route, label: "Faturalama" },
    { href: "/reports" as Route, label: "Raporlar" },
    { href: "/settings" as Route, label: "Ayarlar" }
  ];
  const items = role === UserRole.SUPER_ADMIN ? superAdminItems : businessItems;

  return (
    <div className="glass-panel space-y-3 rounded-[26px] p-3 lg:hidden">
      <div className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">{modeLabel}</div>
        {role !== UserRole.SUPER_ADMIN && !canWrite ? (
          <Link href="/billing?upgrade=mobile-nav" className="btn-primary px-3 py-2 text-xs">
            Go Pro
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <NavItemLink key={item.href} href={item.href} label={item.label} compact />
        ))}
      </div>
    </div>
  );
}
