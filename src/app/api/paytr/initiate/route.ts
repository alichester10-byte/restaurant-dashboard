import { AuditCategory, SubscriptionPlan, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { getPlanPricing } from "@/lib/billing";
import { getCurrentSession } from "@/lib/auth";
import { createMerchantOid } from "@/lib/paytr";
import { prisma } from "@/lib/prisma";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { verifySameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 403 });
  }
  const session = await getCurrentSession();
  const loginUrl = new URL("/login", request.url);

  if (!session) {
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (session.user.role === UserRole.SUPER_ADMIN || session.user.role !== UserRole.BUSINESS_ADMIN) {
    return NextResponse.redirect(new URL("/billing?error=unauthorized", request.url), { status: 303 });
  }

  const limiter = await rateLimitPlaceholder(session.user.email, "payment-initiate", session.user.businessId);
  if (!limiter.allowed) {
    await createAuditLog({
      businessId: session.user.businessId,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.BILLING,
      action: "payment_initiation_rate_limited",
      message: "Billing initiation blocked by rate limit."
    });
    return NextResponse.redirect(new URL("/billing?error=rate_limited", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const rawPlan = String(formData.get("plan") ?? "");
  const plan = Object.values(SubscriptionPlan).find((value) => value === rawPlan);

  if (!plan || plan !== SubscriptionPlan.PRO) {
    return NextResponse.redirect(new URL("/billing?error=unsupported_plan", request.url), { status: 303 });
  }

  const pricing = getPlanPricing(plan);
  const merchantOid = createMerchantOid();

  const payment = await prisma.billingPayment.create({
    data: {
      businessId: session.user.businessId,
      plan,
      merchantOid,
      amountMinor: pricing.amountMinor,
      requestedByEmail: session.user.email,
      requestedByName: session.user.name
    }
  });

  console.info("[PAYTR:payment-created]", {
    paymentId: payment.id,
    merchantOid,
    plan,
    businessId: session.user.businessId
  });

  await createAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.BILLING,
    action: "payment_initiated",
    message: "PAYTR payment flow initiated.",
    targetType: "BillingPayment",
    targetId: payment.id,
    metadata: {
      plan
    }
  });

  return NextResponse.redirect(new URL(`/billing/paytr?payment=${payment.id}`, request.url), { status: 303 });
}
