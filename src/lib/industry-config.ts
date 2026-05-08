import { BusinessType } from "@prisma/client";

export type IndustryFieldKey =
  | "guestName"
  | "guestPhone"
  | "customerEmail"
  | "requestedDate"
  | "requestedTime"
  | "endDate"
  | "guestCount"
  | "serviceType"
  | "resourcePreference"
  | "durationMinutes"
  | "notes";

export type IndustryConfig = {
  businessType: BusinessType;
  displayName: string;
  reservationLabel: string;
  reservationLabelPlural: string;
  requestLabel: string;
  requestLabelPlural: string;
  primaryResourceLabel: string;
  primaryResourceLabelPlural: string;
  customerLabel: string;
  customerLabelPlural: string;
  guestCountLabel: string;
  capacityLabel: string;
  channelRequestsLabel: string;
  serviceTypeLabel: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  resourceBoardTitle: string;
  requiredFields: IndustryFieldKey[];
  optionalFields: IndustryFieldKey[];
  serviceTypes: string[];
  bookingRules: string[];
  aiInstruction: string;
  unsupportedAdvice: string | null;
  publicDescription: string;
  publicSubmitLabel: string;
  quickShareLabel: string;
};

export const industryOptions = Object.values(BusinessType).map((value) => ({
  value,
  label: industryConfigsLabel(value)
}));

function industryConfigsLabel(value: BusinessType) {
  switch (value) {
    case BusinessType.RESTAURANT:
      return "Restoran";
    case BusinessType.CAFE:
      return "Kafe";
    case BusinessType.BEAUTY_SALON:
      return "Güzellik Salonu";
    case BusinessType.BARBER:
      return "Berber";
    case BusinessType.CLINIC:
      return "Klinik";
    case BusinessType.DENTIST:
      return "Diş Kliniği";
    case BusinessType.FITNESS:
      return "Fitness / Stüdyo";
    case BusinessType.HOTEL:
      return "Otel / Konaklama";
    case BusinessType.CAR_SERVICE:
      return "Araç Servisi";
    case BusinessType.CAR_WASH:
      return "Oto Yıkama";
    case BusinessType.EVENT_VENUE:
      return "Etkinlik Mekanı";
    case BusinessType.EDUCATION:
      return "Eğitim / Ders";
    case BusinessType.CONSULTING:
      return "Danışmanlık";
    case BusinessType.SPA:
      return "Spa";
    case BusinessType.WELLNESS:
      return "Wellness";
    case BusinessType.OTHER:
    default:
      return "Diğer";
  }
}

type IndustryConfigMap = Record<BusinessType, IndustryConfig>;

const commonRestaurantConfig: Omit<IndustryConfig, "businessType" | "displayName"> = {
  reservationLabel: "Rezervasyon",
  reservationLabelPlural: "Rezervasyonlar",
  requestLabel: "Rezervasyon Talebi",
  requestLabelPlural: "Rezervasyon Talepleri",
  primaryResourceLabel: "Masa",
  primaryResourceLabelPlural: "Masalar",
  customerLabel: "Misafir",
  customerLabelPlural: "Müşteriler",
  guestCountLabel: "Kişi Sayısı",
  capacityLabel: "Doluluk",
  channelRequestsLabel: "Kanal Rezervasyon Talepleri",
  serviceTypeLabel: "Servis Türü",
  dashboardTitle: "Operasyon Paneli",
  dashboardSubtitle: "Günlük rezervasyon akışını, talepleri ve kaynak kullanımını tek ekranda izleyin.",
  resourceBoardTitle: "Kaynak Planı",
  requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "guestCount"],
  optionalFields: ["notes", "serviceType", "resourcePreference"],
  serviceTypes: ["Akşam yemeği", "Kahvaltı", "Brunch", "Doğum günü", "Kutlama"],
  bookingRules: [
    "Talep restoran ekibi tarafından onaylanmadan rezervasyon kesinleşmez.",
    "İç / dış alan ve kutlama notları açıklama kısmında belirtilebilir."
  ],
  aiInstruction: "Restoran rezervasyon niyeti için isim, telefon, tarih, saat ve kişi sayısını tamamla.",
  unsupportedAdvice: null,
  publicDescription:
    "Formu doldurun; ekip uygunluğu kontrol edip talebinizi onay akışına alır. Rezervasyon otomatik kesinleşmez.",
  publicSubmitLabel: "Rezervasyon Talebi Gönder",
  quickShareLabel: "Paylaşılabilir rezervasyon linki"
};

