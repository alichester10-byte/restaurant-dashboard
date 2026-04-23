import type { Route } from "next";
import Link from "next/link";

export function DemoModeBanner({
  title = "Demo modunda keşif açıktır, kayıt kapalıdır.",
  description = "Paneli gerçek restoran akışıyla inceleyebilirsiniz. Yeni kayıt oluşturmak, güncellemek veya veri kaydetmek için Pro planını etkinleştirin.",
  ctaLabel = "Pro'ya Geç",
  href = "/billing?upgrade=demo-banner" as Route
}: {
  title?: string;
  description?: string;
  ctaLabel?: string;
  href?: Route;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[rgba(201,152,57,0.22)] bg-[linear-gradient(135deg,rgba(201,152,57,0.12)_0%,rgba(255,255,255,0.92)_48%,rgba(33,76,61,0.08)_100%)] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">Demo Modu</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-sage">{description}</p>
        </div>
        <Link href={href} className="btn-primary shrink-0">
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
