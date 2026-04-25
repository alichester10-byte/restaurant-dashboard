import "server-only";

import crypto from "node:crypto";
import { IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { getAppBaseUrl } from "@/lib/billing";

const META_GRAPH_VERSION = "v20.0";

type MetaProvider = "whatsapp" | "instagram";

type MetaConnectionState = {
  provider: MetaProvider;
  businessId: string;
  userId: string;
  issuedAt: number;
};

function getMetaEnv(name: string) {
  const value = process.env[name];
  return value && value.length > 0 ? value : null;
}

function getStateSecret() {
  return process.env.META_APP_SECRET ?? process.env.SESSION_SECRET ?? "limon-masa-meta-state";
}

function getEncryptionSecret() {
  return process.env.SESSION_SECRET ?? process.env.META_APP_SECRET ?? "limon-masa-meta-token";
}

function deriveKey(secret: string) {
  return crypto.createHash("sha256").update(secret).digest();
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return crypto.createHmac("sha256", getStateSecret()).update(payload).digest("base64url");
}

export function encryptMetaToken(value: string) {
  const iv = crypto.randomBytes(12);
  const key = deriveKey(getEncryptionSecret());
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptMetaToken(value: string) {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Encrypted token payload is invalid.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    deriveKey(getEncryptionSecret()),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

export function getMetaProviderSetup(provider: MetaProvider) {
  const shared = {
    appId: getMetaEnv("META_APP_ID"),
    appSecret: getMetaEnv("META_APP_SECRET"),
    publicAppId: getMetaEnv("NEXT_PUBLIC_META_APP_ID"),
    verifyToken: getMetaEnv("META_WEBHOOK_VERIFY_TOKEN"),
    appWebhookSecret: getMetaEnv("META_WEBHOOK_APP_SECRET")
  };

  const configId =
    provider === "whatsapp"
      ? getMetaEnv("META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID")
      : getMetaEnv("META_INSTAGRAM_LOGIN_CONFIG_ID");

  const missing = [
    !shared.appId ? "META_APP_ID" : null,
    !shared.appSecret ? "META_APP_SECRET" : null,
    !shared.publicAppId ? "NEXT_PUBLIC_META_APP_ID" : null,
    !configId
      ? provider === "whatsapp"
        ? "META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID"
        : "META_INSTAGRAM_LOGIN_CONFIG_ID"
      : null,
    !shared.verifyToken ? "META_WEBHOOK_VERIFY_TOKEN" : null,
    !shared.appWebhookSecret ? "META_WEBHOOK_APP_SECRET" : null
  ].filter(Boolean) as string[];

  return {
    available: missing.length === 0,
    missing,
    configId,
    appId: shared.publicAppId,
    verifyToken: shared.verifyToken,
    callbackUrl: `${getAppBaseUrl()}/api/integrations/meta/callback`,
    whatsappWebhookUrl: `${getAppBaseUrl()}/api/integrations/whatsapp/webhook`,
    instagramWebhookUrl: `${getAppBaseUrl()}/api/integrations/instagram/webhook`
  };
}

export function createMetaConnectionState(input: Omit<MetaConnectionState, "issuedAt">) {
  const payload = JSON.stringify({
    ...input,
    issuedAt: Date.now()
  } satisfies MetaConnectionState);
  const encoded = encodeBase64Url(payload);
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifyMetaConnectionState(value: string | null) {
  if (!value) {
    return null;
  }

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = signPayload(encoded);
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encoded)) as MetaConnectionState;
    if (Date.now() - parsed.issuedAt > 15 * 60 * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getProviderScopes(provider: MetaProvider) {
  if (provider === "whatsapp") {
    return [
      "business_management",
      "whatsapp_business_management",
      "whatsapp_business_messaging"
    ];
  }

  return [
    "business_management",
    "pages_show_list",
    "pages_manage_metadata",
    "instagram_basic",
    "instagram_manage_messages"
  ];
}

export function buildMetaAuthorizationUrl(provider: MetaProvider, state: string) {
  const setup = getMetaProviderSetup(provider);
  if (!setup.available || !setup.appId || !setup.configId) {
    throw new Error("Meta credentials are not fully configured.");
  }

  const url = new URL(`https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", setup.appId);
  url.searchParams.set("redirect_uri", setup.callbackUrl);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", getProviderScopes(provider).join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("config_id", setup.configId);

  if (provider === "whatsapp") {
    url.searchParams.set("extras", JSON.stringify({
      feature: "whatsapp_embedded_signup",
      sessionInfoVersion: 3
    }));
  }

  return url.toString();
}

async function fetchMetaJson<T>(path: string, input: { accessToken?: string; searchParams?: Record<string, string | undefined>; method?: string; body?: BodyInit | null } = {}) {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}${path}`);

  for (const [key, value] of Object.entries(input.searchParams ?? {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  if (input.accessToken) {
    url.searchParams.set("access_token", input.accessToken);
  }

  const response = await fetch(url, {
    method: input.method ?? "GET",
    body: input.body ?? null,
    cache: "no-store"
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Meta request failed with ${response.status}.`);
  }

  return payload as T;
}

export async function exchangeMetaCodeForToken(code: string) {
  const appId = getMetaEnv("META_APP_ID");
  const appSecret = getMetaEnv("META_APP_SECRET");
  const redirectUri = `${getAppBaseUrl()}/api/integrations/meta/callback`;

  if (!appId || !appSecret) {
    throw new Error("Meta app credentials are not configured.");
  }

  return fetchMetaJson<{ access_token: string; token_type?: string; expires_in?: number }>("/oauth/access_token", {
    searchParams: {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code
    }
  });
}

async function subscribeAppToTarget(targetId: string, accessToken: string) {
  try {
    await fetchMetaJson<{ success?: boolean }>(`/${targetId}/subscribed_apps`, {
      accessToken,
      method: "POST"
    });
    return new Date();
  } catch {
    return null;
  }
}

async function getWhatsAppMetadata(accessToken: string) {
  const businesses = await fetchMetaJson<{ data: Array<{ id: string; name: string }> }>("/me/businesses", {
    accessToken,
    searchParams: {
      fields: "id,name"
    }
  });

  for (const business of businesses.data ?? []) {
    const owned = await fetchMetaJson<{ data: Array<{ id: string; name?: string; phone_numbers?: { data?: Array<{ id: string; display_phone_number?: string; verified_name?: string }> } }> }>(
      `/${business.id}/owned_whatsapp_business_accounts`,
      {
        accessToken,
        searchParams: {
          fields: "id,name,phone_numbers{id,display_phone_number,verified_name}"
        }
      }
    ).catch(() => ({ data: [] }));

    const waba = owned.data?.[0];
    const phone = waba?.phone_numbers?.data?.[0];
    if (waba?.id && phone?.id) {
      return {
        metaBusinessId: business.id,
        wabaId: waba.id,
        phoneNumberId: phone.id,
        displayPhoneNumber: phone.display_phone_number ?? phone.verified_name ?? null
      };
    }
  }

  throw new Error("WhatsApp Business hesabı veya telefon numarası bulunamadı.");
}

async function getInstagramMetadata(accessToken: string) {
  const pages = await fetchMetaJson<{ data: Array<{ id: string; name?: string; access_token?: string; instagram_business_account?: { id: string; username?: string } }> }>("/me/accounts", {
    accessToken,
    searchParams: {
      fields: "id,name,access_token,instagram_business_account{id,username}"
    }
  });

  const page = (pages.data ?? []).find((item) => item.instagram_business_account?.id);
  if (!page?.instagram_business_account?.id) {
    throw new Error("Instagram Professional hesabı bulunamadı.");
  }

  return {
    facebookPageId: page.id,
    instagramAccountId: page.instagram_business_account.id,
    instagramUsername: page.instagram_business_account.username ?? null,
    pageAccessToken: page.access_token ?? accessToken
  };
}

export async function completeWhatsAppConnection(code: string) {
  const token = await exchangeMetaCodeForToken(code);
  const metadata = await getWhatsAppMetadata(token.access_token);
  const webhookSubscribedAt = metadata.wabaId
    ? await subscribeAppToTarget(metadata.wabaId, token.access_token)
    : null;

  return {
    status: IntegrationStatus.CONNECTED,
    externalAccountId: metadata.wabaId,
    metaBusinessId: metadata.metaBusinessId,
    wabaId: metadata.wabaId,
    phoneNumberId: metadata.phoneNumberId,
    displayPhoneNumber: metadata.displayPhoneNumber,
    accessTokenEncrypted: encryptMetaToken(token.access_token),
    tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    webhookSubscribedAt,
    lastSyncedAt: new Date(),
    errorMessage: null,
    config: {
      connectedAt: new Date().toISOString()
    }
  };
}

export async function completeInstagramConnection(code: string) {
  const token = await exchangeMetaCodeForToken(code);
  const metadata = await getInstagramMetadata(token.access_token);
  const webhookSubscribedAt = metadata.facebookPageId
    ? await subscribeAppToTarget(metadata.facebookPageId, metadata.pageAccessToken)
    : null;

  return {
    status: IntegrationStatus.CONNECTED,
    externalAccountId: metadata.instagramAccountId,
    facebookPageId: metadata.facebookPageId,
    instagramAccountId: metadata.instagramAccountId,
    instagramUsername: metadata.instagramUsername,
    accessTokenEncrypted: encryptMetaToken(metadata.pageAccessToken),
    tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    webhookSubscribedAt,
    lastSyncedAt: new Date(),
    errorMessage: null,
    config: {
      connectedAt: new Date().toISOString()
    }
  };
}

