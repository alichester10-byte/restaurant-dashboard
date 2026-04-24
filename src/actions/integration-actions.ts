"use server";

import { AuditCategory, IntegrationProvider, IntegrationStatus, ReservationRequestStatus, ReservationStatus, ReservationSource, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessAccess, requireBusinessWriteAccess } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { sanitizeNullableText } from "@/lib/security";
import { reservationRequestReviewSchema } from "@/lib/validation";

export async function configureIntegrationAction(formData: FormData) {
  const session = await requireBusinessAccess({
    roles: [UserRole.BUSINESS_ADMIN]
  });
  const businessId = session.user.businessId;
  const provider = formData.get("provider") as IntegrationProvider;

  if (!Object.values(IntegrationProvider).includes(provider)) {
    redirect("/integrations?error=integration_invalid");
  }

  await prisma.integrationConnection.upsert({
    where: {
      businessId_provider: {
        businessId,
        provider
      }
    },
    update: {
      status: IntegrationStatus.NEEDS_CONFIGURATION
    },
    create: {
      businessId,
      provider,
      status: IntegrationStatus.NEEDS_CONFIGURATION
    }
  });

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.INTEGRATION,
    action: "integration_config_requested",
    message: "Business admin opened integration configuration.",
    metadata: { provider }
  });

  revalidatePath("/integrations");
  redirect(`/integrations?configured=${provider}`);
}

export async function reviewReservationRequestAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN, UserRole.STAFF],
    feature: "integrations"
  });
  const businessId = session.user.businessId;

  const parsed = reservationRequestReviewSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    reason: sanitizeNullableText(formData.get("reason")),
    redirectTo: formData.get("redirectTo") ?? "/integrations"
  });

  if (!parsed.success) {
    redirect("/integrations?error=request_review");
  }

  const request = await prisma.reservationRequest.findFirst({
    where: {
      id: parsed.data.requestId,
      businessId
    }
  });

  if (!request) {
    redirect(`${parsed.data.redirectTo}?error=request_missing`);
  }

  if (parsed.data.decision === ReservationRequestStatus.REJECTED) {
    await prisma.reservationRequest.update({
      where: { id: request.id },
      data: {
        status: ReservationRequestStatus.REJECTED,
        reviewReason: parsed.data.reason || null,
        reviewedByUserId: session.user.id
      }
    });

    await createAuditLog({
      businessId,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.INTEGRATION,
      action: "reservation_request_rejected",
      message: "Pending reservation request rejected.",
      targetType: "ReservationRequest",
      targetId: request.id
    });

    revalidatePath("/integrations");
    revalidatePath("/reservations");
    redirect(`${parsed.data.redirectTo}?saved=rejected`);
  }

  const phone = request.guestPhone?.trim() || `request-${request.id.slice(-6)}`;
  const customer = await prisma.customer.upsert({
    where: {
      businessId_phone: {
        businessId,
        phone
      }
    },
    update: {},
    create: {
      businessId,
      name: request.guestName,
      phone
    }
  });

  const requestedDate = request.requestedDate ?? new Date().toISOString().slice(0, 10);
  const requestedTime = request.requestedTime ?? "19:30";
  const startAt = new Date(`${requestedDate}T${requestedTime}:00`);
  const endAt = new Date(startAt.getTime() + 100 * 60000);

  const reservation = await prisma.reservation.create({
    data: {
      businessId,
      customerId: customer.id,
      guestName: request.guestName,
      guestPhone: request.guestPhone ?? customer.phone,
      source: request.source || ReservationSource.WEBSITE,
      status: ReservationStatus.CONFIRMED,
      startAt,
      endAt,
      guestCount: request.guestCount ?? 2,
      notes: request.notes ?? request.rawMessage ?? null
    }
  });

  await prisma.reservationRequest.update({
    where: { id: request.id },
    data: {
      status: ReservationRequestStatus.APPROVED,
      reviewReason: parsed.data.reason || null,
      reviewedByUserId: session.user.id,
      approvedReservationId: reservation.id
    }
  });

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.INTEGRATION,
    action: "reservation_request_approved",
    message: "Pending reservation request approved and converted.",
    targetType: "ReservationRequest",
    targetId: request.id,
    metadata: {
      reservationId: reservation.id
    }
  });

  revalidatePath("/integrations");
  revalidatePath("/reservations");
  redirect(`${parsed.data.redirectTo}?saved=approved`);
}
