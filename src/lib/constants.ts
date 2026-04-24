import { BillingPaymentStatus, BusinessStatus, CallOutcome, CustomerTag, IntegrationProvider, IntegrationStatus, ReservationRequestStatus, ReservationSource, ReservationStatus, SubscriptionPlan, SubscriptionStatus, TableArea, TableShape, TableStatus, UserRole } from "@prisma/client";

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  CONFIRMED: "Onaylandı",
  PENDING: "Bekliyor",
  CANCELLED: "İptal",
  COMPLETED: "Tamamlandı",
  NO_SHOW: "Gelmedi"
};

export const tableStatusLabels: Record<TableStatus, string> = {
  EMPTY: "Boş",
  OCCUPIED: "Dolu",
  RESERVED: "Rezerve",
  MAINTENANCE: "Bakım"
};

export const tableAreaLabels: Record<TableArea, string> = {
  WINDOW: "Cam önü",
  ENTRANCE: "Kapı kenarı",
  GARDEN: "Bahçe",
  TERRACE: "Teras",
  MAIN_DINING: "İç salon",
  VIP: "VIP alan",
  BAR: "Bar önü",
  CUSTOM: "Özel alan"
};

export const tableShapeLabels: Record<TableShape, string> = {
  ROUND: "Yuvarlak",
  SQUARE: "Kare",
  RECTANGLE: "Dikdörtgen",
  BOOTH: "Booth",
  BAR: "Bar",
  CUSTOM: "Özel"
};

export const callOutcomeLabels: Record<CallOutcome, string> = {
  ANSWERED: "Yanıtlandı",
  MISSED: "Cevapsız",
  RESERVATION_INQUIRY: "Rezervasyon Sorusu",
  INFO_REQUEST: "Bilgi Talebi"
};

export const customerTagLabels: Record<CustomerTag, string> = {
  VIP: "VIP",
  REGULAR: "Regular",
  NEW: "Yeni"
};

export const reservationSourceLabels: Record<ReservationSource, string> = {
  PHONE: "Telefon",
  INSTAGRAM: "Instagram",
  WALK_IN: "Walk-in",
  WEBSITE: "Web",
  GOOGLE: "Google",
  WHATSAPP: "WhatsApp"
};

export const userRoleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Süper Admin",
  BUSINESS_ADMIN: "İşletme Yöneticisi",
  STAFF: "Personel"
};

export const businessStatusLabels: Record<BusinessStatus, string> = {
  ACTIVE: "Aktif",
  SUSPENDED: "Askıda"
};

export const subscriptionPlanLabels: Record<SubscriptionPlan, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise"
};

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  TRIALING: "Deneme",
  ACTIVE: "Aktif",
  PAST_DUE: "Gecikmiş",
  CANCELED: "İptal"
};

export const billingPaymentStatusLabels: Record<BillingPaymentStatus, string> = {
  PENDING: "Bekliyor",
  SUCCEEDED: "Başarılı",
  FAILED: "Başarısız",
  EXPIRED: "Süresi Doldu"
};

export const integrationProviderLabels: Record<IntegrationProvider, string> = {
  WHATSAPP: "WhatsApp Business",
  INSTAGRAM: "Instagram DM",
  GOOGLE_WEB: "Google / Web Rezervasyon",
  WEBSITE_WIDGET: "Website Widget",
  AI_ASSISTANT: "AI Reservation Assistant"
};

export const integrationStatusLabels: Record<IntegrationStatus, string> = {
  NOT_CONNECTED: "Bağlı değil",
  CONNECTED: "Bağlı",
  NEEDS_CONFIGURATION: "Yapılandırma gerekli"
};

export const reservationRequestStatusLabels: Record<ReservationRequestStatus, string> = {
  PENDING: "Onay bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi"
};
