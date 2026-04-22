import { CallOutcome, CustomerTag, ReservationSource, ReservationStatus, TableStatus } from "@prisma/client";

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
