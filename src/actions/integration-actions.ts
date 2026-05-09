"use server";

import { AuditCategory, IntegrationProvider, IntegrationStatus, ReservationRequestStatus, ReservationStatus, ReservationSource, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkReservationConflict, getBusinessAvailabilityContext, InvalidBookingDateTimeError, resolveReservationWindow } from "@/lib/availability";
import { requireBusinessWriteAccess } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { createPendingReservationRequestFromExternalMessage } from "@/lib/external-reservation-requests";
import { PlanLimitError } from "@/lib/plan-config";
import { prisma } from "@/lib/prisma";
import { sanitizeNullableText, sanitizeText } from "@/lib/security";
import { buildReminderSchedule } from "@/lib/reminders";
import { reservationRequestCreateSchema, reservationRequestReviewSchema } from "@/lib/validation";

function withQueryParams(pathname: string, params: Record<string, string>) {
  const [baseWithQuery, hash = ""] = pathname.split("#");
  const [base, search = ""] = baseWithQuery.split("?");
  const query = new URLSearchParams(search);
  for (const [key, value] of Object.entries(params)) {
    query.set(key, value);
  }
  return `${base}${query.toString() ? `?${query.toString()}` : ""}${hash ? `#${hash}` : ""}`;
}

export async function configureIntegrationAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "integrations"
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
    guestName: sanitizeText(formData.get("guestName")),
    guestPhone: sanitizeNullableText(formData.get("guestPhone")),
    requestedDate: sanitizeNullableText(formData.get("requestedDate")),
    requestedTime: sanitizeNullableText(formData.get("requestedTime")),
    guestCount: formData.get("guestCount") ? Number(formData.get("guestCount")) : undefined,
    notes: sanitizeNullableText(formData.get("notes")),
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
        reviewedByUserId: session.user.id,
        guestName: parsed.data.guestName || request.guestName,
        guestPhone: parsed.data.guestPhone || request.guestPhone,
        requestedDate: parsed.data.requestedDate || request.requestedDate,
        requestedTime: parsed.data.requestedTime || request.requestedTime,
        guestCount: parsed.data.guestCount ?? request.guestCount,
        notes: parsed.data.notes || request.notes
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

  const approvedGuestName = parsed.data.guestName || request.guestName || "AI Talebi";
  const approvedGuestPhone = parsed.data.guestPhone || request.guestPhone || `request-${request.id.slice(-6)}`;
  const approvedRequestedDate = parsed.data.requestedDate || request.requestedDate || new Date().toISOString().slice(0, 10);
  const approvedRequestedTime = parsed.data.requestedTime || request.requestedTime || "19:30";
  const approvedGuestCount = parsed.data.guestCount ?? request.guestCount ?? 2;
  const approvedNotes = parsed.data.notes || request.notes || request.rawMessage || null;
  const extractedData =
    request.extractedData && typeof request.extractedData === "object" && !Array.isArray(request.extractedData)
      ? (request.extractedData as Record<string, unknown>)
      : {};

  const phone = approvedGuestPhone.trim() || `request-${request.id.slice(-6)}`;
  const settings = await prisma.restaurantSettings.findFirstOrThrow({
    where: {
      businessId
    }
  });
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
      name: approvedGuestName,
      phone
    }
  });

  const serviceId = typeof extractedData.serviceId === "string" ? extractedData.serviceId : null;
  const staffMemberId = typeof extractedData.staffId === "string" ? extractedData.staffId : null;
  const resourceId = typeof extractedData.resourceId === "string" ? extractedData.resourceId : null;
  const assignedTableId = typeof extractedData.tableId === "string" ? extractedData.tableId : null;
  const requestedEndDate = typeof extractedData.endDate === "string" ? extractedData.endDate : null;
  const explicitDuration =
    typeof extractedData.durationMinutes === "number"
      ? extractedData.durationMinutes
      : typeof extractedData.durationMinutes === "string"
        ? Number(extractedData.durationMinutes)
        : null;
  const service = serviceId
    ? await prisma.service.findFirst({
        where: { id: serviceId, businessId },
        select: { id: true, name: true, durationMinutes: true }
      })
    : null;
  const availabilityContext = await getBusinessAvailabilityContext(businessId);
  let startAt: Date;
  let endAt: Date;
  let durationMinutes: number;
  try {
    ({ startAt, endAt, durationMinutes } = resolveReservationWindow({
      requestedDate: approvedRequestedDate,
      requestedTime: approvedRequestedTime,
      endDate: requestedEndDate,
      durationMinutes: Number.isFinite(explicitDuration ?? NaN) ? explicitDuration : service?.durationMinutes ?? null,
      fallbackDurationMinutes: service?.durationMinutes ?? availabilityContext?.averageDurationMinutes ?? settings.averageDiningDurationMin ?? 90
    }));
  } catch (error) {
    if (error instanceof InvalidBookingDateTimeError) {
      redirect(
        withQueryParams(parsed.data.redirectTo, {
          error: "reservation_request_datetime_invalid"
        })
      );
    }
    throw error;
  }
  const conflict = await checkReservationConflict({
    businessId,
    startAt,
    endAt,
    guestCount: approvedGuestCount,
    assignedTableId,
    serviceId: service?.id ?? null,
    staffMemberId,
    resourceId
  });
  if (!conflict.ok) {
    redirect(
      withQueryParams(parsed.data.redirectTo, {
        error: `availability_${(conflict.code ?? "conflict").toLowerCase()}`
      })
    );
  }
  const reminderConfig = buildReminderSchedule({
    startAt,
    reminderEnabled: settings.reminderEnabled,
    reminderTimingHours: settings.reminderTimingHours
  });

  const reservation = await prisma.reservation.create({
    data: {
      businessId,
      customerId: customer.id,
      guestName: approvedGuestName,
      guestPhone: approvedGuestPhone || customer.phone,
      assignedTableId,
      serviceId: service?.id ?? null,
      staffMemberId,
      resourceId,
      source: request.source,
      status: ReservationStatus.CONFIRMED,
      startAt,
      endAt,
      durationMinutes,
      guestCount: approvedGuestCount,
      notes: approvedNotes,
      bookingMetadata: {
        ...extractedData,
        serviceId: service?.id ?? serviceId,
        serviceType: service?.name ?? extractedData.serviceType ?? null,
        staffId: staffMemberId,
        resourceId,
        tableId: assignedTableId
      },
      reminderStatus: reminderConfig.reminderStatus,
      reminderScheduledAt: reminderConfig.reminderScheduledAt
    }
  });

  await prisma.reservationRequest.update({
    where: { id: request.id },
    data: {
      status: ReservationRequestStatus.APPROVED,
      reviewReason: parsed.data.reason || null,
      reviewedByUserId: session.user.id,
      approvedReservationId: reservation.id,
      guestName: approvedGuestName,
      guestPhone: approvedGuestPhone || null,
      requestedDate: approvedRequestedDate,
      requestedTime: approvedRequestedTime,
      guestCount: approvedGuestCount,
      notes: approvedNotes,
      source: request.source
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
  revalidatePath("/reports");
  redirect(`${parsed.data.redirectTo}?saved=approved`);
}

export async function createManualReservationRequestAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN, UserRole.STAFF],
    feature: "integrations"
  });
  const businessId = session.user.businessId;

  const parsed = reservationRequestCreateSchema.safeParse({
    message: sanitizeNullableText(formData.get("message")) ?? "",
    source: formData.get("source") ?? ReservationSource.AI,
    redirectTo: formData.get("redirectTo") ?? "/integrations"
  });

  if (!parsed.success) {
    redirect("/integrations?error=request_create");
  }

  await createPendingReservationRequestFromExternalMessage({
    businessId,
    source: ReservationSource.AI,
    rawMessage: parsed.data.message,
    notes: "Manuel AI asistan talebi"
  }).catch((error) => {
    if (error instanceof PlanLimitError) {
      redirect(`/integrations?error=plan_limit&reason=${error.code}`);
    }
    throw error;
  });

  await prisma.integrationConnection.upsert({
    where: {
      businessId_provider: {
        businessId,
        provider: IntegrationProvider.AI_ASSISTANT
      }
    },
    update: {
      status: IntegrationStatus.NEEDS_CONFIGURATION,
      lastSyncedAt: new Date()
    },
    create: {
      businessId,
      provider: IntegrationProvider.AI_ASSISTANT,
      status: IntegrationStatus.NEEDS_CONFIGURATION,
      lastSyncedAt: new Date()
    }
  });

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.INTEGRATION,
    action: "manual_reservation_request_created",
    message: "Manual message converted into pending reservation request."
  });

  revalidatePath("/integrations");
  redirect(`${parsed.data.redirectTo}?saved=created`);
}
