import { AuditCategory, AuditSeverity, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createAuditLog(input: {
  businessId?: string | null;
  actorUserId?: string | null;
  actorRole?: UserRole | null;
  category: AuditCategory;
  action: string;
  message: string;
  severity?: AuditSeverity;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      businessId: input.businessId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      actorRole: input.actorRole ?? undefined,
      category: input.category,
      action: input.action,
      message: input.message,
      severity: input.severity ?? AuditSeverity.INFO,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: input.ipAddress ?? undefined
    }
  });
}

export async function safeCreateAuditLog(input: {
  businessId?: string | null;
  actorUserId?: string | null;
  actorRole?: UserRole | null;
  category: AuditCategory;
  action: string;
  message: string;
  severity?: AuditSeverity;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}) {
  try {
    await createAuditLog(input);
  } catch (error) {
    console.error("[audit:write_failed]", {
      action: input.action,
      category: input.category,
      error: error instanceof Error ? error.message : "unknown_error"
    });
  }
}
