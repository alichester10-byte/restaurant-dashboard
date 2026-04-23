"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  variant = "primary"
}: {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();

  const variantClass =
    variant === "secondary" ? "btn-secondary" : variant === "danger" ? "btn-danger" : "btn-primary";

  return (
    <button className={cn(variantClass, "gap-2 disabled:cursor-not-allowed disabled:opacity-70", className)} type="submit" disabled={pending}>
      {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : null}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
