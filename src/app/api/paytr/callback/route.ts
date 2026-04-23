import { BillingPaymentStatus, SubscriptionStatus } from "@prisma/client";
import { calculateSubscriptionPeriodEnd } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { verifyPaytrCallbackHash } from "@/lib/paytr";

function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const params = new URLSearchParams(body);

  const merchantOid = params.get("merchant_oid") ?? "";
  const status = params.get("status") ?? "";
  const totalAmount = params.get("total_amount") ?? "";
  const hash = params.get("hash") ?? "";

  if (!merchantOid || !status || !totalAmount || !hash) {
    console.warn("[PAYTR:callback-missing-fields]", {
      merchantOid,
      status,
      totalAmount,
      hasHash: Boolean(hash)
    });
    return textResponse("PAYTR notification failed: missing fields", 400);
  }

  if (!verifyPaytrCallbackHash({ merchantOid, status, totalAmount, hash })) {
    console.warn("[PAYTR:callback-bad-hash]", {
      merchantOid,
      status,
      totalAmount
    });
    return textResponse("PAYTR notification failed: bad hash", 400);
  }

  console.info("[PAYTR:callback-hit]", {
    merchantOid,
    status,
    totalAmount
  });

  const payment = await prisma.billingPayment.findUnique({
    where: {
      merchantOid
    },
    include: {
      business: true
    }
  });

  if (!payment) {
    console.warn("[PAYTR:callback-payment-not-found]", {
      merchantOid
    });
    return textResponse("OK");
  }

  if (payment.status === BillingPaymentStatus.SUCCEEDED || payment.status === BillingPaymentStatus.FAILED) {
    console.info("[PAYTR:callback-duplicate]", {
      merchantOid,
      paymentStatus: payment.status
    });
    return textResponse("OK");
  }

  const callbackPayload = Object.fromEntries(params.entries());

  if (status === "success") {
    const nextPeriodEnd = calculateSubscriptionPeriodEnd(payment.plan, payment.business.subscriptionCurrentPeriodEndsAt);

    await prisma.$transaction([
      prisma.billingPayment.update({
        where: {
          id: payment.id
        },
        data: {
          status: BillingPaymentStatus.SUCCEEDED,
          completedAt: new Date(),
          collectedAmountMinor: Number(totalAmount),
          callbackHash: hash,
          callbackPayload
        }
      }),
      prisma.business.update({
        where: {
          id: payment.businessId
        },
        data: {
          subscriptionPlan: payment.plan,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionCurrentPeriodEndsAt: nextPeriodEnd,
          trialEndsAt: null,
          lastPaymentFailedAt: null
        }
      })
    ]);

    console.info("[PAYTR:callback-success]", {
      merchantOid,
      businessId: payment.businessId,
      activatedPlan: payment.plan,
      nextPeriodEnd: nextPeriodEnd.toISOString()
    });

    return textResponse("OK");
  }

  const failedReasonCode = params.get("failed_reason_code");
  const failedReasonMessage = params.get("failed_reason_msg");

  await prisma.$transaction([
    prisma.billingPayment.update({
      where: {
        id: payment.id
      },
      data: {
        status: BillingPaymentStatus.FAILED,
        failedAt: new Date(),
        failureReasonCode: failedReasonCode,
        failureReasonMessage: failedReasonMessage,
        callbackHash: hash,
        callbackPayload
      }
    }),
    prisma.business.update({
      where: {
        id: payment.businessId
      },
      data: {
        subscriptionStatus: payment.business.subscriptionStatus === SubscriptionStatus.ACTIVE
          ? SubscriptionStatus.PAST_DUE
          : payment.business.subscriptionStatus,
        lastPaymentFailedAt: new Date()
      }
    })
  ]);

  console.warn("[PAYTR:callback-failed]", {
    merchantOid,
    businessId: payment.businessId,
    failedReasonCode,
    failedReasonMessage
  });

  return textResponse("OK");
}
