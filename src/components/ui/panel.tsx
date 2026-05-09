import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("glass-panel rounded-[28px] p-5 md:p-6", className)} {...props}>
      {children}
    </section>
  );
}
