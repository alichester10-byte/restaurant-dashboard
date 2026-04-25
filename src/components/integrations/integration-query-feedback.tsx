"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui/panel";

const integrationErrorMessages: Record<string, string> = {
  SESSION: "Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapıp bağlantıyı yeniden başlatın.",
  whatsapp_setup_required: "WhatsApp self-serve bağlantısı için Meta uygulama kurulumu henüz tamamlanmadı.",
  instagram_setup_required: "Instagram self-serve bağlantısı için Meta Business Login yapılandırması eksik.",
  whatsapp_connect_failed: "WhatsApp bağlantısı tamamlanamadı. Meta izinlerini ve telefon numarası erişimini kontrol edin.",
  instagram_connect_failed: "Instagram bağlantısı tamamlanamadı. Professional hesap ve Messaging izinlerini kontrol edin.",
  whatsapp_test_mode: "Meta uygulaması şu anda development/test modunda görünüyor. Yalnızca app admins, developers veya testers bağlantıyı tamamlayabilir.",
  instagram_test_mode: "Meta uygulaması şu anda development/test modunda görünüyor. Yalnızca app admins, developers veya testers bağlantıyı tamamlayabilir.",
  whatsapp_redirect_mismatch: "WhatsApp redirect URI Meta ayarlarındaki Valid OAuth Redirect URIs listesiyle eşleşmiyor.",
  instagram_redirect_mismatch: "Instagram redirect URI Meta ayarlarındaki Valid OAuth Redirect URIs listesiyle eşleşmiyor.",
  meta_state_invalid: "Bağlantı oturumu doğrulanamadı. Lütfen tekrar deneyin.",
  meta_session_expired: "Bağlantı oturumu süresi doldu. Panelden tekrar bağlamayı deneyin.",
  meta_callback_failed: "Meta callback işlendi ancak bağlantı tamamlanamadı. Aşağıdaki adım bilgisiyle kontrol edin."
};

const callbackStepLabels: Record<string, string> = {
  TOKEN: "Meta token alınamadı",
  PARSE: "Meta verisi işlenemedi",
  DB: "Veritabanına kaydedilemedi",
  SESSION: "Kullanıcı/işletme bulunamadı",
  UNKNOWN: "Bilinmeyen hata"
};

export function IntegrationQueryFeedback() {
  const searchParams = useSearchParams();
  const configured = searchParams.get("configured");
  const saved = searchParams.get("saved");
  const connected = searchParams.get("connected");
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const step = searchParams.get("step");
  const stepLabel = step ? callbackStepLabels[step] ?? callbackStepLabels.UNKNOWN : null;

  useEffect(() => {
    if (stepLabel) {
      console.info("[integrations:meta_callback_step]", {
        error,
        step,
        stepLabel
      });
    }
  }, [error, step, stepLabel]);

  const successMessage =
    saved === "approved"
      ? "Bekleyen talep onaylanarak rezervasyona dönüştürüldü."
      : saved === "rejected"
        ? "Talep reddedildi ve nedeni kaydedildi."
        : saved === "created"
          ? "Mesaj AI asistanı tarafından çözümelendi ve onay bekleyen talep olarak eklendi."
          : connected === "WHATSAPP" || success === "whatsapp_connected"
            ? "WhatsApp Business bağlantısı tamamlandı. Gelen mesajlar artık pending request olarak işlenmeye hazır."
            : connected === "INSTAGRAM" || success === "instagram_connected"
              ? "Instagram bağlantısı tamamlandı. DM talepleri artık onay kuyruğuna düşebilir."
              : configured
                ? "Bağlantı akışı yapılandırma aşamasına alındı."
                : null;

  return (
    <>
      {successMessage ? (
        <Panel className="border-emerald-200 bg-emerald-50/80">
          <div className="section-title text-emerald-700">Kanal Güncellendi</div>
          <p className="mt-2 text-sm leading-6 text-emerald-700">{successMessage}</p>
        </Panel>
      ) : null}

      {error ? (
        <Panel className="border-rose-200 bg-rose-50/80">
          <div className="section-title text-rose-700">Bağlantı Tamamlanamadı</div>
          <p className="mt-2 text-sm leading-6 text-rose-700">
            {integrationErrorMessages[error] ?? "İşlem sırasında beklenmeyen bir hata oluştu."}
          </p>
          <p className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-sm font-medium text-rose-700">
            {stepLabel ?? callbackStepLabels.UNKNOWN}
          </p>
        </Panel>
      ) : null}
    </>
  );
}
