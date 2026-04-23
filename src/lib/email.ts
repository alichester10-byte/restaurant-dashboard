import { getAppBaseUrl } from "@/lib/billing";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM ?? "Limon Masa <noreply@limonmasa.com>",
    replyTo: process.env.EMAIL_REPLY_TO
  };
}

export async function sendEmail(input: SendEmailInput) {
  const config = getEmailConfig();

  if (!config.apiKey) {
    console.warn("[email:skipped]", {
      reason: "missing_resend_api_key",
      to: input.to,
      subject: input.subject
    });
    return { ok: false as const, skipped: true as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.from,
      to: input.to,
      reply_to: config.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[email:error]", {
      to: input.to,
      subject: input.subject,
      status: response.status,
      body
    });
    return { ok: false as const, skipped: false as const };
  }

  return { ok: true as const, skipped: false as const };
}

export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
  businessName: string;
}) {
  return sendEmail({
    to: input.to,
    subject: `${input.businessName} hesabınız hazır`,
    text: `Merhaba ${input.name}, ${input.businessName} hesabınız oluşturuldu. Panelinize giriş yapabilirsiniz.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#14211b;">
        <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#607268;">Limon Masa Ops</div>
        <h1 style="margin-top:16px;font-size:28px;">Merhaba ${input.name}, hesabınız hazır.</h1>
        <p style="font-size:16px;line-height:1.7;color:#607268;">
          ${input.businessName} workspace'i başarıyla oluşturuldu. Rezervasyon, çağrı ve masa operasyonlarını yönetmek için artık giriş yapabilirsiniz.
        </p>
        <a href="${getAppBaseUrl()}/login" style="display:inline-block;margin-top:16px;background:#214c3d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:14px;font-weight:600;">
          Panele Giriş Yap
        </a>
      </div>
    `
  });
}

export async function sendVerificationEmail(input: {
  to: string;
  name: string;
  verificationUrl: string;
}) {
  return sendEmail({
    to: input.to,
    subject: "E-posta adresinizi doğrulayın",
    text: `Merhaba ${input.name}, e-posta adresinizi doğrulamak için bağlantıyı açın: ${input.verificationUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#14211b;">
        <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#607268;">Limon Masa Ops</div>
        <h1 style="margin-top:16px;font-size:28px;">E-posta adresinizi doğrulayın</h1>
        <p style="font-size:16px;line-height:1.7;color:#607268;">
          Merhaba ${input.name}, hesabınızı güvenli tutmak için e-posta adresinizi doğrulamanızı öneriyoruz.
        </p>
        <a href="${input.verificationUrl}" style="display:inline-block;margin-top:16px;background:#214c3d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:14px;font-weight:600;">
          E-postayı Doğrula
        </a>
      </div>
    `
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  return sendEmail({
    to: input.to,
    subject: "Şifrenizi sıfırlayın",
    text: `Merhaba ${input.name}, şifrenizi sıfırlamak için bu bağlantıyı açın: ${input.resetUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#14211b;">
        <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#607268;">Limon Masa Ops</div>
        <h1 style="margin-top:16px;font-size:28px;">Şifrenizi sıfırlayın</h1>
        <p style="font-size:16px;line-height:1.7;color:#607268;">
          Merhaba ${input.name}, hesabınız için şifre sıfırlama talebi aldık. Bağlantı 1 saat boyunca geçerlidir.
        </p>
        <a href="${input.resetUrl}" style="display:inline-block;margin-top:16px;background:#214c3d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:14px;font-weight:600;">
          Yeni Şifre Belirle
        </a>
      </div>
    `
  });
}
