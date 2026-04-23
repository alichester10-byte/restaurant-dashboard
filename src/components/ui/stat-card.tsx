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

  if (isAccent) {
    return (
      <Panel className="overflow-hidden border-[rgba(20,33,27,0.08)] bg-white/95 p-2">
        <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#163329_0%,#214c3d_58%,#285745_100%)] px-5 py-5 text-white">
          <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_top_right,rgba(231,199,134,0.28),transparent_62%)]" />
          <div className="relative space-y-4">
            <div className="text-sm font-semibold tracking-[0.02em] text-[#f3d9a4]">{label}</div>
            <div className="flex items-end justify-between gap-3">
              <div className="text-3xl font-bold tracking-tight text-white">
                {typeof value === "number" && label.includes("Doluluk") ? formatPercent(value) : value}
              </div>
              {typeof trend === "number" ? (
                <div className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold text-[#fff5dc]">
                  {positive ? "+" : ""}
                  {Math.round(trend)}%
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="relative space-y-4">
        <div className="text-sm font-medium text-sage">{label}</div>
        <div className="flex items-end justify-between gap-3">
          <div className="text-3xl font-bold tracking-tight text-ink">
            {typeof value === "number" && label.includes("Doluluk") ? formatPercent(value) : value}
          </div>
          {typeof trend === "number" ? (
            <div
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
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
