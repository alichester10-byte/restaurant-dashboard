import "server-only";

import { AuditCategory, ReservationRequestStatus, ReservationSource } from "@prisma/client";
import { extractReservationRequest } from "@/lib/ai-reservation";
import { safeCreateAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function createPendingReservationRequestFromExternalMessage(input: {
  businessId: string;
  source: ReservationSource;
  rawMessage: string;
  sourceConversationId?: string | null;
  sourceMessageId?: string | null;
  guestPhoneHint?: string | null;
  notes?: string | null;
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

  const extracted = await extractReservationRequest(input.rawMessage, input.source);
  const request = await prisma.reservationRequest.create({
    data: {
      businessId: input.businessId,
      source: input.source,
      status: ReservationRequestStatus.PENDING,
      sourceConversationId: input.sourceConversationId ?? null,
      sourceMessageId: input.sourceMessageId ?? null,
      guestName: extracted.guestName || "Yeni talep",
      guestPhone: extracted.guestPhone ?? input.guestPhoneHint ?? null,
      requestedDate: extracted.requestedDate,
      requestedTime: extracted.requestedTime,
      guestCount: extracted.guestCount,
      notes: input.notes ?? extracted.notes ?? null,
      extractedData: extracted,
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
