import { AuditCategory, IntegrationProvider, IntegrationStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireBusinessWriteAccess } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { buildMetaAuthorizationUrl, createMetaConnectionState, getMetaAuthorizationDebugInfo, getMetaEnvironmentDiagnostics, getMetaProviderSetup } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "integrations"
  });

  const setup = getMetaProviderSetup("whatsapp");
  if (!setup.available) {
    console.warn("[meta:whatsapp_setup_required]", {
      missing: getMetaEnvironmentDiagnostics().missing
    });
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

  try {
    const authUrl = buildMetaAuthorizationUrl("whatsapp", state);
    console.info("[meta:whatsapp_oauth_url]", getMetaAuthorizationDebugInfo("whatsapp", state));
    return NextResponse.redirect(authUrl, { status: 303 });
  } catch (error) {
    console.error("[meta:whatsapp_oauth_build_failed]", {
      error: error instanceof Error ? error.message : "unknown_error"
    });
    return NextResponse.redirect(new URL("/integrations?error=whatsapp_setup_required", request.url), { status: 303 });
  }
}
