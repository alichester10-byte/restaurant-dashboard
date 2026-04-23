import { NextResponse } from "next/server";
import { AuthFlowError, registerBusinessAccount } from "@/lib/auth-service";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const result = await registerBusinessAccount(formData);
    return NextResponse.json({
      ok: true,
      redirectTo: result.redirectTo,
      message: "Account created successfully"
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
        error: "Kayıt sırasında beklenmeyen bir hata oluştu."
      },
      {
        status: 500
      }
    );
  }
}
