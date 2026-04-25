import { AuditCategory, IntegrationProvider, IntegrationStatus, Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireBusinessWriteAccess } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { verifySameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "integrations"
  });

  await prisma.integrationConnection.upsert({
    where: {
      businessId_provider: {
        businessId: session.user.businessId,
        provider: IntegrationProvider.WHATSAPP
      }
    },
    update: {
      status: IntegrationStatus.NOT_CONNECTED,
      externalAccountId: null,
      metaBusinessId: null,
      wabaId: null,
      phoneNumberId: null,
      displayPhoneNumber: null,
      accessTokenEncrypted: null,
      tokenExpiresAt: null,
      webhookSubscribedAt: null,
      lastWebhookReceivedAt: null,
      errorMessage: null,
      config: Prisma.JsonNull
    },
    create: {
      businessId: session.user.businessId,
      provider: IntegrationProvider.WHATSAPP,
      status: IntegrationStatus.NOT_CONNECTED
    }
  });

  await safeCreateAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.INTEGRATION,
    action: "whatsapp_disconnected",
    message: "WhatsApp integration disconnected."
  });

  return NextResponse.json({ ok: true });
}
