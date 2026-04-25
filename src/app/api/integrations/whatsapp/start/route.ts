import { AuditCategory, IntegrationProvider, IntegrationStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDynamicServerError } from "next/dist/client/components/hooks-server-context";
import { getBusinessEntitlement } from "@/lib/billing";
import { getCurrentSession } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { buildMetaAuthorizationUrl, createMetaConnectionState, getMetaAuthorizationDebugInfo, getMetaEnvironmentDiagnostics, getMetaProviderSetup } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

function buildIntegrationsRedirect(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/integrations?error=${error}`, request.url), { status: 303 });
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    const setup = getMetaProviderSetup("whatsapp");
    const diagnostics = getMetaEnvironmentDiagnostics();
    const appIdPresent = !!setup.appId;
    const configIdPresent = !!setup.configId;
    const businessPresent = !!session?.user.businessId;
    const userPresent = !!session?.user.id;

    console.info("[meta:whatsapp_start_route]", {
      route: "/api/integrations/whatsapp/start",
      baseUrl: setup.callbackUrl ? setup.callbackUrl.replace(/\/api\/integrations\/meta\/callback$/, "") : null,
      redirectUri: setup.callbackUrl,
      appIdPresent,
      configIdPresent,
      businessPresent,
      userPresent
    });

    if (!session || !userPresent || !businessPresent || session.user.role !== UserRole.BUSINESS_ADMIN) {
      return buildIntegrationsRedirect(request, "auth_required");
    }

    const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
    if (!entitlement.canWrite) {
      return buildIntegrationsRedirect(request, "upgrade_required");
    }

    if (!setup.available || !setup.callbackUrl) {
      console.warn("[meta:whatsapp_setup_required]", {
        missing: diagnostics.missing,
        suspicious: diagnostics.suspicious
      });
      return buildIntegrationsRedirect(request, "meta_setup_required");
    }

    const state = createMetaConnectionState({
      provider: "whatsapp",
      businessId: session.user.businessId,
      userId: session.user.id
    });

    try {
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
    } catch (databaseError) {
      console.error("[meta:whatsapp_connection_upsert_failed]", {
        error: databaseError instanceof Error ? databaseError.message : "unknown_error"
      });
      return buildIntegrationsRedirect(request, "meta_setup_required");
    }

    await safeCreateAuditLog({
      businessId: session.user.businessId,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.INTEGRATION,
      action: "whatsapp_connect_started",
      message: "WhatsApp embedded signup flow started."
    });

    const authUrl = buildMetaAuthorizationUrl("whatsapp", state);
    console.info("[meta:whatsapp_oauth_url]", getMetaAuthorizationDebugInfo("whatsapp", state));
    return NextResponse.redirect(authUrl, { status: 303 });
  } catch (error) {
    if (isDynamicServerError(error)) {
      throw error;
    }

    console.error("[meta:whatsapp_start_failed]", {
      error: error instanceof Error ? error.message : "unknown_error"
    });
    return buildIntegrationsRedirect(request, "meta_setup_required");
  }
}
