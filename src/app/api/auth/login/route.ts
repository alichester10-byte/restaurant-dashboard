import { NextResponse } from "next/server";
import { AuthFlowError, loginWithEmail } from "@/lib/auth-service";
import { verifySameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 403 });
  }
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const intent = String(formData.get("intent") ?? "login");

  try {
    const result = await loginWithEmail(formData);
    if ("requiresTwoFactor" in result && result.requiresTwoFactor) {
      return NextResponse.json({
        ok: true,
        requiresTwoFactor: true,
        challengeMethod: result.challengeMethod,
        challengeToken: result.challengeToken,
        message: result.challengeMessage
      });
    }

    return NextResponse.json({
      ok: true,
      redirectTo: result.redirectTo
    });
  } catch (error) {
    if (error instanceof AuthFlowError) {
      console.warn("[auth:login-failed]", {
        code: error.code,
        message: error.message
      });
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          code: error.code
        },
        {
          status: error.code === "rate_limited" ? 429 : 400
        }
      );
    }

    console.error("[auth:login-unexpected]", {
      email,
      intent,
      errorName: error instanceof Error ? error.name : "unknown_error",
      error: error instanceof Error ? error.message : "unknown_error",
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 3).join(" | ") : undefined
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Giriş sırasında beklenmeyen bir hata oluştu."
      },
      {
        status: 500
      }
    );
  }
}
