import { ReservationSource, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { extractReservationRequest } from "@/lib/ai-reservation";
import { getAppBaseUrl } from "@/lib/billing";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { getWhatsAppVerifyToken, WHATSAPP_SAMPLE_MESSAGE } from "@/lib/whatsapp";

export async function POST() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.BUSINESS_ADMIN && session.user.role !== UserRole.STAFF) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const limiter = await rateLimitPlaceholder(`whatsapp-test:${session.user.businessId}`, "webhook", session.user.businessId);
  if (!limiter.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const preview = await extractReservationRequest(WHATSAPP_SAMPLE_MESSAGE, ReservationSource.WHATSAPP);

  return NextResponse.json({
    ok: true,
    message: "Webhook doğrulama bilgileri hazır. Örnek mesaj başarıyla analiz edildi.",
    verifyToken: getWhatsAppVerifyToken(),
    webhookUrl: `${getAppBaseUrl()}/api/integrations/whatsapp/webhook`,
    preview
  });
}
