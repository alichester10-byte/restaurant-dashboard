"use client";

import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const businessItems = [
  { href: "/dashboard" as Route, label: "Genel Bakış", short: "GB" },
  { href: "/reservations" as Route, label: "Rezervasyonlar", short: "RZ" },
  { href: "/tables" as Route, label: "Masa Planı", short: "MP" },
  { href: "/customers" as Route, label: "Müşteriler", short: "MS" },
  { href: "/reports" as Route, label: "Raporlar", short: "RP" },
  { href: "/billing" as Route, label: "Faturalama", short: "BL" },
  { href: "/settings" as Route, label: "Ayarlar", short: "AY" }
];

const superAdminItems = [
  { href: "/super-admin" as Route, label: "İşletmeler", short: "SA" },
  { href: "/onboarding" as Route, label: "Onboarding", short: "OB" }
];

export function Sidebar({
  role,
  businessName
}: {
  role: UserRole;
  businessName: string;
}) {
  const pathname = usePathname();
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
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                active ? "bg-moss text-white" : "text-ink hover:bg-white"
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-2xl text-xs",
                  active ? "bg-white/15" : "bg-[color:var(--accent-soft)] text-moss"
                )}
              >
                {item.short}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[28px] bg-[color:var(--bg-strong)] p-4">
        <div className="text-xs uppercase tracking-[0.24em] text-sage">Canlı Not</div>
        <p className="mt-3 text-sm leading-6 text-ink">
          {role === UserRole.SUPER_ADMIN
            ? "Yeni işletme oluşturma ve abonelik geçişleri bu panelden yönetilir."
            : "Cuma akşamı rezervasyon doluluk seviyesi yüksek. Teras blokları için teyit çağrılarını öne alın."}
        </p>
      </div>
    </aside>
  );
}
