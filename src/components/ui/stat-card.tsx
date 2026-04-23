import { Panel } from "@/components/ui/panel";
import { cn, formatPercent } from "@/lib/utils";

export function StatCard({
  label,
  value,
  trend,
  tone = "default"
}: {
  label: string;
  value: string | number;
  trend?: number;
  tone?: "default" | "accent";
}) {
  const positive = (trend ?? 0) >= 0;
  const isAccent = tone === "accent";

  return (
    <Panel
      className={cn(
        "relative overflow-hidden",
        isAccent && "border-[rgba(20,33,27,0.12)] bg-[linear-gradient(135deg,#214c3d_0%,#172f27_100%)] text-white"
      )}
    >
      <div className={cn("absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl", isAccent ? "bg-white/12" : "bg-white/10")} />
      <div className="relative space-y-4">
        <div className={cn("text-sm font-medium", isAccent ? "text-white" : "text-sage")}>{label}</div>
        <div className="flex items-end justify-between gap-3">
          <div className={cn("text-3xl font-bold tracking-tight", isAccent ? "text-white" : "text-ink")}>
            {typeof value === "number" && label.includes("Doluluk") ? formatPercent(value) : value}
          </div>
          {typeof trend === "number" ? (
            <div
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                isAccent
                  ? positive
                    ? "bg-white/15 text-white"
                    : "bg-white/15 text-white"
                  : positive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
              )}
            >
              {positive ? "+" : ""}
              {Math.round(trend)}%
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
