"use client";

import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const businessItems = [
  { href: "/dashboard" as Route, label: "Panel" },
  { href: "/reservations" as Route, label: "Rezervasyon" },
  { href: "/tables" as Route, label: "Masalar" },
  { href: "/customers" as Route, label: "Müşteriler" },
  { href: "/billing" as Route, label: "Billing" },
  { href: "/reports" as Route, label: "Raporlar" },
  { href: "/settings" as Route, label: "Ayarlar" }
];

const superAdminItems = [
  { href: "/super-admin" as Route, label: "İşletmeler" },
  { href: "/onboarding" as Route, label: "Onboarding" }
];

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = role === UserRole.SUPER_ADMIN ? superAdminItems : businessItems;

  return (
    <div className="glass-panel grid grid-cols-3 gap-2 rounded-[28px] p-3 lg:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-2xl px-3 py-2 text-center text-xs font-semibold",
            pathname === item.href ? "bg-moss text-white" : "bg-white text-ink"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
