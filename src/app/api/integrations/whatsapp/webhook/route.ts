import crypto from "node:crypto";
import { AuditCategory, IntegrationProvider, IntegrationStatus, ReservationSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { extractReservationRequest } from "@/lib/ai-reservation";
import { prisma } from "@/lib/prisma";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { logSuspiciousActivity, sanitizeText } from "@/lib/security";

function verifyMetaSignature(body: string, signature: string | null) {
  const appSecret = process.env.META_WEBHOOK_APP_SECRET;
  if (!appSecret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(body).digest("hex")}`;
  if (expected.length !== signature.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

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

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, signature)) {
    await logSuspiciousActivity({
      action: "whatsapp_webhook_signature_failed",
      message: "WhatsApp webhook signature verification failed."
    });
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let payload: any = null;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    await logSuspiciousActivity({
      action: "whatsapp_webhook_invalid_json",
      message: "WhatsApp webhook body was not valid JSON."
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }
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

  const extracted = await extractReservationRequest(message, ReservationSource.WHATSAPP);
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
