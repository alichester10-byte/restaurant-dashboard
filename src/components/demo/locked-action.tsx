import type { Route } from "next";
import { UpgradeButton } from "@/components/demo/upgrade-button";

export function LockedAction({
  title = "Bu işlem Pro planıyla açılır",
  description = "Demo modunda ekranları gezebilir, ancak verileri değiştiremezsiniz.",
  href = "/billing?upgrade=locked-action" as Route,
  ctaLabel = "Upgrade to Pro",
  fullWidth = false
}: {
  title?: string;
  description?: string;
  href?: Route;
  ctaLabel?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`rounded-[24px] border border-dashed border-[rgba(33,76,61,0.2)] bg-[color:var(--bg-strong)] p-4 ${fullWidth ? "w-full" : ""}`}>
      <div className="text-sm font-semibold text-ink">{title}</div>
      <p className="mt-2 text-sm leading-6 text-sage">{description}</p>
      <UpgradeButton className="mt-4" href={href} label={ctaLabel} title={title} description={description} />
    </div>
  );
}
