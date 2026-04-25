import { AuditCategory, IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDynamicServerError } from "next/dist/client/components/hooks-server-context";
import { getCurrentSession } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { completeInstagramConnection, completeWhatsAppConnection, verifyMetaConnectionState } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

function buildRedirect(baseUrl: string, query: string) {
  return new URL(`/integrations?${query}`, baseUrl);
}

function extractErrorStep(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.startsWith("TOKEN:")) {
    return { step: "TOKEN", message: message.slice("TOKEN:".length).trim() || "Token exchange failed." };
  }

  if (message.startsWith("PARSE:")) {
    return { step: "PARSE", message: message.slice("PARSE:".length).trim() || "Meta response parsing failed." };
  }

  if (message.startsWith("DB:")) {
    return { step: "DB", message: message.slice("DB:".length).trim() || "Database write failed." };
  }

  if (message.startsWith("SESSION:")) {
    return { step: "SESSION", message: message.slice("SESSION:".length).trim() || "Session validation failed." };
  }

  return { step: "UNKNOWN", message };
}

async function safeUpsertIntegrationConnection(input: {
  businessId: string;
  provider: IntegrationProvider;
  update: Record<string, unknown>;
  create?: Record<string, unknown>;
}) {
  try {
    await prisma.integrationConnection.upsert({
      where: {
        businessId_provider: {
          businessId: input.businessId,
          provider: input.provider
        }
      },
      update: input.update,
      create: {
        businessId: input.businessId,
        provider: input.provider,
        ...(input.create ?? input.update)
      }
    });

    return { ok: true as const };
  } catch (error) {
    console.error("[meta:integration_upsert_failed]", {
      provider: input.provider,
      businessId: input.businessId,
      error: error instanceof Error ? error.message : "unknown_error"
    });
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "unknown_error"
    };
  }
}

async function resolvePendingProviderFromSession(businessId: string) {
  const pendingConnections = await prisma.integrationConnection.findMany({
    where: {
      businessId,
      provider: {
        in: [IntegrationProvider.WHATSAPP, IntegrationProvider.INSTAGRAM]
      },
      status: IntegrationStatus.CONNECTING
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 2
  }).catch(() => []);

  if (pendingConnections.length !== 1) {
    return null;
  }

  return pendingConnections[0].provider;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const session = await getCurrentSession();
    const code = url.searchParams.get("code");
    const state = verifyMetaConnectionState(url.searchParams.get("state"));
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    const fallbackProvider =
      !state && session?.user?.businessId
        ? await resolvePendingProviderFromSession(session.user.businessId)
        : null;
    const resolvedProvider = state
      ? state.provider === "whatsapp"
        ? IntegrationProvider.WHATSAPP
        : IntegrationProvider.INSTAGRAM
      : fallbackProvider;
    const resolvedBusinessId = state?.businessId ?? session?.user?.businessId ?? null;
    const resolvedUserId = state?.userId ?? session?.user?.id ?? null;
    const actor =
      resolvedUserId && resolvedBusinessId
        ? await prisma.user.findFirst({
            where: {
              id: resolvedUserId,
              businessId: resolvedBusinessId
            },
            select: {
              id: true,
              role: true,
              businessId: true
            }
          }).catch(() => null)
        : null;

    console.info("[meta:callback_received]", {
      hasCode: !!code,
      error: error ?? null,
      hasState: !!url.searchParams.get("state"),
      businessPresent: !!session?.user.businessId,
      userPresent: !!session?.user.id,
      actorResolved: !!actor?.id,
      fallbackProvider
    });

    if (!resolvedProvider || !resolvedBusinessId) {
      console.log("❌ SESSION/STATE INVALID");
      return NextResponse.redirect(buildRedirect(request.url, "error=meta_callback_failed&step=SESSION"), { status: 303 });
    }

    const provider = resolvedProvider;

    if (error || !code) {
      await safeUpsertIntegrationConnection({
        businessId: resolvedBusinessId,
        provider,
        update: {
          status: IntegrationStatus.ERROR,
          errorMessage: errorDescription ?? error ?? "Meta bağlantısı tamamlanamadı."
        }
      });

      await safeCreateAuditLog({
        businessId: resolvedBusinessId,
        actorUserId: actor?.id,
        actorRole: actor?.role ?? null,
        category: AuditCategory.INTEGRATION,
        action: provider === IntegrationProvider.WHATSAPP ? "whatsapp_connect_failed" : "instagram_connect_failed",
        message: "Meta connection callback returned an error.",
        metadata: {
          error,
          errorDescription
        }
      });

      return NextResponse.redirect(buildRedirect(request.url, "error=meta_callback_failed&step=TOKEN"), { status: 303 });
    }

    let payload;
    try {
      payload =
        provider === IntegrationProvider.WHATSAPP
          ? await completeWhatsAppConnection(code)
          : await completeInstagramConnection(code);
    } catch (error) {
      const failure = extractErrorStep(error);

      console.error("[meta:callback_connection_failed]", {
        provider,
        step: failure.step,
        error: failure.message,
        businessId: resolvedBusinessId,
        userId: actor?.id ?? resolvedUserId
      });

      await safeUpsertIntegrationConnection({
        businessId: resolvedBusinessId,
        provider,
        update: {
          status: IntegrationStatus.ERROR,
          errorMessage: failure.message
        }
      });

      await safeCreateAuditLog({
        businessId: resolvedBusinessId,
        actorUserId: actor?.id,
        actorRole: actor?.role ?? null,
        category: AuditCategory.INTEGRATION,
        action: provider === IntegrationProvider.WHATSAPP ? "whatsapp_connect_failed" : "instagram_connect_failed",
        message: "Meta connection callback failed during token exchange or parsing.",
        metadata: {
          step: failure.step,
          error: failure.message
        }
      });

      return NextResponse.redirect(buildRedirect(request.url, `error=meta_callback_failed&step=${failure.step}`), { status: 303 });
    }

    const dbWrite = await safeUpsertIntegrationConnection({
      businessId: resolvedBusinessId,
      provider,
      update: payload
    });

    if (!dbWrite.ok) {
      await safeCreateAuditLog({
        businessId: resolvedBusinessId,
        actorUserId: actor?.id,
        actorRole: actor?.role ?? null,
        category: AuditCategory.INTEGRATION,
        action: provider === IntegrationProvider.WHATSAPP ? "whatsapp_connect_failed" : "instagram_connect_failed",
        message: "Meta connection callback failed during database write.",
        metadata: {
          step: "DB",
          error: dbWrite.error
        }
      });

      return NextResponse.redirect(buildRedirect(request.url, "error=meta_callback_failed&step=DB"), { status: 303 });
    }

    await safeCreateAuditLog({
      businessId: resolvedBusinessId,
      actorUserId: actor?.id,
      actorRole: actor?.role ?? null,
      category: AuditCategory.INTEGRATION,
      action: provider === IntegrationProvider.WHATSAPP ? "whatsapp_connected" : "instagram_connected",
      message: "Meta integration connected successfully."
    });

    return NextResponse.redirect(
      buildRedirect(request.url, `success=${provider === IntegrationProvider.WHATSAPP ? "whatsapp_connected" : "instagram_connected"}`),
      { status: 303 }
    );
  } catch (callbackError) {
    if (isDynamicServerError(callbackError)) {
      throw callbackError;
    }

    const failure = extractErrorStep(callbackError);
    console.error("[meta:callback_failed]", {
      step: failure.step,
      error: failure.message
    });
    return NextResponse.redirect(buildRedirect(request.url, "error=meta_callback_failed&step=UNKNOWN"), { status: 303 });
  }
}
