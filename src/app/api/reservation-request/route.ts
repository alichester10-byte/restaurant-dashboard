import { AuditCategory, IntegrationProvider, IntegrationStatus, ReservationSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { extractReservationRequest } from "@/lib/ai-reservation";
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
  const requestedDate = sanitizeNullableText(raw?.requestedDate);
  const requestedTime = sanitizeNullableText(raw?.requestedTime);
  const notes = sanitizeNullableText(raw?.notes || raw?.message);
  const guestCount = raw?.guestCount ? Number(raw.guestCount) : undefined;
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

  const extracted = await extractReservationRequest(
    `${guestName} ${guestPhone} ${requestedDate} ${requestedTime} ${guestCount ?? ""} ${notes}`,
    source
  );
  await prisma.reservationRequest.create({
    data: {
      businessId: business.id,
      source,
      guestName,
      guestPhone: guestPhone || extracted.guestPhone,
      requestedDate: requestedDate || extracted.requestedDate,
      requestedTime: requestedTime || extracted.requestedTime,
      guestCount: guestCount || extracted.guestCount,
      notes: notes || null,
      confidenceScore: extracted.confidenceScore,
      extractedData: {
        guestName,
        guestPhone,
        requestedDate,
        requestedTime,
        guestCount
      },
      rawMessage: notes || null
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
