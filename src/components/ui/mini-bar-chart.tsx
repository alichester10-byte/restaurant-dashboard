import { cn } from "@/lib/utils";

export function MiniBarChart({
  items,
  color = "bg-moss"
}: {
  items: Array<{ label: string; total: number }>;
  color?: string;
}) {
  const max = Math.max(...items.map((item) => item.total), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-44 items-end gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="text-xs font-semibold text-sage">{item.total}</div>
            <div className="flex h-full w-full items-end">
              <div
                className={cn("w-full rounded-t-2xl", color)}
                style={{ height: `${Math.max(10, (item.total / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-3 text-center text-xs text-sage">
        {items.map((item) => (
          <div key={item.label}>{item.label}</div>
        ))}
      </div>
    </div>
  );
}