export const industryConfigs: IndustryConfigMap = {
  RESTAURANT: {
    businessType: BusinessType.RESTAURANT,
    displayName: "Restoran",
    ...commonRestaurantConfig
  },
  CAFE: {
    businessType: BusinessType.CAFE,
    displayName: "Kafe",
    ...commonRestaurantConfig,
    serviceTypes: ["Kahve buluşması", "Brunch", "Atıştırmalık", "Kutlama"]
  },
  BEAUTY_SALON: {
    businessType: BusinessType.BEAUTY_SALON,
    displayName: "Güzellik Salonu",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Randevu Talebi",
    requestLabelPlural: "Randevu Talepleri",
    primaryResourceLabel: "Uzman",
    primaryResourceLabelPlural: "Uzmanlar",
    customerLabel: "Danışan",
    customerLabelPlural: "Danışanlar",
    guestCountLabel: "Seans",
    capacityLabel: "Dolu Slot",
    channelRequestsLabel: "Kanal Randevu Talepleri",
    serviceTypeLabel: "Hizmet",
    dashboardTitle: "Randevu Paneli",
    dashboardSubtitle: "Randevuları, uzman tercihlerini ve bekleyen talepleri tek panelden yönetin.",
    resourceBoardTitle: "Uzman Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "durationMinutes", "notes"],
    serviceTypes: ["Saç kesimi", "Boya", "Manikür", "Makyaj", "Cilt bakımı"],
    bookingRules: ["Talep ekip onayı olmadan kesinleşmez.", "Uzman tercihi varsa not alanında belirtilebilir."],
    aiInstruction: "Güzellik salonu randevusu için hizmet, isim, telefon, tarih ve saat bilgisini topla.",
    unsupportedAdvice: null,
    publicDescription: "Hizmet, tarih ve iletişim bilgilerinizi bırakın; ekip uygun uzmana göre dönüş yapar.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki"
  },
  BARBER: {
    businessType: BusinessType.BARBER,
    displayName: "Berber",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Randevu Talebi",
    requestLabelPlural: "Randevu Talepleri",
    primaryResourceLabel: "Berber",
    primaryResourceLabelPlural: "Berberler",
    customerLabel: "Müşteri",
    customerLabelPlural: "Müşteriler",
    guestCountLabel: "Seans",
    capacityLabel: "Dolu Slot",
    channelRequestsLabel: "Kanal Randevu Talepleri",
    serviceTypeLabel: "Hizmet",
    dashboardTitle: "Randevu Paneli",
    dashboardSubtitle: "Randevuları, berber tercihlerini ve bekleyen talepleri yönetin.",
    resourceBoardTitle: "Berber Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "notes"],
    serviceTypes: ["Saç kesimi", "Sakal tıraşı", "Bakım", "Çocuk kesimi"],
    bookingRules: ["Randevu ekip onayı ile kesinleşir."],
    aiInstruction: "Berber randevusu için hizmet, isim, telefon, tarih ve saati tamamla.",
    unsupportedAdvice: null,
    publicDescription: "Hizmet ve uygun saat tercihinizi iletin; ekip en uygun slotu onaylar.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki"
  },
  CLINIC: {
    businessType: BusinessType.CLINIC,
    displayName: "Klinik",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Randevu Talebi",
    requestLabelPlural: "Randevu Talepleri",
    primaryResourceLabel: "Uzman",
    primaryResourceLabelPlural: "Uzmanlar",
    customerLabel: "Hasta",
    customerLabelPlural: "Hastalar",
    guestCountLabel: "Randevu",
    capacityLabel: "Günlük Doluluk",
    channelRequestsLabel: "Kanal Randevu Talepleri",
    serviceTypeLabel: "Bölüm / Hizmet",
    dashboardTitle: "Randevu Operasyon Paneli",
    dashboardSubtitle: "Hasta randevu taleplerini ve uzman yönlendirmelerini güvenli şekilde toplayın.",
    resourceBoardTitle: "Uzman Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "notes"],
    serviceTypes: ["Genel muayene", "Kontrol", "Tetkik", "Danışma"],
    bookingRules: ["Yapay zeka tıbbi tavsiye vermez.", "Randevu uygunluğu ekip onayıyla netleşir."],
    aiInstruction: "Klinik randevusu için bölüm veya ziyaret nedeni, isim, telefon, tarih ve saati topla. Tıbbi tavsiye verme.",
    unsupportedAdvice: "Tıbbi tavsiye veremem; yalnızca randevu bilgilerini toplayıp ekibe iletebilirim.",
    publicDescription: "Bölüm, tarih ve iletişim bilgilerinizi iletin; ekip randevu uygunluğunu teyit eder.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki"
  },
  DENTIST: {
    businessType: BusinessType.DENTIST,
    displayName: "Diş Kliniği",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Randevu Talebi",
    requestLabelPlural: "Randevu Talepleri",
    primaryResourceLabel: "Doktor",
    primaryResourceLabelPlural: "Doktorlar",
    customerLabel: "Hasta",
    customerLabelPlural: "Hastalar",
    guestCountLabel: "Randevu",
    capacityLabel: "Günlük Doluluk",
    channelRequestsLabel: "Kanal Randevu Talepleri",
    serviceTypeLabel: "Bölüm / İşlem",
    dashboardTitle: "Randevu Operasyon Paneli",
    dashboardSubtitle: "Hasta randevularını, doktor tercihlerini ve bekleyen talepleri yönetin.",
    resourceBoardTitle: "Doktor Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "notes"],
    serviceTypes: ["Kontrol", "Diş temizliği", "Dolgu", "Ortodonti"],
    bookingRules: ["AI tıbbi yorum yapmaz.", "Randevu ancak klinik onayıyla netleşir."],
    aiInstruction: "Diş kliniği randevusu için işlem türü, isim, telefon, tarih ve saati topla. Tıbbi tavsiye verme.",
    unsupportedAdvice: "Tıbbi tavsiye veremem; yalnızca randevu talebinizi oluşturabilirim.",
    publicDescription: "İşlem türünü ve uygun zamanınızı iletin; ekip en uygun doktoru teyit eder.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki"
  },
  FITNESS: {
    businessType: BusinessType.FITNESS,
    displayName: "Fitness / Stüdyo",
    reservationLabel: "Seans",
    reservationLabelPlural: "Seanslar",
    requestLabel: "Seans Talebi",
    requestLabelPlural: "Seans Talepleri",
    primaryResourceLabel: "Eğitmen",
    primaryResourceLabelPlural: "Eğitmenler",
    customerLabel: "Üye",
    customerLabelPlural: "Üyeler",
    guestCountLabel: "Katılımcı",
    capacityLabel: "Kapasite",
    channelRequestsLabel: "Kanal Seans Talepleri",
    serviceTypeLabel: "Seans Türü",
    dashboardTitle: "Seans Paneli",
    dashboardSubtitle: "Bireysel veya grup seans taleplerini ve eğitmen planını yönetin.",
    resourceBoardTitle: "Eğitmen Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "guestCount", "notes"],
    serviceTypes: ["Özel ders", "Grup dersi", "Pilates", "Yoga", "Kondisyon"],
    bookingRules: ["Kesin uygunluk ekip onayıyla belirlenir."],
    aiInstruction: "Seans türü, isim, telefon, tarih ve saati topla; grup ya da özel bilgisi varsa not et.",
    unsupportedAdvice: null,
    publicDescription: "Seans türünü ve tercih ettiğiniz saati paylaşın; ekip kapasiteye göre onaylar.",
    publicSubmitLabel: "Seans Talebi Gönder",
    quickShareLabel: "Paylaşılabilir seans linki"
  },
  HOTEL: {
    businessType: BusinessType.HOTEL,
    displayName: "Otel / Konaklama",
    reservationLabel: "Rezervasyon",
    reservationLabelPlural: "Rezervasyonlar",
    requestLabel: "Konaklama Talebi",
    requestLabelPlural: "Konaklama Talepleri",
    primaryResourceLabel: "Oda",
    primaryResourceLabelPlural: "Odalar",
    customerLabel: "Misafir",
    customerLabelPlural: "Misafirler",
    guestCountLabel: "Konuk Sayısı",
    capacityLabel: "Oda Doluluğu",
    channelRequestsLabel: "Kanal Konaklama Talepleri",
    serviceTypeLabel: "Oda Tipi",
    dashboardTitle: "Rezervasyon Paneli",
    dashboardSubtitle: "Check-in / check-out taleplerini ve oda isteklerini tek akışta yönetin.",
    resourceBoardTitle: "Oda Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "endDate", "guestCount"],
    optionalFields: ["serviceType", "notes"],
    serviceTypes: ["Standart", "Deluxe", "Aile Odası", "Suit"],
    bookingRules: ["AI oda müsaitliğini garanti etmez.", "Talep ekip onayıyla kesinleşir."],
    aiInstruction: "Konaklama talebi için check-in, check-out, misafir sayısı, isim ve telefonu topla. Müsaitlik garantisi verme.",
    unsupportedAdvice: "Müsaitliği garanti edemem; talebinizi ekibe iletip son onayı almalarını sağlarım.",
    publicDescription: "Check-in, check-out ve misafir sayısını iletin; ekip oda uygunluğunu teyit eder.",
    publicSubmitLabel: "Konaklama Talebi Gönder",
    quickShareLabel: "Paylaşılabilir rezervasyon linki"
  },
  CAR_SERVICE: {
    businessType: BusinessType.CAR_SERVICE,
    displayName: "Araç Servisi",
    reservationLabel: "Servis Randevusu",
    reservationLabelPlural: "Servis Randevuları",
    requestLabel: "Servis Talebi",
    requestLabelPlural: "Servis Talepleri",
    primaryResourceLabel: "Servis Hattı",
    primaryResourceLabelPlural: "Servis Hatları",
    customerLabel: "Müşteri",
    customerLabelPlural: "Müşteriler",
    guestCountLabel: "Araç",
    capacityLabel: "Günlük Yoğunluk",
    channelRequestsLabel: "Kanal Servis Talepleri",
    serviceTypeLabel: "Servis Türü",
    dashboardTitle: "Servis Operasyon Paneli",
    dashboardSubtitle: "Araç servis taleplerini, plaka notlarını ve günlük randevuları yönetin.",
    resourceBoardTitle: "Servis Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["notes"],
    serviceTypes: ["Bakım", "Yağ değişimi", "Arıza kontrolü", "Lastik", "Yıkama"],
    bookingRules: ["Araç kabul saati ekip onayıyla netleşir."],
    aiInstruction: "Servis türü, araç plakası/modeli, isim, telefon, tarih ve saati topla.",
    unsupportedAdvice: null,
    publicDescription: "Araç ve servis ihtiyacınızı paylaşın; ekip uygun zaman aralığını onaylar.",
    publicSubmitLabel: "Servis Talebi Gönder",
    quickShareLabel: "Paylaşılabilir servis linki"
  },
  CAR_WASH: {
    businessType: BusinessType.CAR_WASH,
    displayName: "Araç Yıkama",
    reservationLabel: "Yıkama Randevusu",
    reservationLabelPlural: "Yıkama Randevuları",
    requestLabel: "Yıkama Talebi",
    requestLabelPlural: "Yıkama Talepleri",
    primaryResourceLabel: "Yıkama Hattı",
    primaryResourceLabelPlural: "Yıkama Hatları",
    customerLabel: "Müşteri",
    customerLabelPlural: "Müşteriler",
    guestCountLabel: "Araç",
    capacityLabel: "Günlük Yoğunluk",
    channelRequestsLabel: "Kanal Yıkama Talepleri",
    serviceTypeLabel: "Paket Türü",
    dashboardTitle: "Yıkama Operasyon Paneli",
    dashboardSubtitle: "Araç yıkama taleplerini ve günlük servis akışını tek panelde yönetin.",
    resourceBoardTitle: "Yıkama Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["notes"],
    serviceTypes: ["İç dış yıkama", "Hızlı yıkama", "Detaylı temizlik"],
    bookingRules: ["Kesin saat ekip yoğunluğuna göre onaylanır."],
    aiInstruction: "Paket türü, araç modeli/plakası, isim, telefon, tarih ve saati topla.",
    unsupportedAdvice: null,
    publicDescription: "Yıkama paketinizi ve uygun saatinizi iletin; ekip teyit ederek dönüş yapsın.",
    publicSubmitLabel: "Yıkama Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki"
  },
  EVENT_VENUE: {
    businessType: BusinessType.EVENT_VENUE,
    displayName: "Etkinlik Alanı",
    reservationLabel: "Etkinlik Rezervasyonu",
    reservationLabelPlural: "Etkinlik Rezervasyonları",
    requestLabel: "Etkinlik Talebi",
    requestLabelPlural: "Etkinlik Talepleri",
    primaryResourceLabel: "Salon",
    primaryResourceLabelPlural: "Salonlar",
    customerLabel: "Müşteri",
    customerLabelPlural: "Müşteriler",
    guestCountLabel: "Katılımcı Sayısı",
    capacityLabel: "Etkinlik Doluluğu",
    channelRequestsLabel: "Kanal Etkinlik Talepleri",
    serviceTypeLabel: "Etkinlik Türü",
    dashboardTitle: "Etkinlik Operasyon Paneli",
    dashboardSubtitle: "Düğün, davet ve organizasyon taleplerini paket tercihleriyle birlikte yönetin.",
    resourceBoardTitle: "Salon Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "guestCount", "serviceType"],
    optionalFields: ["notes"],
    serviceTypes: ["Düğün", "Nişan", "Kurumsal etkinlik", "Doğum günü"],
    bookingRules: ["Salon uygunluğu ekip onayıyla kesinleşir."],
    aiInstruction: "Etkinlik türü, tarih, saat, katılımcı sayısı, isim ve telefonu topla.",
    unsupportedAdvice: null,
    publicDescription: "Etkinlik türünü ve tahmini katılımcı sayısını iletin; ekip uygun paketi teyit etsin.",
    publicSubmitLabel: "Etkinlik Talebi Gönder",
    quickShareLabel: "Paylaşılabilir rezervasyon linki"
  },
  EDUCATION: {
    businessType: BusinessType.EDUCATION,
    displayName: "Eğitim / Kurs",
    reservationLabel: "Ders Randevusu",
    reservationLabelPlural: "Ders Randevuları",
    requestLabel: "Ders Talebi",
    requestLabelPlural: "Ders Talepleri",
    primaryResourceLabel: "Eğitmen",
    primaryResourceLabelPlural: "Eğitmenler",
    customerLabel: "Öğrenci",
    customerLabelPlural: "Öğrenciler",
    guestCountLabel: "Katılımcı",
    capacityLabel: "Sınıf Doluluğu",
    channelRequestsLabel: "Kanal Ders Talepleri",
    serviceTypeLabel: "Ders / Kurs Türü",
    dashboardTitle: "Ders Operasyon Paneli",
    dashboardSubtitle: "Özel ders ve kurs taleplerini eğitmen tercihleriyle birlikte yönetin.",
    resourceBoardTitle: "Eğitmen Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "guestCount", "notes"],
    serviceTypes: ["Özel ders", "Grup dersi", "Kurs", "Atölye"],
    bookingRules: ["Ders uygunluğu kurum tarafından teyit edilir."],
    aiInstruction: "Ders türü, isim, telefon, tarih ve saati topla; grup/özel bilgisini not et.",
    unsupportedAdvice: null,
    publicDescription: "Ders türünü ve uygun zamanınızı bırakın; ekip öğretmen ve kontenjanı kontrol eder.",
    publicSubmitLabel: "Ders Talebi Gönder",
    quickShareLabel: "Paylaşılabilir ders linki"
  },
  CONSULTING: {
    businessType: BusinessType.CONSULTING,
    displayName: "Danışmanlık",
    reservationLabel: "Görüşme",
    reservationLabelPlural: "Görüşmeler",
    requestLabel: "Görüşme Talebi",
    requestLabelPlural: "Görüşme Talepleri",
    primaryResourceLabel: "Danışman",
    primaryResourceLabelPlural: "Danışmanlar",
    customerLabel: "Danışan",
    customerLabelPlural: "Danışanlar",
    guestCountLabel: "Görüşme",
    capacityLabel: "Takvim Doluluğu",
    channelRequestsLabel: "Kanal Görüşme Talepleri",
    serviceTypeLabel: "Hizmet Konusu",
    dashboardTitle: "Görüşme Operasyon Paneli",
    dashboardSubtitle: "Danışmanlık randevularını ve konu özetlerini tek akışta yönetin.",
    resourceBoardTitle: "Danışman Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["customerEmail", "notes"],
    serviceTypes: ["Danışmanlık", "İlk görüşme", "Strateji toplantısı", "Takip görüşmesi"],
    bookingRules: ["AI hukuki/finansal tavsiye vermez.", "Görüşme ekip onayıyla netleşir."],
    aiInstruction: "Danışmanlık konusu, isim, telefon veya e-posta, tarih ve saati topla. Hukuki/finansal tavsiye verme.",
    unsupportedAdvice: "Hukuki veya finansal tavsiye veremem; yalnızca görüşme talebinizi oluşturabilirim.",
    publicDescription: "Konu özetinizi ve uygun zamanınızı paylaşın; ekip görüşme uygunluğunu teyit eder.",
    publicSubmitLabel: "Görüşme Talebi Gönder",
    quickShareLabel: "Paylaşılabilir görüşme linki"
  },
  SPA: {
    businessType: BusinessType.SPA,
    displayName: "Spa",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Spa Talebi",
    requestLabelPlural: "Spa Talepleri",
    primaryResourceLabel: "Terapist",
    primaryResourceLabelPlural: "Terapistler",
    customerLabel: "Danışan",
    customerLabelPlural: "Danışanlar",
    guestCountLabel: "Seans",
    capacityLabel: "Dolu Slot",
    channelRequestsLabel: "Kanal Spa Talepleri",
    serviceTypeLabel: "Hizmet",
    dashboardTitle: "Spa Operasyon Paneli",
    dashboardSubtitle: "Spa ve terapi randevularını terapist tercihiyle birlikte yönetin.",
    resourceBoardTitle: "Terapist Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "durationMinutes", "notes"],
    serviceTypes: ["Masaj", "Hamam", "Bakım", "Paket seans"],
    bookingRules: ["Randevu ekip onayıyla kesinleşir."],
    aiInstruction: "Spa hizmeti, isim, telefon, tarih ve saati topla; terapist tercihi varsa not et.",
    unsupportedAdvice: null,
    publicDescription: "Tercih ettiğiniz hizmeti ve zamanı iletin; ekip uygun terapist ile onaylasın.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki"
  },
  WELLNESS: {
    businessType: BusinessType.WELLNESS,
    displayName: "Wellness",
    reservationLabel: "Seans",
    reservationLabelPlural: "Seanslar",
    requestLabel: "Seans Talebi",
    requestLabelPlural: "Seans Talepleri",
    primaryResourceLabel: "Uzman",
    primaryResourceLabelPlural: "Uzmanlar",
    customerLabel: "Danışan",
    customerLabelPlural: "Danışanlar",
    guestCountLabel: "Seans",
    capacityLabel: "Dolu Slot",
    channelRequestsLabel: "Kanal Seans Talepleri",
    serviceTypeLabel: "Seans Türü",
    dashboardTitle: "Wellness Paneli",
    dashboardSubtitle: "Wellness seanslarını, uzman tercihlerini ve bekleyen talepleri yönetin.",
    resourceBoardTitle: "Uzman Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "notes"],
    serviceTypes: ["Nefes çalışması", "Meditasyon", "Masaj", "Rehberlik"],
    bookingRules: ["Seans uygunluğu ekip onayıyla netleşir."],
    aiInstruction: "Wellness seans türü, isim, telefon, tarih ve saati topla.",
    unsupportedAdvice: null,
    publicDescription: "Seans türünü ve uygun zamanını paylaş; ekip uygun uzmanla dönüş yapsın.",
    publicSubmitLabel: "Seans Talebi Gönder",
    quickShareLabel: "Paylaşılabilir seans linki"
  },
  OTHER: {
    businessType: BusinessType.OTHER,
    displayName: "Hizmet İşletmesi",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Talep",
    requestLabelPlural: "Talepler",
    primaryResourceLabel: "Kaynak",
    primaryResourceLabelPlural: "Kaynaklar",
    customerLabel: "Müşteri",
    customerLabelPlural: "Müşteriler",
    guestCountLabel: "Katılımcı",
    capacityLabel: "Kapasite",
    channelRequestsLabel: "Kanal Talepleri",
    serviceTypeLabel: "Hizmet Türü",
    dashboardTitle: "Operasyon Paneli",
    dashboardSubtitle: "Randevu ve talep akışını tek merkezden yönetin.",
    resourceBoardTitle: "Kaynak Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["notes"],
    serviceTypes: ["Özel hizmet", "Danışma", "Randevu"],
    bookingRules: ["Talep ekip onayından sonra kesinleşir."],
    aiInstruction: "Hizmet türü, isim, telefon, tarih ve saati topla.",
    unsupportedAdvice: null,
    publicDescription: "Hizmet türünüzü ve uygun zamanınızı paylaşın; ekip dönüş yaparak talebinizi teyit etsin.",
    publicSubmitLabel: "Talep Gönder",
    quickShareLabel: "Paylaşılabilir bağlantı"
  }
};

