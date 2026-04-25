import crypto from "node:crypto";
import { AuditCategory, IntegrationProvider, IntegrationStatus, ReservationSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { safeCreateAuditLog } from "@/lib/audit";
import { createPendingReservationRequestFromExternalMessage } from "@/lib/external-reservation-requests";
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
    action: "instagram_webhook_verify_failed",
    message: "Instagram webhook verification failed."
  });
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const limiter = await rateLimitPlaceholder("instagram-webhook", "webhook");
  if (!limiter.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, signature)) {
    await logSuspiciousActivity({
      action: "instagram_webhook_signature_failed",
      message: "Instagram webhook signature verification failed."
    });
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let payload: any = null;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    await logSuspiciousActivity({
      action: "instagram_webhook_invalid_json",
      message: "Instagram webhook body was not valid JSON."
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const entry = payload?.entry?.[0];
  const messaging = entry?.messaging?.[0];
  const message = sanitizeText(messaging?.message?.text);
  const pageId = sanitizeText(entry?.id ?? messaging?.recipient?.id);
  const sourceMessageId = sanitizeText(messaging?.message?.mid);
  const sourceConversationId = sanitizeText(messaging?.sender?.id);

  if (!pageId || !message) {
    await logSuspiciousActivity({
      action: "instagram_webhook_invalid",
      message: "Instagram webhook received incomplete payload.",
      metadata: {
        hasPageId: Boolean(pageId)
      }
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const connection = await prisma.integrationConnection.findFirst({
    where: {
      provider: IntegrationProvider.INSTAGRAM,
      OR: [
        { facebookPageId: pageId },
        { instagramAccountId: pageId }
      ]
    },
    include: {
      business: true
    }
  });

  if (!connection?.business) {
    await logSuspiciousActivity({
      action: "instagram_webhook_business_missing",
      message: "Instagram webhook could not be mapped to a business.",
      metadata: {
        pageId
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
    source: ReservationSource.INSTAGRAM,
    rawMessage: message,
    sourceConversationId,
    sourceMessageId,
    notes: "Instagram DM üzerinden alındı."
  });

  await safeCreateAuditLog({
    businessId: connection.business.id,
    category: AuditCategory.WEBHOOK,
    action: "instagram_request_received",
    message: "Incoming Instagram reservation request stored as pending.",
    metadata: {
      connectionId: connection.id,
      duplicate: result.duplicate,
      sourceMessageId
    }
  });

  return NextResponse.json({ ok: true });
}
