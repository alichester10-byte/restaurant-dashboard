import { AuditCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { dispatchDueReservationReminders } from "@/lib/reminders";
import { rateLimitPlaceholder } from "@/lib/rate-limit";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const bearer = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  return bearer === `Bearer ${secret}` || headerSecret === secret;
}

export async function GET(request: Request) {
  const limiter = await rateLimitPlaceholder("cron-send-reminders", "webhook");
  if (!limiter.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const results = await dispatchDueReservationReminders();

  await createAuditLog({
    category: AuditCategory.WEBHOOK,
    action: "reservation_reminders_cron_run",
    message: "Scheduled reservation reminder dispatch executed.",
    metadata: {
      processed: results.length,
      sent: results.filter((item) => item.status === "SENT").length,
      failed: results.filter((item) => item.status === "FAILED").length
    }
  });

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results
  });
}
