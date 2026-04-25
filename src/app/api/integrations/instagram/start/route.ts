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

  const setup = getMetaProviderSetup("instagram");
  if (!setup.available) {
    console.warn("[meta:instagram_setup_required]", {
      missing: getMetaEnvironmentDiagnostics().missing
    });
    return NextResponse.redirect(new URL("/integrations?error=instagram_setup_required", request.url), { status: 303 });
  }

  const state = createMetaConnectionState({
    provider: "instagram",
    businessId: session.user.businessId,
    userId: session.user.id
  });

  await prisma.integrationConnection.upsert({
    where: {
      businessId_provider: {
        businessId: session.user.businessId,
        provider: IntegrationProvider.INSTAGRAM
      }
    },
    update: {
      status: IntegrationStatus.CONNECTING,
      errorMessage: null
    },
    create: {
      businessId: session.user.businessId,
      provider: IntegrationProvider.INSTAGRAM,
      status: IntegrationStatus.CONNECTING
    }
  });

  await safeCreateAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.INTEGRATION,
    action: "instagram_connect_started",
    message: "Instagram business login flow started."
  });

  try {
    const authUrl = buildMetaAuthorizationUrl("instagram", state);
    console.info("[meta:instagram_oauth_url]", getMetaAuthorizationDebugInfo("instagram", state));
    return NextResponse.redirect(authUrl, { status: 303 });
  } catch (error) {
    console.error("[meta:instagram_oauth_build_failed]", {
      error: error instanceof Error ? error.message : "unknown_error"
    });
    return NextResponse.redirect(new URL("/integrations?error=instagram_setup_required", request.url), { status: 303 });
  }
}
