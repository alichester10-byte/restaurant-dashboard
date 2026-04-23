"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect } from "react";

export function UpgradeModal({
  open,
  onClose,
  title,
  description,
  href = "/billing?upgrade=modal" as Route
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  href?: Route;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[32px] border border-white/40 bg-white p-6 shadow-[0_32px_80px_rgba(20,33,27,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">Pro Gerekli</div>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-ink">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-sage">{description}</p>

        <div className="mt-6 rounded-[24px] bg-[color:var(--bg-strong)] p-4 text-sm leading-6 text-sage">
          Demo modunda ürünü özgürce keşfedebilirsiniz. Pro planı aktive edildiğinde bu işlem anında açılır.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={href} className="btn-primary flex-1" onClick={onClose}>
            Faturalamaya Git
          </Link>
          <button className="btn-secondary flex-1" type="button" onClick={onClose}>
            Keşfe Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
