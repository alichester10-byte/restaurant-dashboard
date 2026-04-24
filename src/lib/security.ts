import crypto from "node:crypto";
import { headers } from "next/headers";
import { AuditCategory, AuditSeverity } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

export function sanitizeText(input: FormDataEntryValue | null | undefined) {
  return String(input ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeNullableText(input: FormDataEntryValue | null | undefined) {
  const value = sanitizeText(input);
  return value.length > 0 ? value : "";
}

export function getRequestIp() {
  const value = headers().get("x-forwarded-for") ?? headers().get("x-real-ip");
  return value?.split(",")[0]?.trim() ?? null;
}

export function verifySameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function logSuspiciousActivity(input: {
  action: string;
  message: string;
  businessId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await createAuditLog({
    businessId: input.businessId,
    category: AuditCategory.SECURITY,
    severity: AuditSeverity.WARN,
    action: input.action,
    message: input.message,
    metadata: input.metadata
  });
}
