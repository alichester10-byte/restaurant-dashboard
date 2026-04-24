"use client";

import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { NavItemLink } from "@/components/layout/nav-item-link";

const businessItems = [
  { href: "/dashboard" as Route, label: "Genel Bakış", short: "GB" },
  { href: "/reservations" as Route, label: "Rezervasyonlar", short: "RZ" },
  { href: "/tables" as Route, label: "Masa Planı", short: "MP" },
  { href: "/customers" as Route, label: "Müşteriler", short: "MS" },
  { href: "/integrations" as Route, label: "Kanallar", short: "KN" },
  { href: "/reports" as Route, label: "Raporlar", short: "RP" },
  { href: "/billing" as Route, label: "Faturalama", short: "BL" },
  { href: "/settings" as Route, label: "Ayarlar", short: "AY" }
];

const superAdminItems = [
  { href: "/super-admin" as Route, label: "İşletmeler", short: "SA" },
  { href: "/admin/security" as Route, label: "Güvenlik", short: "GV" },
  { href: "/onboarding" as Route, label: "Onboarding", short: "OB" }
];

export function Sidebar({
  role,
  businessName,
  modeLabel,
  canWrite
}: {
  role: UserRole;
  businessName: string;
  modeLabel: string;
  canWrite: boolean;
}) {
  const items = role === UserRole.SUPER_ADMIN ? superAdminItems : businessItems;

  return (
    <aside className="glass-panel hidden w-72 shrink-0 rounded-[32px] p-5 lg:flex lg:flex-col">
      <div className="rounded-[28px] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] p-5 text-white">
        <div className="text-xs uppercase tracking-[0.32em] text-white/60">{role === UserRole.SUPER_ADMIN ? "Platform" : "Restaurant OS"}</div>
        <div className="mt-3 font-[family-name:var(--font-display)] text-3xl">{businessName}</div>
        <p className="mt-3 text-sm leading-6 text-white/75">
          {role === UserRole.SUPER_ADMIN
            ? "İşletmeleri, trial durumlarını ve abonelik planlarını tek panelden yönetin."
            : "Rezervasyon, çağrı ve masa operasyonlarını tek merkezden yönetin."}
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
