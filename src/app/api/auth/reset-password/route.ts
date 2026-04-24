import { NextResponse } from "next/server";
import { AuthFlowError, resetPassword } from "@/lib/auth-service";
import { verifySameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 403 });
  }
  const formData = await request.formData();

  try {
    await resetPassword(formData);
    return NextResponse.json({
      ok: true,
      redirectTo: "/login?toast=password_reset_success"
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
        error: "Şifre güncellenemedi."
      },
      {
        status: 500
      }
    );
  }
}
