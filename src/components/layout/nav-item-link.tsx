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
          "relative rounded-2xl px-3 py-2 text-center text-xs font-semibold transition-all duration-200",
          active ? "bg-moss text-white shadow-soft" : "bg-white text-ink hover:-translate-y-0.5 hover:bg-[color:var(--accent-soft)]",
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
        "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200",
        active ? "bg-moss text-white shadow-soft" : "text-ink hover:-translate-y-0.5 hover:bg-white hover:shadow-soft",
        pending && !active ? "bg-[color:var(--accent-soft)] text-moss" : ""
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-2xl text-xs transition-colors",
          active ? "bg-white/15" : "bg-[color:var(--accent-soft)] text-moss",
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
