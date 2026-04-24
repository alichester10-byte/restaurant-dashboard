import { AuditCategory, IntegrationProvider, IntegrationStatus, ReservationSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { extractReservationSignal } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { logSuspiciousActivity, sanitizeText } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  await logSuspiciousActivity({
    action: "whatsapp_webhook_verify_failed",
    message: "WhatsApp webhook verification failed."
  });
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const limiter = await rateLimitPlaceholder("whatsapp-webhook", "webhook");
  if (!limiter.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const payload = await request.json().catch(() => null);
  const businessId = sanitizeText(payload?.businessId);
  const businessSlug = sanitizeText(payload?.businessSlug);
  const message = sanitizeText(payload?.message ?? payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body);

  if ((!businessId && !businessSlug) || !message) {
    await logSuspiciousActivity({
      action: "whatsapp_webhook_invalid",
      message: "WhatsApp webhook received incomplete payload.",
      metadata: {
        hasBusinessId: Boolean(businessId),
        hasBusinessSlug: Boolean(businessSlug)
      }
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const business = businessId
    ? await prisma.business.findUnique({ where: { id: businessId } })
    : await prisma.business.findUnique({ where: { slug: businessSlug } });

  if (!business) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const connection = await prisma.integrationConnection.upsert({
    where: {
      businessId_provider: {
        businessId: business.id,
        provider: IntegrationProvider.WHATSAPP
      }
    },
    update: {
      status: IntegrationStatus.CONNECTED,
      lastSyncedAt: new Date()
    },
    create: {
      businessId: business.id,
      provider: IntegrationProvider.WHATSAPP,
      status: IntegrationStatus.CONNECTED,
      lastSyncedAt: new Date()
    }
  });

  const extracted = extractReservationSignal(message);
  await prisma.reservationRequest.create({
    data: {
      businessId: business.id,
      source: ReservationSource.WHATSAPP,
      guestName: extracted.guestName,
      guestPhone: extracted.guestPhone,
      requestedDate: extracted.requestedDate,
      requestedTime: extracted.requestedTime,
      guestCount: extracted.guestCount,
      notes: "WhatsApp üzerinden alındı.",
      confidenceScore: extracted.confidenceScore,
      extractedData: extracted,
      rawMessage: message
    }
  });

  await createAuditLog({
    businessId: business.id,
    category: AuditCategory.WEBHOOK,
    action: "whatsapp_request_received",
    message: "Incoming WhatsApp reservation request stored as pending.",
    metadata: {
      connectionId: connection.id
    }
  });

  return NextResponse.json({ ok: true });
}
