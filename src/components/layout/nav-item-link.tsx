"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function NavItemLink({
  href,
  label,
  short,
  compact = false
}: {
  href: Route;
  label: string;
  short?: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  if (compact) {
    return (
      <Link
        href={href}
        onClick={() => setPending(true)}
        className={cn(
          "relative rounded-2xl border px-3 py-2.5 text-center text-xs font-medium transition-all duration-200",
          active
            ? "border-emerald-200 bg-emerald-50 text-moss shadow-[inset_0_0_0_1px_rgba(33,76,61,0.04)]"
            : "border-[color:var(--border)] bg-white/92 text-ink hover:-translate-y-0.5 hover:bg-[color:var(--accent-soft)] hover:shadow-soft",
          pending && !active ? "bg-[color:var(--accent-soft)] text-moss" : ""
        )}
      >
        <span className="inline-flex items-center gap-2">
          {pending && !active ? <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> : null}
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => setPending(true)}
      className={cn(
        "group relative flex items-center gap-3 rounded-[18px] px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-emerald-50 text-moss"
          : "text-ink hover:bg-white/90 hover:text-moss",
        pending && !active ? "bg-[color:var(--accent-soft)] text-moss" : ""
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all",
          active ? "bg-moss" : "bg-transparent group-hover:bg-moss/20"
        )}
      />
      <span
        className={cn(
          "grid h-8 w-8 place-items-center rounded-[12px] text-[11px] transition-colors",
          active ? "bg-white text-moss shadow-[0_1px_2px_rgba(20,33,27,0.05)]" : "bg-[color:var(--accent-soft)] text-moss",
          pending && !active ? "bg-white text-moss" : ""
        )}
      >
        {pending && !active ? "..." : short}
      </span>
      <span className="inline-flex items-center gap-2">
        {label}
        {pending && !active ? <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> : null}
      </span>
    </Link>
  );
}
