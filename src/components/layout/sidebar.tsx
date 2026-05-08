"use client";

import Link from "next/link";
import type { Route } from "next";
import { BusinessType, UserRole } from "@prisma/client";
import { NavItemLink } from "@/components/layout/nav-item-link";
import { getIndustryConfig, getIndustrySidebarLabels } from "@/lib/industry-config";

const superAdminItems = [
  { href: "/super-admin" as Route, label: "Genel Bakış", short: "GB" },
  { href: "/super-admin/businesses" as Route, label: "İşletmeler", short: "IS" },
  { href: "/super-admin/users" as Route, label: "Kullanıcılar", short: "KR" },
  { href: "/super-admin/security" as Route, label: "Güvenlik", short: "GV" },
  { href: "/super-admin/meta" as Route, label: "Meta", short: "MT" },
  { href: "/super-admin/billing" as Route, label: "Faturalama", short: "BL" },
  { href: "/super-admin/legal" as Route, label: "Hukuk", short: "HK" },
  { href: "/super-admin/audit" as Route, label: "Audit", short: "AU" },
  { href: "/super-admin/system" as Route, label: "Sistem", short: "SY" }
];

export function Sidebar({
  role,
  businessName,
  businessType,
  modeLabel,
  canWrite
}: {
  role: UserRole;
  businessName: string;
  businessType?: BusinessType | null;
  modeLabel: string;
  canWrite: boolean;
}) {
  const labels = getIndustrySidebarLabels(businessType);
  const industry = getIndustryConfig(businessType);
  const businessItems = [
    { href: "/dashboard" as Route, label: "Genel Bakış", short: "GB" },
    { href: "/reservations" as Route, label: labels.reservations, short: "RZ" },
    { href: "/tables" as Route, label: labels.tables, short: "MP" },
    { href: "/customers" as Route, label: labels.customers, short: "MS" },
    { href: "/integrations" as Route, label: labels.integrations, short: "KN" },
    { href: "/reports" as Route, label: "Raporlar", short: "RP" },
    { href: "/security" as Route, label: "Güvenlik", short: "GV" },
    { href: "/billing" as Route, label: "Faturalama", short: "BL" },
    { href: "/settings" as Route, label: "Ayarlar", short: "AY" }
  ];
  const items = role === UserRole.SUPER_ADMIN ? superAdminItems : businessItems;

  return (
    <aside className="glass-panel hidden w-72 shrink-0 rounded-[32px] p-5 lg:flex lg:flex-col">
      <div className="rounded-[28px] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] p-5 text-white">
        <div className="text-xs uppercase tracking-[0.32em] text-white/60">{role === UserRole.SUPER_ADMIN ? "Platform" : `${industry.displayName} OS`}</div>
        <div className="mt-3 font-[family-name:var(--font-display)] text-3xl">{businessName}</div>
        <p className="mt-3 text-sm leading-6 text-white/75">
          {role === UserRole.SUPER_ADMIN
            ? "İşletmeleri, trial durumlarını ve abonelik planlarını tek panelden yönetin."
            : `${industry.requestLabelPlural}, kanal akışları ve ${industry.primaryResourceLabelPlural.toLocaleLowerCase("tr-TR")} tek merkezden yönetin.`}
        </p>
      </div>

      <nav className="mt-6 space-y-2">
        {items.map((item) => (
          <NavItemLink key={item.href} href={item.href} label={item.label} short={item.short} />
        ))}
      </nav>

      <div className="mt-auto rounded-[28px] bg-[color:var(--bg-strong)] p-4">
        <div className="text-xs uppercase tracking-[0.24em] text-sage">{modeLabel}</div>
        <p className="mt-3 text-sm leading-6 text-ink">
          {role === UserRole.SUPER_ADMIN
            ? "Yeni işletmeleri açın, plan geçişlerini yönetin ve tüm portföyü tek merkezden izleyin."
            : canWrite
              ? "Canlı rezervasyon, masa yönetimi ve ayarlar üzerinde tam kontrol sizde."
              : "Ürünü gerçek verilerle keşfedin. Kayıt oluşturma ve güncelleme akışlarını açmak için Pro'ya geçin."}
        </p>
        {role !== UserRole.SUPER_ADMIN && !canWrite ? (
          <Link href="/billing?upgrade=sidebar" className="btn-primary mt-4 w-full">
            Go Pro
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
