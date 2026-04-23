"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AuthToast({
  title,
  description,
  tone = "success"
}: {
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 4500);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 max-w-sm rounded-[24px] border px-5 py-4 shadow-soft backdrop-blur",
        tone === "success" && "border-emerald-200 bg-emerald-50/95 text-emerald-800",
        tone === "error" && "border-rose-200 bg-rose-50/95 text-rose-800",
        tone === "info" && "border-[color:var(--border)] bg-white/95 text-ink"
      )}
    >
      <div className="text-sm font-semibold">{title}</div>
      {description ? <div className="mt-1 text-sm leading-6">{description}</div> : null}
    </div>
  );
}
