import "server-only";

import { AuditCategory, ReservationRequestStatus, ReservationSource } from "@prisma/client";
import { extractReservationRequest } from "@/lib/ai-reservation";
import { safeCreateAuditLog } from "@/lib/audit";
import { enforcePlanUsageLimit } from "@/lib/plan-config";
import { prisma } from "@/lib/prisma";

export async function createPendingReservationRequestFromExternalMessage(input: {
  businessId: string;
  source: ReservationSource;
  rawMessage: string;
  sourceConversationId?: string | null;
  sourceMessageId?: string | null;
  guestPhoneHint?: string | null;
  notes?: string | null;
  structuredData?: {
    guestName?: string | null;
    guestPhone?: string | null;
    customerEmail?: string | null;
    requestedDate?: string | null;
    requestedTime?: string | null;
    endDate?: string | null;
    guestCount?: number | null;
    serviceType?: string | null;
    serviceId?: string | null;
    staffId?: string | null;
    staffName?: string | null;
    resourcePreference?: string | null;
    resourceId?: string | null;
    resourceName?: string | null;
    durationMinutes?: number | null;
    notes?: string | null;
    businessType?: string | null;
  };
}) {
  if (input.sourceMessageId) {
    const existing = await prisma.reservationRequest.findFirst({
      where: {
        businessId: input.businessId,
        sourceMessageId: input.sourceMessageId
      }
    });

    if (existing) {
      return {
        request: existing,
        duplicate: true
      };
    }
  }

  await enforcePlanUsageLimit(input.businessId, "monthlyReservationRequests");

  const extracted = await extractReservationRequest(input.rawMessage, input.source, {
    businessType: input.structuredData?.businessType ?? undefined
  });
  const merged = {
    ...extracted,
    ...input.structuredData,
    guestName: input.structuredData?.guestName || extracted.guestName,
    guestPhone: input.structuredData?.guestPhone || extracted.guestPhone || input.guestPhoneHint || null,
    requestedDate: input.structuredData?.requestedDate || extracted.requestedDate,
    requestedTime: input.structuredData?.requestedTime || extracted.requestedTime,
    guestCount: input.structuredData?.guestCount ?? extracted.guestCount,
    notes: input.structuredData?.notes || input.notes || extracted.notes || null
  };
  const request = await prisma.reservationRequest.create({
    data: {
      businessId: input.businessId,
      source: input.source,
      status: ReservationRequestStatus.PENDING,
      sourceConversationId: input.sourceConversationId ?? null,
      sourceMessageId: input.sourceMessageId ?? null,
      guestName: merged.guestName || "Yeni talep",
      guestPhone: merged.guestPhone ?? null,
      requestedDate: merged.requestedDate ?? null,
      requestedTime: merged.requestedTime ?? null,
      guestCount: merged.guestCount ?? null,
      notes: merged.notes ?? null,
      extractedData: merged,
      confidenceScore: extracted.confidenceScore,
      rawMessage: input.rawMessage
    }
  });

  await safeCreateAuditLog({
    businessId: input.businessId,
    category: AuditCategory.WEBHOOK,
    action: "external_message_received",
    message: "External message received and analyzed for reservation intent.",
    targetType: "ReservationRequest",
    targetId: request.id,
    metadata: {
      source: input.source,
      sourceMessageId: input.sourceMessageId
    }
  });

  await safeCreateAuditLog({
    businessId: input.businessId,
    category: AuditCategory.INTEGRATION,
    action: "pending_request_created",
    message: "Pending reservation request created from external message.",
    targetType: "ReservationRequest",
    targetId: request.id,
    metadata: {
      source: input.source
    }
  });

  return {
    request,
    duplicate: false
  };
}
