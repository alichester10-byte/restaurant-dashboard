import { AuditCategory, IntegrationProvider, IntegrationStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireBusinessWriteAccess } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { buildMetaAuthorizationUrl, createMetaConnectionState, getMetaProviderSetup } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "integrations"
  });

  const setup = getMetaProviderSetup("whatsapp");
  if (!setup.available) {
    return NextResponse.redirect(new URL("/integrations?error=whatsapp_setup_required", request.url), { status: 303 });
  }

  const state = createMetaConnectionState({
    provider: "whatsapp",
    businessId: session.user.businessId,
    userId: session.user.id
  });

  await prisma.integrationConnection.upsert({
    where: {
      businessId_provider: {
        businessId: session.user.businessId,
        provider: IntegrationProvider.WHATSAPP
      }
    },
    update: {
      status: IntegrationStatus.CONNECTING,
      errorMessage: null
    },
    create: {
      businessId: session.user.businessId,
      provider: IntegrationProvider.WHATSAPP,
      status: IntegrationStatus.CONNECTING
    }
  });

  await safeCreateAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.INTEGRATION,
    action: "whatsapp_connect_started",
    message: "WhatsApp embedded signup flow started."
  });

  return NextResponse.redirect(buildMetaAuthorizationUrl("whatsapp", state), { status: 303 });
}
