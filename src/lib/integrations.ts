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
    buttonLabel: "Instagram'ı Bağla",
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
    source: ReservationSource.AI
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
  const tomorrowMatch = normalized.match(/\byarın\b/i);
  const todayMatch = normalized.match(/\bbugün\b/i);
  const nameMatch = normalized.match(/(?:ben|adım|isim)\s+([A-Za-zÇĞİÖŞÜçğıöşü\s]{2,40})/i);

  let requestedDate: string | undefined;
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    const year = (dateMatch[3] ?? String(new Date().getFullYear())).padStart(4, "20");
    requestedDate = `${year}-${month}-${day}`;
  } else if (tomorrowMatch || todayMatch) {
    const baseDate = new Date();
    if (tomorrowMatch) {
      baseDate.setDate(baseDate.getDate() + 1);
    }
    requestedDate = baseDate.toISOString().slice(0, 10);
  }

  const requestedTime = timeMatch?.[0]?.replace(".", ":");
  const guestCount = guestCountMatch ? Number(guestCountMatch[1]) : undefined;
  const guestName = nameMatch?.[1]?.trim() || normalized.split(/[,.!\n]/)[0]?.slice(0, 80) || "Yeni talep";

  return {
    guestName,
    guestPhone: phoneMatch?.[0]?.trim(),
    requestedDate,
    requestedTime,
    guestCount,
    confidenceScore: [phoneMatch, guestCountMatch, timeMatch, dateMatch].filter(Boolean).length / 4
  };
}
