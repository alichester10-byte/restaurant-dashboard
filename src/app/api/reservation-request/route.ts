import { AuditCategory, IntegrationProvider, IntegrationStatus, ReservationSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { createPendingReservationRequestFromExternalMessage } from "@/lib/external-reservation-requests";
import { getIndustryConfig } from "@/lib/industry-config";
import { prisma } from "@/lib/prisma";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { sanitizeNullableText, sanitizeText, verifySameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  const limiter = await rateLimitPlaceholder("reservation-request-public", "reservation-request");
  if (!limiter.allowed) {
    return NextResponse.json({ ok: false, error: "Daha sonra tekrar deneyin." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const raw = contentType.includes("application/json")
    ? await request.json().catch(() => null)
    : Object.fromEntries(await request.formData());

  const businessSlug = sanitizeText(raw?.businessSlug);
  const guestName = sanitizeText(raw?.guestName);
  const guestPhone = sanitizeText(raw?.guestPhone);
  const customerEmail = sanitizeNullableText(raw?.customerEmail);
  const requestedDate = sanitizeNullableText(raw?.requestedDate);
  const requestedTime = sanitizeNullableText(raw?.requestedTime);
  const endDate = sanitizeNullableText(raw?.endDate);
  const serviceType = sanitizeNullableText(raw?.serviceType);
  const resourcePreference = sanitizeNullableText(raw?.resourcePreference);
  const notes = sanitizeNullableText(raw?.notes || raw?.message);
  const durationMinutes = raw?.durationMinutes ? Number(raw.durationMinutes) : undefined;
  const guestCount = raw?.guestCount ? Number(raw.guestCount) : undefined;
  const serviceId = sanitizeNullableText(raw?.serviceId);
  const staffId = sanitizeNullableText(raw?.staffId);
  const resourceId = sanitizeNullableText(raw?.resourceId);
  const source = contentType.includes("application/json") && !verifySameOrigin(request) ? ReservationSource.GOOGLE : ReservationSource.WEBSITE;

  if (!businessSlug || !guestName) {
    return NextResponse.json({ ok: false, error: "Eksik alanlar var." }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug }
  });

  if (!business) {
    return NextResponse.json({ ok: false, error: "İşletme bulunamadı." }, { status: 404 });
  }

  const [serviceRecord, staffRecord, resourceRecord] = await Promise.all([
    serviceId ? prisma.service.findFirst({ where: { id: serviceId, businessId: business.id, isActive: true }, select: { id: true, name: true } }) : Promise.resolve(null),
    staffId ? prisma.staffMember.findFirst({ where: { id: staffId, businessId: business.id, isActive: true }, select: { id: true, name: true } }) : Promise.resolve(null),
    resourceId
      ? prisma.bookableResource.findFirst({ where: { id: resourceId, businessId: business.id, isActive: true }, select: { id: true, name: true, type: true } })
      : Promise.resolve(null)
  ]);

  const industry = getIndustryConfig(business.businessType);
  const rawMessage = [
    `${industry.customerLabel}: ${guestName}`,
    guestPhone ? `Telefon: ${guestPhone}` : null,
    customerEmail ? `E-posta: ${customerEmail}` : null,
    requestedDate ? `Tarih: ${requestedDate}` : null,
    endDate ? `Bitiş: ${endDate}` : null,
    requestedTime ? `Saat: ${requestedTime}` : null,
    guestCount ? `${industry.guestCountLabel}: ${guestCount}` : null,
    (serviceType || serviceRecord?.name) ? `${industry.serviceTypeLabel}: ${serviceType || serviceRecord?.name}` : null,
    (resourcePreference || staffRecord?.name) ? `${industry.primaryResourceLabel} tercihi: ${resourcePreference || staffRecord?.name}` : null,
    resourceRecord?.name ? `${industry.primaryResourceLabel}: ${resourceRecord.name}` : null,
    durationMinutes ? `Süre: ${durationMinutes} dk` : null,
    notes ? `Not: ${notes}` : null
  ]
    .filter(Boolean)
    .join(" • ");

  await prisma.integrationConnection.upsert({
    where: {
      businessId_provider: {
        businessId: business.id,
        provider: source === ReservationSource.GOOGLE ? IntegrationProvider.GOOGLE_WEB : IntegrationProvider.WEBSITE_WIDGET
      }
    },
    update: {
      status: IntegrationStatus.NEEDS_CONFIGURATION,
      lastSyncedAt: new Date()
    },
    create: {
      businessId: business.id,
      provider: source === ReservationSource.GOOGLE ? IntegrationProvider.GOOGLE_WEB : IntegrationProvider.WEBSITE_WIDGET,
      status: IntegrationStatus.NEEDS_CONFIGURATION,
      lastSyncedAt: new Date()
    }
  });

  await createPendingReservationRequestFromExternalMessage({
    businessId: business.id,
    source,
    rawMessage,
    guestPhoneHint: guestPhone || null,
    notes: notes || null,
    structuredData: {
      guestName,
      guestPhone: guestPhone || null,
      customerEmail: customerEmail || null,
      requestedDate: requestedDate || null,
      requestedTime: requestedTime || null,
      endDate: endDate || null,
      guestCount: Number.isFinite(guestCount) ? guestCount : null,
      serviceType: serviceType || serviceRecord?.name || null,
      serviceId: serviceRecord?.id || null,
      staffId: staffRecord?.id || null,
      staffName: staffRecord?.name || null,
      resourcePreference: resourcePreference || staffRecord?.name || null,
      resourceId: resourceRecord?.id || null,
      resourceName: resourceRecord?.name || null,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      notes: notes || null,
      businessType: business.businessType
    }
  });

  await createAuditLog({
    businessId: business.id,
    category: AuditCategory.INTEGRATION,
    action: "public_reservation_request_received",
    message: "Public reservation request captured as pending.",
    metadata: {
      source
    }
  });

  return NextResponse.json({
    ok: true,
    message: "Talebiniz alındı. İşletme ekibi kısa süre içinde onaylayacak."
  });
}
