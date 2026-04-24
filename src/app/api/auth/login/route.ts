import { NextResponse } from "next/server";
import { AuthFlowError, loginWithEmail } from "@/lib/auth-service";
import { verifySameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 403 });
  }
  const formData = await request.formData();

  try {
    const result = await loginWithEmail(formData);
    return NextResponse.json({
      ok: true,
      redirectTo: result.redirectTo
    });
  } catch (error) {
    if (error instanceof AuthFlowError) {
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
