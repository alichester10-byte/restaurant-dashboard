import { IntegrationProvider, IntegrationStatus, ReservationSource } from "@prisma/client";

export const integrationDescriptions: Record<
  IntegrationProvider,
  {
    title: string;
    description: string;
    buttonLabel: string;
    source: ReservationSource;
  }
> = {
  WHATSAPP: {
    title: "WhatsApp Business",
    description: "WhatsApp mesajlarını güvenli webhook ile alır, rezervasyon niyetlerini çözümler ve onay bekleyen taleplere dönüştürür.",
    buttonLabel: "WhatsApp'ı Bağla",
    source: ReservationSource.WHATSAPP
  },
  INSTAGRAM: {
    title: "Instagram DM",
    description: "Instagram Professional hesaplarından gelen DM taleplerini toplar, uygun bilgileri çıkarır ve ekip onayına sunar.",
    buttonLabel: "Instagram'ı Yapılandır",
    source: ReservationSource.INSTAGRAM
  },
  GOOGLE_WEB: {
    title: "Google / Web Reservations",
    description: "Google ve web kaynaklı istekleri merkezi bir bekleyen talepler akışında toplar.",
    buttonLabel: "Kaynağı Etkinleştir",
    source: ReservationSource.GOOGLE
  },
  WEBSITE_WIDGET: {
    title: "Website Reservation Widget",
    description: "Web sitenize gömülebilen talep formu ile rezervasyonları onay akışına düşürür.",
    buttonLabel: "Widget Kurulumu",
    source: ReservationSource.WEBSITE
  },
  AI_ASSISTANT: {
    title: "AI Reservation Assistant",
    description: "Gelen mesajlardan isim, telefon, tarih, saat ve kişi sayısını çıkarır; güven skoru ile insan onayına sunar.",
    buttonLabel: "AI Yardımcısını Hazırla",
    source: ReservationSource.WHATSAPP
  }
};

export function getIntegrationDefaultStatus(provider: IntegrationProvider) {
  if (provider === IntegrationProvider.AI_ASSISTANT || provider === IntegrationProvider.GOOGLE_WEB) {
    return IntegrationStatus.NEEDS_CONFIGURATION;
  }

  return IntegrationStatus.NOT_CONNECTED;
}

export function extractReservationSignal(message: string) {
  const normalized = message.trim();
  const phoneMatch = normalized.match(/(\+?\d[\d\s()-]{8,}\d)/);
  const guestCountMatch = normalized.match(/(\d+)\s*(kişi|kisilik|kişilik|pax)/i);
  const timeMatch = normalized.match(/([01]?\d|2[0-3])[:.][0-5]\d/);
  const dateMatch = normalized.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);

  let requestedDate: string | undefined;
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    const year = (dateMatch[3] ?? String(new Date().getFullYear())).padStart(4, "20");
    requestedDate = `${year}-${month}-${day}`;
  }

  const requestedTime = timeMatch?.[0]?.replace(".", ":");
  const guestCount = guestCountMatch ? Number(guestCountMatch[1]) : undefined;

  return {
    guestName: normalized.split(/[,.!\n]/)[0]?.slice(0, 80) || "Yeni talep",
    guestPhone: phoneMatch?.[0]?.trim(),
    requestedDate,
    requestedTime,
    guestCount,
    confidenceScore: [phoneMatch, guestCountMatch, timeMatch, dateMatch].filter(Boolean).length / 4
  };
}
