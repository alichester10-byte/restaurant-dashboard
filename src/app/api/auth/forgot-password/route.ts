import { NextResponse } from "next/server";
import { AuthFlowError, requestPasswordReset } from "@/lib/auth-service";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    await requestPasswordReset(formData);
    return NextResponse.json({
      ok: true,
      message: "If an account exists for this email, a reset link has been sent."
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
        error: "Şifre sıfırlama isteği gönderilemedi."
      },
      {
        status: 500
      }
    );
  }
}
