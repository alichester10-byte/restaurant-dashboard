import { SubscriptionPlan, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPlanPricing } from "@/lib/billing";
import { getCurrentSession } from "@/lib/auth";
import { createMerchantOid } from "@/lib/paytr";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  const loginUrl = new URL("/login", request.url);

  if (!session) {
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (session.user.role === UserRole.SUPER_ADMIN || session.user.role !== UserRole.BUSINESS_ADMIN) {
    return NextResponse.redirect(new URL("/billing?error=unauthorized", request.url), { status: 303 });
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

  return NextResponse.redirect(new URL(`/billing/paytr?payment=${payment.id}`, request.url), { status: 303 });
}
