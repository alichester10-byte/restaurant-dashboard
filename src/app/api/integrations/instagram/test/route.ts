import { IntegrationProvider, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getMetaProviderSetup } from "@/lib/meta";
import { prisma } from "@/lib/prisma";
import { rateLimitPlaceholder } from "@/lib/rate-limit";

export async function POST() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.BUSINESS_ADMIN && session.user.role !== UserRole.STAFF) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const limiter = await rateLimitPlaceholder(`instagram-test:${session.user.businessId}`, "webhook", session.user.businessId);
  if (!limiter.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const setup = getMetaProviderSetup("instagram");
  const connection = await prisma.integrationConnection.findUnique({
    where: {
      businessId_provider: {
        businessId: session.user.businessId,
        provider: IntegrationProvider.INSTAGRAM
      }
    }
  });

  if (!setup.available) {
    return NextResponse.json({ ok: false, error: "setup_required", missing: setup.missing }, { status: 400 });
  }

  if (!connection?.instagramAccountId || !connection.facebookPageId) {
    return NextResponse.json({ ok: false, error: "not_connected" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Instagram hesabı ve sayfa eşlemesi hazır görünüyor.",
    username: connection.instagramUsername,
    facebookPageId: connection.facebookPageId,
    lastWebhookReceivedAt: connection.lastWebhookReceivedAt
  });
}
