import { AuditCategory, IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { completeInstagramConnection, completeWhatsAppConnection, verifyMetaConnectionState } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

function buildRedirect(baseUrl: string, query: string) {
  return new URL(`/integrations?${query}`, baseUrl);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const session = await getCurrentSession();
  const code = url.searchParams.get("code");
  const state = verifyMetaConnectionState(url.searchParams.get("state"));
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (!session || !state || state.userId !== session.user.id || state.businessId !== session.user.businessId) {
    return NextResponse.redirect(buildRedirect(request.url, "error=meta_state_invalid"), { status: 303 });
  }

  const provider = state.provider === "whatsapp" ? IntegrationProvider.WHATSAPP : IntegrationProvider.INSTAGRAM;

  if (error || !code) {
    await prisma.integrationConnection.upsert({
      where: {
        businessId_provider: {
          businessId: state.businessId,
          provider
        }
      },
      update: {
        status: IntegrationStatus.ERROR,
        errorMessage: errorDescription ?? error ?? "Meta bağlantısı tamamlanamadı."
      },
      create: {
        businessId: state.businessId,
        provider,
        status: IntegrationStatus.ERROR,
        errorMessage: errorDescription ?? error ?? "Meta bağlantısı tamamlanamadı."
      }
    });

    await safeCreateAuditLog({
      businessId: state.businessId,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.INTEGRATION,
      action: state.provider === "whatsapp" ? "whatsapp_connect_failed" : "instagram_connect_failed",
      message: "Meta connection callback returned an error.",
      metadata: {
        error,
        errorDescription
      }
    });

    return NextResponse.redirect(buildRedirect(request.url, `error=${state.provider}_connect_failed`), { status: 303 });
  }

  try {
    const payload =
      state.provider === "whatsapp"
        ? await completeWhatsAppConnection(code)
        : await completeInstagramConnection(code);

    await prisma.integrationConnection.upsert({
      where: {
        businessId_provider: {
          businessId: state.businessId,
          provider
        }
      },
      update: payload,
      create: {
        businessId: state.businessId,
        provider,
        ...payload
      }
    });

    await safeCreateAuditLog({
      businessId: state.businessId,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.INTEGRATION,
      action: state.provider === "whatsapp" ? "whatsapp_connected" : "instagram_connected",
      message: "Meta integration connected successfully."
    });

    return NextResponse.redirect(buildRedirect(request.url, `connected=${provider}`), { status: 303 });
  } catch (callbackError) {
    const message = callbackError instanceof Error ? callbackError.message : "Meta bağlantısı tamamlanamadı.";

    await prisma.integrationConnection.upsert({
      where: {
        businessId_provider: {
          businessId: state.businessId,
          provider
        }
      },
      update: {
        status: IntegrationStatus.ERROR,
        errorMessage: message
      },
      create: {
        businessId: state.businessId,
        provider,
        status: IntegrationStatus.ERROR,
        errorMessage: message
      }
    });

    await safeCreateAuditLog({
      businessId: state.businessId,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.INTEGRATION,
      action: state.provider === "whatsapp" ? "whatsapp_connect_failed" : "instagram_connect_failed",
      message: "Meta integration connection failed during code exchange.",
      metadata: {
        error: message
      }
    });

    return NextResponse.redirect(buildRedirect(request.url, `error=${state.provider}_connect_failed`), { status: 303 });
  }
}
