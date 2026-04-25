import crypto from "node:crypto";
import { AuditCategory, IntegrationProvider, IntegrationStatus, ReservationSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { safeCreateAuditLog } from "@/lib/audit";
import { createPendingReservationRequestFromExternalMessage } from "@/lib/external-reservation-requests";
import { prisma } from "@/lib/prisma";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { logSuspiciousActivity, sanitizeText } from "@/lib/security";
import { getWhatsAppVerifyToken } from "@/lib/whatsapp";

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

  if (mode === "subscribe" && token && token === getWhatsAppVerifyToken()) {
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
  const entry = payload?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const firstMessage = value?.messages?.[0];
  const phoneNumberId = sanitizeText(value?.metadata?.phone_number_id);
  const wabaId = sanitizeText(entry?.id);
  const message = sanitizeText(firstMessage?.text?.body);
  const sourceMessageId = sanitizeText(firstMessage?.id);
  const sourceConversationId = sanitizeText(value?.contacts?.[0]?.wa_id ?? firstMessage?.from);

  if ((!phoneNumberId && !wabaId) || !message) {
    await logSuspiciousActivity({
      action: "whatsapp_webhook_invalid",
      message: "WhatsApp webhook received incomplete payload.",
      metadata: {
        hasPhoneNumberId: Boolean(phoneNumberId),
        hasWabaId: Boolean(wabaId)
      }
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const lookupFilters = [];
  if (phoneNumberId) {
    lookupFilters.push({ phoneNumberId });
  }
  if (wabaId) {
    lookupFilters.push({ wabaId });
  }

  const connection = await prisma.integrationConnection.findFirst({
    where: {
      provider: IntegrationProvider.WHATSAPP,
      OR: lookupFilters
    },
    include: {
      business: true
    }
  });

  if (!connection?.business) {
    await logSuspiciousActivity({
      action: "whatsapp_webhook_business_missing",
      message: "WhatsApp webhook could not be mapped to a business.",
      metadata: {
        phoneNumberId,
        wabaId
      }
    });
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await prisma.integrationConnection.update({
    where: {
      id: connection.id
    },
    data: {
      status: IntegrationStatus.CONNECTED,
      lastSyncedAt: new Date(),
      lastWebhookReceivedAt: new Date(),
      errorMessage: null
    }
  });

  const result = await createPendingReservationRequestFromExternalMessage({
    businessId: connection.business.id,
    source: ReservationSource.WHATSAPP,
    rawMessage: message,
    sourceConversationId,
    sourceMessageId,
    guestPhoneHint: sanitizeText(firstMessage?.from),
    notes: "WhatsApp üzerinden alındı."
  });

  await safeCreateAuditLog({
    businessId: connection.business.id,
    category: AuditCategory.WEBHOOK,
    action: "whatsapp_request_received",
    message: "Incoming WhatsApp reservation request stored as pending.",
    metadata: {
      connectionId: connection.id,
      duplicate: result.duplicate,
      sourceMessageId
    }
  });

  return NextResponse.json({ ok: true });
}
