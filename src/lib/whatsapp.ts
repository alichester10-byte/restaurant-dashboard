import crypto from "node:crypto";

export const WHATSAPP_SAMPLE_MESSAGE =
  "Merhaba, yarın akşam 20:00 için 4 kişilik yer var mı? Ben Elif, telefonum +90 555 222 33 44.";

export function getWhatsAppVerifyToken() {
  if (process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return process.env.META_WEBHOOK_VERIFY_TOKEN;
  }

  const seed = process.env.SESSION_SECRET ?? process.env.NEXT_PUBLIC_APP_URL ?? "limon-masa-whatsapp";
  return `wa_${crypto.createHash("sha256").update(seed).digest("hex").slice(0, 24)}`;
}
