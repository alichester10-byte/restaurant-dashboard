import Link from "next/link";
import type { Route } from "next";

const items = [
  { href: "/super-admin" as Route, label: "Genel Bakış" },
  { href: "/super-admin/businesses" as Route, label: "İşletmeler" },
  { href: "/super-admin/users" as Route, label: "Kullanıcılar" },
  { href: "/super-admin/security" as Route, label: "Güvenlik" },
  { href: "/super-admin/meta" as Route, label: "Meta" },
  { href: "/super-admin/billing" as Route, label: "Faturalama" },
  { href: "/super-admin/legal" as Route, label: "Hukuk & Veri" },
  { href: "/super-admin/audit" as Route, label: "Audit" },
  { href: "/super-admin/system" as Route, label: "Sistem" }
];

export function SuperAdminControlNav() {
  return (
    <div className="glass-panel rounded-[28px] p-3">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3 text-sm font-semibold text-ink transition hover:border-moss/30 hover:text-moss"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