export function getIndustryConfig(businessType?: BusinessType | null): IndustryConfig {
  if (!businessType) {
    return industryConfigs.RESTAURANT;
  }

  return industryConfigs[businessType] ?? industryConfigs.OTHER;
}

export function getIndustryOptionLabel(value?: BusinessType | null) {
  return industryConfigsLabel(value ?? BusinessType.RESTAURANT);
}

export function getIndustryFieldLabel(field: IndustryFieldKey, config: IndustryConfig) {
  const map: Record<IndustryFieldKey, string> = {
    guestName: `${config.customerLabel} Adı`,
    guestPhone: "Telefon",
    customerEmail: "E-posta",
    requestedDate: config.businessType === BusinessType.HOTEL ? "Check-in Tarihi" : "Tarih",
    requestedTime: "Saat",
    endDate: config.businessType === BusinessType.HOTEL ? "Check-out Tarihi" : "Bitiş Tarihi",
    guestCount: config.guestCountLabel,
    serviceType: config.serviceTypeLabel,
    resourcePreference: `${config.primaryResourceLabel} Tercihi`,
    durationMinutes: "Süre",
    notes: "Notlar"
  };

  return map[field];
}

export function getIndustrySidebarLabels(businessType?: BusinessType | null) {
  const config = getIndustryConfig(businessType);

  return {
    dashboard: "Genel Bakış",
    reservations: config.reservationLabelPlural,
    tables: config.primaryResourceLabelPlural,
    customers: config.customerLabelPlural,
    integrations: "Kanallar",
    reports: "Raporlar",
    security: "Güvenlik",
    billing: "Faturalama",
    settings: "Ayarlar"
  };
}
