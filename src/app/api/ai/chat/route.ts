import { NextResponse } from "next/server";
import { handleRestaurantChatMessage } from "@/lib/restaurant-chat";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { aiChatSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = aiChatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mesaj veya restoran bilgisi geçersiz."
      },
      { status: 400 }
    );
  }

  const limiter = await rateLimitPlaceholder(
    `${parsed.data.restaurantId}:${parsed.data.sessionId || "new"}`,
    "ai-chat",
    parsed.data.restaurantId
  );

  if (!limiter.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Kısa süre içinde çok fazla mesaj gönderildi. Lütfen biraz sonra tekrar deneyin."
      },
      { status: 429 }
    );
  }

  try {
    const result = await handleRestaurantChatMessage({
      restaurantId: parsed.data.restaurantId,
      sessionId: parsed.data.sessionId || null,
      message: parsed.data.message,
      source: parsed.data.source || "WEBSITE_CHATBOT"
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error
        },
        {
          status: result.status
        }
      );
    }

    return NextResponse.json({
      ok: true,
      ...result.payload
    });
  } catch (error) {
    console.error("[ai:chat-route-error]", {
      error: error instanceof Error ? error.message : "unknown_error"
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Şu anda AI asistanına ulaşılamıyor. İsterseniz rezervasyon talebinizi form üzerinden iletebilirsiniz."
      },
      { status: 500 }
    );
  }
}
