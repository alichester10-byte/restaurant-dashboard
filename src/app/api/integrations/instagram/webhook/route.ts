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
  const businessId = sanitizeText(payload?.businessId);
  const businessSlug = sanitizeText(payload?.businessSlug);
  const message = sanitizeText(payload?.message ?? payload?.entry?.[0]?.messaging?.[0]?.message?.text);

  if ((!businessId && !businessSlug) || !message) {
    await logSuspiciousActivity({
      action: "instagram_webhook_invalid",
      message: "Instagram webhook received incomplete payload.",
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

  await prisma.integrationConnection.upsert({
    where: {
      businessId_provider: {
        businessId: business.id,
        provider: IntegrationProvider.INSTAGRAM
      }
    },
    update: {
      status: IntegrationStatus.CONNECTED,
      lastSyncedAt: new Date()
    },
    create: {
      businessId: business.id,
      provider: IntegrationProvider.INSTAGRAM,
      status: IntegrationStatus.CONNECTED,
      lastSyncedAt: new Date()
    }
  });

  const extracted = await extractReservationRequest(message, ReservationSource.INSTAGRAM);
  await prisma.reservationRequest.create({
    data: {
      businessId: business.id,
      source: ReservationSource.INSTAGRAM,
      guestName: extracted.guestName || "Instagram talebi",
      guestPhone: extracted.guestPhone,
      requestedDate: extracted.requestedDate,
      requestedTime: extracted.requestedTime,
      guestCount: extracted.guestCount,
      notes: "Instagram DM üzerinden alındı.",
      confidenceScore: extracted.confidenceScore,
      extractedData: extracted,
      rawMessage: message
    }
  });

  await createAuditLog({
    businessId: business.id,
    category: AuditCategory.WEBHOOK,
    action: "instagram_request_received",
    message: "Incoming Instagram reservation request stored as pending."
  });

  return NextResponse.json({ ok: true });
}
