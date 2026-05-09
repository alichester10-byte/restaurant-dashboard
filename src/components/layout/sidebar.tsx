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
  const businessSections = [
    {
      title: "Operasyon",
      items: [
        { href: "/dashboard" as Route, label: "Genel Bakış", short: "GB" },
        { href: "/reservations" as Route, label: labels.reservations, short: "RZ" },
        { href: "/tables" as Route, label: labels.tables, short: "MP" },
        { href: "/customers" as Route, label: labels.customers, short: "MS" }
      ]
    },
    {
      title: "Büyüme",
      items: [
        { href: "/integrations" as Route, label: labels.integrations, short: "KN" },
        { href: "/reports" as Route, label: "Raporlar", short: "RP" },
        { href: "/billing" as Route, label: "Faturalama", short: "BL" }
      ]
    },
    {
      title: "Yönetim",
      items: [
        { href: "/security" as Route, label: "Güvenlik", short: "GV" },
        { href: "/settings" as Route, label: "Ayarlar", short: "AY" }
      ]
    }
  ];
  const superAdminSections = [
    {
      title: "Platform",
      items: superAdminItems.slice(0, 3)
    },
    {
      title: "Kontrol",
      items: superAdminItems.slice(3, 6)
    },
    {
      title: "Kayıtlar",
      items: superAdminItems.slice(6)
    }
  ];
  const sections = role === UserRole.SUPER_ADMIN ? superAdminSections : businessSections;

  return (
    <aside className="glass-panel hidden w-[268px] shrink-0 rounded-[30px] p-3 lg:flex lg:flex-col">
      <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(145deg,#214c3d_0%,#172f27_100%)] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">{role === UserRole.SUPER_ADMIN ? "Platform" : industry.displayName}</div>
            <div className="mt-1.5 text-base font-semibold leading-tight">{businessName}</div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
            {modeLabel}
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-6 text-white/72">
          {role === UserRole.SUPER_ADMIN
            ? "İşletmeleri, trial durumlarını ve abonelik planlarını tek panelden yönetin."
            : `${industry.requestLabelPlural}, kanal akışları ve ${industry.primaryResourceLabelPlural.toLocaleLowerCase("tr-TR")} tek merkezden yönetin.`}
        </p>
      </div>

      <nav className="mt-4 flex-1 space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sage/80">{section.title}</div>
            <div className="space-y-1 rounded-[20px] border border-[color:var(--border)] bg-white/45 p-1.5">
              {section.items.map((item) => (
                <NavItemLink key={item.href} href={item.href} label={item.label} short={item.short} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(243,237,227,0.92)_100%)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-sage">AI Operasyon Asistanı</div>
          <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-[10px] font-semibold text-moss">Hazır</span>
        </div>
        <p className="mt-2.5 text-[13px] leading-6 text-ink">
          {role === UserRole.SUPER_ADMIN
            ? "Yeni işletmeleri açın, plan geçişlerini yönetin ve tüm portföyü tek merkezden izleyin."
            : canWrite
              ? `Canlı ${industry.reservationLabel.toLocaleLowerCase("tr-TR")} akışı, ${industry.primaryResourceLabelPlural.toLocaleLowerCase("tr-TR")} ve ayarlar üzerinde tam kontrol sizde.`
              : "Ürünü gerçek verilerle keşfedin. Kayıt oluşturma ve güncelleme akışlarını açmak için Pro'ya geçin."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/reservations" className="btn-secondary flex-1">
            Talepleri Gör
          </Link>
          {role !== UserRole.SUPER_ADMIN && !canWrite ? (
            <Link href="/billing?upgrade=sidebar" className="btn-primary flex-1">
              Pro&apos;ya Geç
            </Link>
          ) : (
            <Link href="/integrations#ai-assistant-testing" className="btn-primary flex-1">
              Asistanı Aç
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
