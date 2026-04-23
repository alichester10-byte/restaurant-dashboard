import crypto from "node:crypto";
import { SubscriptionPlan } from "@prisma/client";
import { getAppBaseUrl, getPlanPricing } from "@/lib/billing";

const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function normalizePaytrReturnUrl(value: string | undefined, fallbackPath: "/billing/success" | "/billing/fail") {
  const baseUrl = getAppBaseUrl();
  const fallback = new URL(fallbackPath, baseUrl).toString();

  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(value);

    if (url.pathname === "/billing/result/success") {
      url.pathname = "/billing/success";
      return url.toString();
    }

    if (url.pathname === "/billing/result/fail") {
      url.pathname = "/billing/fail";
      return url.toString();
    }

    return url.toString();
  } catch {
    return fallback;
  }
}

export function getPaytrConfig() {
  return {
    merchantId: getRequiredEnv("PAYTR_MERCHANT_ID"),
    merchantKey: getRequiredEnv("PAYTR_MERCHANT_KEY"),
    merchantSalt: getRequiredEnv("PAYTR_MERCHANT_SALT"),
    okUrl: normalizePaytrReturnUrl(process.env.PAYTR_OK_URL, "/billing/success"),
    failUrl: normalizePaytrReturnUrl(process.env.PAYTR_FAIL_URL, "/billing/fail"),
    callbackUrl: process.env.PAYTR_CALLBACK_URL ?? `${getAppBaseUrl()}/api/paytr/callback`
  };
}

export function createMerchantOid() {
  return `P${Date.now()}${crypto.randomBytes(10).toString("hex").toUpperCase()}`.slice(0, 40);
}

export function getRequestIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "127.0.0.1";
  }

  return headers.get("x-real-ip") ?? "127.0.0.1";
}

export function formatMinorAmount(amountMinor: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(amountMinor / 100);
}

function encodeBasket(plan: SubscriptionPlan) {
  const pricing = getPlanPricing(plan);
  const basket = JSON.stringify([
    [pricing.title, (pricing.amountMinor / 100).toFixed(2), 1]
  ]);

  return Buffer.from(basket, "utf8").toString("base64");
}

export async function createPaytrIframeToken(input: {
  plan: SubscriptionPlan;
  merchantOid: string;
  email: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  userIp: string;
}) {
  const pricing = getPlanPricing(input.plan);
  const config = getPaytrConfig();
  const paymentAmount = String(pricing.amountMinor);
  const userBasket = encodeBasket(input.plan);
  const noInstallment = "1";
  const maxInstallment = "0";
  const currency = "TL";
  const testMode = process.env.NODE_ENV === "production" ? "0" : "1";
  const debugOn = process.env.NODE_ENV === "production" ? "0" : "1";
  const timeoutLimit = "30";
  const lang = "tr";

  const hashInput = `${config.merchantId}${input.userIp}${input.merchantOid}${input.email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
  const paytrToken = crypto
    .createHmac("sha256", config.merchantKey)
    .update(`${hashInput}${config.merchantSalt}`)
    .digest("base64");

  const formBody = new URLSearchParams({
    merchant_id: config.merchantId,
    user_ip: input.userIp,
    merchant_oid: input.merchantOid,
    email: input.email,
    payment_amount: paymentAmount,
    paytr_token: paytrToken,
    user_basket: userBasket,
    debug_on: debugOn,
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: input.userName,
    user_address: input.userAddress,
    user_phone: input.userPhone,
    merchant_ok_url: config.okUrl,
    merchant_fail_url: config.failUrl,
    timeout_limit: timeoutLimit,
    currency,
    test_mode: testMode,
    lang
  });

  console.info("[PAYTR:initiate]", {
    merchantOid: input.merchantOid,
    plan: input.plan,
    okUrl: config.okUrl,
    failUrl: config.failUrl,
    callbackUrl: config.callbackUrl,
    callbackReminder: "For iFrame API, callback URL must also be configured in the PAYTR merchant panel."
  });

  const response = await fetch(PAYTR_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formBody.toString(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`PAYTR token request failed with status ${response.status}.`);
  }

  const result = (await response.json()) as { status: string; token?: string; reason?: string };
  if (result.status !== "success" || !result.token) {
    throw new Error(result.reason ?? "PAYTR token could not be created.");
  }

  return {
    token: result.token,
    testMode: testMode === "1"
  };
}

export function verifyPaytrCallbackHash(input: {
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
}) {
  const { merchantKey, merchantSalt } = getPaytrConfig();
  const generated = crypto
    .createHmac("sha256", merchantKey)
    .update(`${input.merchantOid}${merchantSalt}${input.status}${input.totalAmount}`)
    .digest("base64");

  const expected = Buffer.from(generated);
  const actual = Buffer.from(input.hash);

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
