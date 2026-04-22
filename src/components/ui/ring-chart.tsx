import { formatPercent } from "@/lib/utils";

export function RingChart({ value, label }: { value: number; label: string }) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  const angle = (normalized / 100) * 360;

  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#214c3d 0deg ${angle}deg, rgba(33,76,61,0.1) ${angle}deg 360deg)`
        }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-sm font-bold text-ink">
          {formatPercent(normalized)}
        </div>
      </div>
      <div>
        <div className="text-sm text-sage">{label}</div>
        <div className="mt-1 text-xl font-semibold text-ink">Salon doluluğu</div>
        <p className="mt-2 text-sm leading-6 text-sage">
          Kapasite kullanımını rezervasyon yüküne göre canlı olarak izleyin.
        </p>
      </div>
    </div>
  );
}
