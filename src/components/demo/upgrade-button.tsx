"use client";

import type { Route } from "next";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { UpgradeModal } from "@/components/demo/upgrade-modal";

export function UpgradeButton({
  title,
  description,
  href = "/billing?upgrade=upgrade-button" as Route,
  label = "Pro'ya Geç",
  className,
  tone = "primary"
}: {
  title: string;
  description: string;
  href?: Route;
  label?: string;
  className?: string;
  tone?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={cn(
          tone === "primary" ? "btn-primary" : "btn-secondary",
          "cursor-pointer",
          className
        )}
        type="button"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <UpgradeModal open={open} onClose={() => setOpen(false)} title={title} description={description} href={href} />
    </>
  );
}
