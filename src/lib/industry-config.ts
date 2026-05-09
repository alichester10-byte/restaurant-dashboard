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

export type IndustryMetricDefinition = {
  label: string;
  hint: string;
};

export type IndustryEmptyStates = {
  dashboardPrimary: { title: string; description: string; cta: string };
  resources: { title: string; description: string; cta: string };
  requests: { title: string; description: string; cta: string };
  customers: { title: string; description: string };
  reports: { title: string; description: string };
};

export type IndustryQuickAction = {
  label: string;
  hint: string;
};

export type IndustryConfig = {
  businessType: BusinessType;
  displayName: string;
  appNameLabel: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  primaryActionLabel: string;
  reservationLabel: string;
  reservationLabelPlural: string;
  requestLabel: string;
  requestLabelPlural: string;
  customerLabel: string;
  customerLabelPlural: string;
  primaryResourceLabel: string;
  primaryResourceLabelPlural: string;
  resourceLabel: string;
  resourceLabelPlural: string;
  serviceLabel: string;
  staffLabel: string;
  dateLabel: string;
  timeLabel: string;
  capacityLabel: string;
  guestCountLabel: string;
  notesLabel: string;
  channelRequestsLabel: string;
  serviceTypeLabel: string;
  resourceBoardTitle: string;
  requiredFields: IndustryFieldKey[];
  optionalFields: IndustryFieldKey[];
  metadataFields: string[];
  serviceExamples: string[];
  resourceExamples: string[];
  staffExamples: string[];
  dashboardMetrics: IndustryMetricDefinition[];
  reportMetrics: IndustryMetricDefinition[];
  quickActions: IndustryQuickAction[];
  emptyStates: IndustryEmptyStates;
  bookingRules: string[];
  aiInstruction: string;
  unsupportedAdvice: string | null;
  channelRequestCopy: string;
  bookingConfirmationCopy: string;
  publicFormIntro: string;
  publicDescription: string;
  publicSubmitLabel: string;
  quickShareLabel: string;
  settingsSections: string[];
};

type IndustryConfigMap = Record<BusinessType, IndustryConfig>;

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
      return "İşletme";
  }
}

export const industryOptions = Object.values(BusinessType).map((value) => ({
  value,
  label: industryConfigsLabel(value)
}));

type IndustrySeed = Omit<IndustryConfig, "businessType" | "displayName">;

function createIndustryConfig(businessType: BusinessType, seed: IndustrySeed): IndustryConfig {
  return {
    businessType,
    displayName: industryConfigsLabel(businessType),
    ...seed
  };
}

const restaurantLikeSeed: IndustrySeed = {
  appNameLabel: "Rezervasyon Platformu",
  dashboardTitle: "Operasyon Paneli",
  dashboardSubtitle: "Günlük talepleri, kaynak kullanımını ve kanal akışını tek görünümde yönetin.",
  primaryActionLabel: "Yeni Talep",
  reservationLabel: "Rezervasyon",
  reservationLabelPlural: "Rezervasyonlar",
  requestLabel: "Rezervasyon Talebi",
  requestLabelPlural: "Rezervasyon Talepleri",
  customerLabel: "Misafir",
  customerLabelPlural: "Misafirler",
  primaryResourceLabel: "Masa",
  primaryResourceLabelPlural: "Masalar",
  resourceLabel: "Kaynak",
  resourceLabelPlural: "Kaynaklar",
  serviceLabel: "Servis",
  staffLabel: "Ekip",
  dateLabel: "Tarih",
  timeLabel: "Saat",
  capacityLabel: "Doluluk",
  guestCountLabel: "Kişi Sayısı",
  notesLabel: "Notlar",
  channelRequestsLabel: "Kanal Rezervasyon Talepleri",
  serviceTypeLabel: "Servis Türü",
  resourceBoardTitle: "Kaynak Planı",
  requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "guestCount"],
  optionalFields: ["notes", "serviceType", "resourcePreference"],
  metadataFields: ["seatingPreference", "occasion"],
  serviceExamples: ["Akşam yemeği", "Kahvaltı", "Brunch"],
  resourceExamples: ["İç alan masa", "Teras masa", "Özel masa"],
  staffExamples: ["Karşılama ekibi", "Salon sorumlusu"],
  dashboardMetrics: [
    { label: "Bugünkü rezervasyonlar", hint: "Takvimdeki aktif rezervasyonlar" },
    { label: "Bekleyen talepler", hint: "Onay bekleyen kanal talepleri" },
    { label: "Misafir hacmi", hint: "Bugün beklenen toplam kişi" },
    { label: "Kaynak kullanımı", hint: "Masa ve alan doluluğu" }
  ],
  reportMetrics: [
    { label: "Rezervasyon hacmi", hint: "Günlük ve haftalık rezervasyon trendi" },
    { label: "Misafir sayısı", hint: "Toplam kişi ve yoğun saatler" },
    { label: "Kanal dönüşümü", hint: "Hangi kanal daha çok talep getiriyor" },
    { label: "Kaynak verimliliği", hint: "Masa ve alan kullanım oranı" }
  ],
  quickActions: [
    { label: "Yeni Talep", hint: "Manuel talep veya kayıt ekleyin" },
    { label: "Rezervasyonları Gör", hint: "Günlük akışı açın" },
    { label: "Kanalları Yönet", hint: "WhatsApp, web ve AI akışlarını izleyin" },
    { label: "AI Asistan", hint: "Gelen mesajları ön izleyin" }
  ],
  emptyStates: {
    dashboardPrimary: {
      title: "Henüz rezervasyon yok",
      description: "Kaynak ayarlarınızı ve kanal bağlantılarınızı tamamlayarak ilk rezervasyon akışını başlatın.",
      cta: "İlk talebi oluştur"
    },
    resources: {
      title: "Henüz masa veya kaynak eklenmedi",
      description: "İç alan, teras veya özel bölümler için kaynak kartlarınızı oluşturun.",
      cta: "Kaynak ekle"
    },
    requests: {
      title: "Henüz kanal talebi yok",
      description: "WhatsApp, Instagram, web ve AI talepleri geldikçe bu alan dolacak.",
      cta: "Paylaşım linkini aç"
    },
    customers: {
      title: "Henüz misafir kaydı oluşmadı",
      description: "Müşteriler, yeni talepler veya rezervasyonlar geldikçe burada görünür."
    },
    reports: {
      title: "Henüz rapor oluşturacak veri yok",
      description: "İlk rezervasyonlar ve talepler geldikçe performans raporları burada oluşacak."
    }
  },
  bookingRules: [
    "Talep işletme ekibi tarafından onaylanmadan rezervasyon kesinleşmez.",
    "Özel alan ve kutlama tercihleri not alanında belirtilebilir."
  ],
  aiInstruction: "İsim, telefon, tarih, saat ve kişi sayısını tamamla. Müsaitlik garantisi verme.",
  unsupportedAdvice: null,
  channelRequestCopy: "Dış kanallardan gelen rezervasyon talepleri burada toplanır. İnsan onayı olmadan rezervasyon kesinleşmez.",
  bookingConfirmationCopy: "Talebiniz alındı. İşletme ekibi uygunluğu kontrol edip size dönüş yapacak.",
  publicFormIntro: "Kısa bilgilerinizi paylaşın; ekip uygunluğu kontrol ederek sizinle iletişime geçsin.",
  publicDescription:
    "Formu doldurun; talebiniz ekip onayına düşsün. Uygunluk doğrulanmadan rezervasyon kesinleşmez.",
  publicSubmitLabel: "Rezervasyon Talebi Gönder",
  quickShareLabel: "Paylaşılabilir rezervasyon linki",
  settingsSections: ["İşletme Bilgileri", "Kaynaklar", "Kanal Kuralları", "AI Asistan"]
};

export const industryConfigs: IndustryConfigMap = {
  RESTAURANT: createIndustryConfig(BusinessType.RESTAURANT, restaurantLikeSeed),
  CAFE: createIndustryConfig(BusinessType.CAFE, {
    ...restaurantLikeSeed,
    dashboardSubtitle: "Rezervasyonları, masa akışını ve yoğun servis saatlerini tek panelde izleyin.",
    serviceExamples: ["Kahve buluşması", "Brunch", "Atıştırmalık"],
    resourceExamples: ["Salon masası", "Bahçe masası", "Bar oturma alanı"]
  }),
  BEAUTY_SALON: createIndustryConfig(BusinessType.BEAUTY_SALON, {
    appNameLabel: "Randevu Platformu",
    dashboardTitle: "Randevu Paneli",
    dashboardSubtitle: "Hizmetleri, uzmanları ve bekleyen randevu taleplerini tek akışta yönetin.",
    primaryActionLabel: "Yeni Randevu Talebi",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Randevu Talebi",
    requestLabelPlural: "Randevu Talepleri",
    customerLabel: "Danışan",
    customerLabelPlural: "Danışanlar",
    primaryResourceLabel: "Uzman",
    primaryResourceLabelPlural: "Uzmanlar",
    resourceLabel: "Kaynak",
    resourceLabelPlural: "Kaynaklar",
    serviceLabel: "Hizmet",
    staffLabel: "Personel",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Dolu Slot",
    guestCountLabel: "Seans",
    notesLabel: "İşlem Notu",
    channelRequestsLabel: "Kanal Randevu Talepleri",
    serviceTypeLabel: "Hizmet Türü",
    resourceBoardTitle: "Uzman ve Koltuk Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "durationMinutes", "notes"],
    metadataFields: ["staffPreference", "priceBand"],
    serviceExamples: ["Saç kesimi", "Boya", "Manikür", "Makyaj", "Cilt bakımı"],
    resourceExamples: ["İşlem koltuğu", "Bakım odası", "Makyaj alanı"],
    staffExamples: ["Kıdemli stilist", "Makyaj uzmanı", "Cilt bakım uzmanı"],
    dashboardMetrics: [
      { label: "Bugünkü randevular", hint: "Takvimde planlanan aktif randevular" },
      { label: "Bekleyen talepler", hint: "Onay bekleyen kanal ve form talepleri" },
      { label: "Uzman planı", hint: "Personel ve hizmet yoğunluğu" },
      { label: "Geri dönen danışanlar", hint: "Tekrar randevu oluşturan müşteriler" }
    ],
    reportMetrics: [
      { label: "Hizmet talebi", hint: "En çok talep alan hizmetler" },
      { label: "Uzman kullanımı", hint: "Personel doluluk görünümü" },
      { label: "Randevu dönüşümü", hint: "Talep -> onay oranı" },
      { label: "Danışan hareketi", hint: "Yeni ve tekrar gelen müşteri dengesi" }
    ],
    quickActions: [
      { label: "Yeni Randevu", hint: "Manuel randevu talebi oluşturun" },
      { label: "Randevuları Gör", hint: "Takvimi ve akışı açın" },
      { label: "Personeli Yönet", hint: "Uzman ve hizmet kartlarını güncelleyin" },
      { label: "AI Asistan", hint: "Müşteri mesajlarını ön izleyin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz randevu yok",
        description: "İlk hizmetinizi ve uzmanlarınızı ekleyerek randevu akışını başlatın.",
        cta: "İlk hizmeti ekle"
      },
      resources: {
        title: "Henüz kaynak oluşturulmadı",
        description: "Koltuklar, işlem odaları veya uzman bazlı kaynaklar eklenmedi.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz randevu talebi yok",
        description: "Web formu, DM ve AI asistan talepleri geldikçe burada görünür.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz danışan kaydı oluşmadı",
        description: "Danışanlar ilk randevu talebi veya onaylı randevuyla birlikte burada görünür."
      },
      reports: {
        title: "Henüz raporlayacak randevu verisi yok",
        description: "İlk randevular ve hizmet talepleri geldikçe performans raporları hazırlanır."
      }
    },
    bookingRules: ["Randevu ekip onayıyla kesinleşir.", "Uzman tercihi varsa not alanında belirtilebilir."],
    aiInstruction: "Hizmet, isim, telefon, tarih ve saati topla. Uygunluğu ekip onayına bırak.",
    unsupportedAdvice: null,
    channelRequestCopy: "Kanal randevu talepleri burada toplanır. Uygun uzman ve saat ekip onayıyla netleşir.",
    bookingConfirmationCopy: "Talebiniz alındı. Ekip uygun uzman ve saat için sizinle iletişime geçecek.",
    publicFormIntro: "Hizmeti, tercih ettiğiniz zamanı ve iletişim bilginizi bırakın.",
    publicDescription: "Hizmet ve saat tercihinizi paylaşın; ekip uygun uzmanı belirleyip talebinizi onaylasın.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki",
    settingsSections: ["İşletme Bilgileri", "Hizmetler", "Personel", "Kaynaklar", "AI Asistan"]
  }),
  BARBER: createIndustryConfig(BusinessType.BARBER, {
    appNameLabel: "Randevu Platformu",
    dashboardTitle: "Randevu Paneli",
    dashboardSubtitle: "Kesim, bakım ve sakal randevularını ekip akışıyla birlikte yönetin.",
    primaryActionLabel: "Yeni Randevu Talebi",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Randevu Talebi",
    requestLabelPlural: "Randevu Talepleri",
    customerLabel: "Müşteri",
    customerLabelPlural: "Müşteriler",
    primaryResourceLabel: "Berber",
    primaryResourceLabelPlural: "Berberler",
    resourceLabel: "Kaynak",
    resourceLabelPlural: "Kaynaklar",
    serviceLabel: "Hizmet",
    staffLabel: "Berber",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Dolu Slot",
    guestCountLabel: "Seans",
    notesLabel: "İşlem Notu",
    channelRequestsLabel: "Kanal Randevu Talepleri",
    serviceTypeLabel: "Hizmet Türü",
    resourceBoardTitle: "Berber Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "notes"],
    metadataFields: ["staffPreference"],
    serviceExamples: ["Saç kesimi", "Sakal tıraşı", "Bakım", "Çocuk kesimi"],
    resourceExamples: ["Kesim koltuğu", "Bakım alanı"],
    staffExamples: ["Usta berber", "Junior berber"],
    dashboardMetrics: [
      { label: "Bugünkü randevular", hint: "Takvimdeki aktif berber randevuları" },
      { label: "Bekleyen talepler", hint: "Onay bekleyen randevu istekleri" },
      { label: "Berber planı", hint: "Personel ve slot yoğunluğu" },
      { label: "Geri dönen müşteriler", hint: "Tekrar randevu oluşturanlar" }
    ],
    reportMetrics: [
      { label: "Hizmet talebi", hint: "En çok talep alan işlemler" },
      { label: "Berber kullanımı", hint: "Takvim ve kapasite yoğunluğu" },
      { label: "Randevu dönüşümü", hint: "Talep -> onay oranı" },
      { label: "Müşteri hareketi", hint: "Yeni ve tekrar gelen müşteri dengesi" }
    ],
    quickActions: [
      { label: "Yeni Randevu", hint: "Manuel randevu talebi oluşturun" },
      { label: "Randevuları Gör", hint: "Takvimi açın" },
      { label: "Berberleri Yönet", hint: "Kadroyu ve hizmetleri güncelleyin" },
      { label: "AI Asistan", hint: "Müşteri mesajlarını ön izleyin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz randevu yok",
        description: "İlk hizmetlerinizi ve berberlerinizi ekleyerek randevu akışını başlatın.",
        cta: "İlk hizmeti ekle"
      },
      resources: {
        title: "Henüz kaynak oluşturulmadı",
        description: "Koltuklar, bakım alanları ve berber kaynakları eklendiğinde plan görünümü açılır.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz randevu talebi yok",
        description: "Web formu, DM ve AI talepleri geldikçe burada görünür.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz müşteri kaydı oluşmadı",
        description: "Müşteriler ilk randevu talebi veya onaylı randevuyla birlikte burada görünür."
      },
      reports: {
        title: "Henüz raporlayacak randevu verisi yok",
        description: "İlk randevular ve hizmet talepleri geldikçe performans raporları hazırlanır."
      }
    },
    bookingRules: ["Randevu ekip onayıyla kesinleşir.", "Berber tercihi varsa not alanında belirtilebilir."],
    aiInstruction: "Hizmet, isim, telefon, tarih ve saati topla. Berber tercihi varsa not et.",
    unsupportedAdvice: null,
    channelRequestCopy: "Kanal randevu talepleri burada toplanır. Uygun berber ve saat ekip onayıyla netleşir.",
    bookingConfirmationCopy: "Talebiniz alındı. Ekip uygun berber ve saat için sizinle iletişime geçecek.",
    publicFormIntro: "Hizmeti, tercih ettiğiniz zamanı ve iletişim bilginizi bırakın.",
    publicDescription: "Hizmet ve saat tercihinizi paylaşın; ekip uygun berberi belirleyip talebinizi onaylasın.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki",
    settingsSections: ["İşletme Bilgileri", "Hizmetler", "Berberler", "Kaynaklar", "AI Asistan"]
  }),
  CLINIC: createIndustryConfig(BusinessType.CLINIC, {
    appNameLabel: "Randevu Platformu",
    dashboardTitle: "Hasta Randevu Paneli",
    dashboardSubtitle: "Randevu taleplerini, uzman yönlendirmelerini ve günlük akışı kontrollü şekilde yönetin.",
    primaryActionLabel: "Yeni Hasta Talebi",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Randevu Talebi",
    requestLabelPlural: "Randevu Talepleri",
    customerLabel: "Hasta",
    customerLabelPlural: "Hastalar",
    primaryResourceLabel: "Uzman",
    primaryResourceLabelPlural: "Uzmanlar",
    resourceLabel: "Oda / Kaynak",
    resourceLabelPlural: "Odalar / Kaynaklar",
    serviceLabel: "Bölüm",
    staffLabel: "Doktor / Uzman",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Günlük Doluluk",
    guestCountLabel: "Hasta",
    notesLabel: "Ziyaret Nedeni",
    channelRequestsLabel: "Kanal Randevu Talepleri",
    serviceTypeLabel: "Bölüm / Hizmet",
    resourceBoardTitle: "Doktor ve Oda Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "notes"],
    metadataFields: ["patientType", "doctorPreference", "visitReason"],
    serviceExamples: ["Genel muayene", "Kontrol", "Tetkik", "Danışma"],
    resourceExamples: ["Muayene odası", "Tedavi odası", "Danışma odası"],
    staffExamples: ["Uzman hekim", "Diyetisyen", "Psikolog"],
    dashboardMetrics: [
      { label: "Bugünkü randevular", hint: "Takvimde planlanan hasta randevuları" },
      { label: "Bekleyen hasta talepleri", hint: "Onay bekleyen randevu istekleri" },
      { label: "Uzman planı", hint: "Doktor ve oda kullanım akışı" },
      { label: "Yeni / tekrar gelen hastalar", hint: "Ziyaret tipi görünümü" }
    ],
    reportMetrics: [
      { label: "Randevu hacmi", hint: "Günlük randevu trafiği" },
      { label: "Bölüm talebi", hint: "Hangi hizmet alanı daha yoğun" },
      { label: "Hasta tipi", hint: "Yeni ve geri dönen hasta oranı" },
      { label: "Uzman kullanımı", hint: "Takvim ve oda yoğunluğu" }
    ],
    quickActions: [
      { label: "Yeni Randevu Talebi", hint: "Manuel hasta randevusu başlatın" },
      { label: "Randevuları Gör", hint: "Akış ve onay listesini açın" },
      { label: "Doktorları Yönet", hint: "Uzman ve bölüm yapısını güncelleyin" },
      { label: "AI Asistan", hint: "Randevu ön toplama akışını izleyin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz randevu talebi yok",
        description: "Doktorlarınızı ve randevu kurallarınızı ayarlayarak ilk hasta talebini toplamaya başlayın.",
        cta: "Randevu talebi oluştur"
      },
      resources: {
        title: "Henüz uzman veya oda eklenmedi",
        description: "Doktorlarınızı, muayene odalarını ve randevu kaynaklarınızı oluşturun.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz hasta talebi yok",
        description: "Web formu ve kanal randevuları geldikçe burada görünür.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz hasta kartı oluşmadı",
        description: "Hastalar ilk randevu veya talep oluştukça bu ekranda görünür."
      },
      reports: {
        title: "Henüz klinik raporu oluşmadı",
        description: "Randevular geldikçe bölüm ve uzman bazlı analizler burada hazırlanır."
      }
    },
    bookingRules: ["AI tıbbi tavsiye vermez.", "Randevu yalnız ekip onayı sonrası netleşir."],
    aiInstruction: "Bölüm veya ziyaret nedenini, isim, telefon, tarih ve saati topla. Tıbbi tavsiye verme.",
    unsupportedAdvice: "Tıbbi tavsiye veremem; yalnızca randevu bilgilerini toplayıp ekibe iletebilirim.",
    channelRequestCopy: "Hasta randevu talepleri burada toplanır. Uygunluk ve uzman ataması ekip tarafından onaylanır.",
    bookingConfirmationCopy: "Talebiniz alındı. Klinik ekibi uygunluğu teyit edip size dönüş yapacak.",
    publicFormIntro: "Bölüm tercihinizi ve iletişim bilgilerinizi paylaşın.",
    publicDescription: "Tarih, saat ve ziyaret nedeninizi iletin; ekip uygun uzmanı belirleyip randevuyu teyit etsin.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki",
    settingsSections: ["İşletme Bilgileri", "Bölümler", "Doktorlar", "Kaynaklar", "AI Güvenlik"]
  }),
  DENTIST: createIndustryConfig(BusinessType.DENTIST, {
    appNameLabel: "Randevu Platformu",
    dashboardTitle: "Diş Randevu Paneli",
    dashboardSubtitle: "Diş randevularını, doktor planını ve hasta taleplerini tek akışta yönetin.",
    primaryActionLabel: "Yeni Hasta Talebi",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Randevu Talebi",
    requestLabelPlural: "Randevu Talepleri",
    customerLabel: "Hasta",
    customerLabelPlural: "Hastalar",
    primaryResourceLabel: "Doktor",
    primaryResourceLabelPlural: "Doktorlar",
    resourceLabel: "Klinik Odası",
    resourceLabelPlural: "Klinik Odaları",
    serviceLabel: "İşlem",
    staffLabel: "Doktor",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Günlük Doluluk",
    guestCountLabel: "Hasta",
    notesLabel: "İşlem Notu",
    channelRequestsLabel: "Kanal Randevu Talepleri",
    serviceTypeLabel: "İşlem Türü",
    resourceBoardTitle: "Doktor Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "notes"],
    metadataFields: ["patientType", "visitReason"],
    serviceExamples: ["Kontrol", "Diş temizliği", "Dolgu", "Ortodonti"],
    resourceExamples: ["Muayene koltuğu", "Tedavi odası"],
    staffExamples: ["Diş hekimi", "Ortodontist", "Pedodontist"],
    dashboardMetrics: [
      { label: "Bugünkü randevular", hint: "Takvimdeki aktif diş randevuları" },
      { label: "Bekleyen hasta talepleri", hint: "Onay bekleyen başvurular" },
      { label: "Doktor planı", hint: "Hangi doktor ne kadar yoğun" },
      { label: "İşlem türleri", hint: "Hangi işlemler öne çıkıyor" }
    ],
    reportMetrics: [
      { label: "Randevu hacmi", hint: "Günlük ve haftalık işlem trafiği" },
      { label: "İşlem talebi", hint: "En çok talep alan işlem türleri" },
      { label: "Hasta tipi", hint: "Yeni ve geri dönen hasta dengesi" },
      { label: "Doktor yoğunluğu", hint: "Uzman bazlı kapasite kullanımı" }
    ],
    quickActions: [
      { label: "Yeni Randevu", hint: "Hızlı randevu talebi oluşturun" },
      { label: "Randevuları Gör", hint: "Onay akışını açın" },
      { label: "Doktorları Yönet", hint: "Takvim ve uzman kartlarını yönetin" },
      { label: "AI Asistan", hint: "İlk temas mesajlarını ön izleyin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz randevu talebi yok",
        description: "Doktorlarınızı ve işlem tiplerinizi ayarlayarak hasta taleplerini toplamaya başlayın.",
        cta: "İlk talebi oluştur"
      },
      resources: {
        title: "Henüz doktor veya kaynak oluşturulmadı",
        description: "Muayene koltukları ve doktor kartları hazır olduğunda plan görünümü açılır.",
        cta: "Doktor ekle"
      },
      requests: {
        title: "Henüz hasta talebi yok",
        description: "Yeni randevu talepleri web, mesajlaşma kanalları ve AI üzerinden geldikçe görünür.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz hasta profili oluşmadı",
        description: "Hasta kayıtları ilk randevu veya talep akışıyla birlikte oluşur."
      },
      reports: {
        title: "Henüz rapor oluşturacak veri yok",
        description: "İlk randevular geldikçe doktor ve işlem performansı raporlanır."
      }
    },
    bookingRules: ["AI tıbbi yorum yapmaz.", "Randevu yalnız klinik onayıyla netleşir."],
    aiInstruction: "İşlem türü, isim, telefon, tarih ve saati topla. Tıbbi tavsiye verme.",
    unsupportedAdvice: "Tıbbi tavsiye veremem; sadece randevu talebinizi oluşturup ekibe iletebilirim.",
    channelRequestCopy: "Diş randevu talepleri burada toplanır. Son uygunluk klinik ekibi tarafından onaylanır.",
    bookingConfirmationCopy: "Talebiniz alındı. Klinik ekibi uygunluğu kontrol edip size dönüş yapacak.",
    publicFormIntro: "İşlem türünü, tarih tercihinizi ve iletişim bilginizi bırakın.",
    publicDescription: "İşlem ve zaman tercihinizi paylaşın; ekip uygun doktor ve slotu teyit etsin.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki",
    settingsSections: ["İşletme Bilgileri", "İşlemler", "Doktorlar", "Odalar", "AI Güvenlik"]
  }),
  FITNESS: createIndustryConfig(BusinessType.FITNESS, {
    appNameLabel: "Seans Platformu",
    dashboardTitle: "Seans Paneli",
    dashboardSubtitle: "Dersleri, seans taleplerini ve eğitmen kullanımını tek panelden yönetin.",
    primaryActionLabel: "Yeni Seans Talebi",
    reservationLabel: "Seans",
    reservationLabelPlural: "Seanslar",
    requestLabel: "Seans Talebi",
    requestLabelPlural: "Seans Talepleri",
    customerLabel: "Üye",
    customerLabelPlural: "Üyeler",
    primaryResourceLabel: "Eğitmen",
    primaryResourceLabelPlural: "Eğitmenler",
    resourceLabel: "Stüdyo Kaynağı",
    resourceLabelPlural: "Stüdyo Kaynakları",
    serviceLabel: "Ders Türü",
    staffLabel: "Eğitmen",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Kapasite Kullanımı",
    guestCountLabel: "Katılımcı",
    notesLabel: "Seans Notu",
    channelRequestsLabel: "Kanal Seans Talepleri",
    serviceTypeLabel: "Seans Türü",
    resourceBoardTitle: "Eğitmen ve Stüdyo Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "guestCount", "notes"],
    metadataFields: ["sessionMode", "trainerPreference"],
    serviceExamples: ["Özel ders", "Grup dersi", "Yoga", "Pilates", "Fonksiyonel antrenman"],
    resourceExamples: ["Stüdyo salonu", "Pilates reformer alanı", "Açık alan"],
    staffExamples: ["PT eğitmeni", "Grup ders koçu", "Yoga eğitmeni"],
    dashboardMetrics: [
      { label: "Bugünkü seanslar", hint: "Takvimde yer alan aktif dersler" },
      { label: "Yaklaşan sınıflar", hint: "Gün içindeki grup seansları" },
      { label: "Aktif üyeler", hint: "Katılım veya talep bırakan üyeler" },
      { label: "Eğitmen kullanımı", hint: "Hangi eğitmen ne kadar yoğun" }
    ],
    reportMetrics: [
      { label: "Seans talebi", hint: "Hangi ders türü daha yoğun" },
      { label: "Eğitmen verimliliği", hint: "Takvim ve kapasite kullanımı" },
      { label: "Katılım hacmi", hint: "Üye sayısı ve sınıf yoğunluğu" },
      { label: "Talep dönüşümü", hint: "İlk talep -> onay oranı" }
    ],
    quickActions: [
      { label: "Yeni Seans", hint: "Seans veya sınıf talebi oluşturun" },
      { label: "Seansları Gör", hint: "Günlük akışı açın" },
      { label: "Eğitmenleri Yönet", hint: "Kadroyu ve kapasiteyi ayarlayın" },
      { label: "AI Asistan", hint: "Yeni üye taleplerini ön izleyin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz seans veya ders oluşturulmadı",
        description: "İlk hizmetinizi ekleyerek ve eğitmenleri tanımlayarak başlayın.",
        cta: "İlk hizmeti ekle"
      },
      resources: {
        title: "Henüz stüdyo kaynağı yok",
        description: "Salonlar, reformer alanları veya özel ders kaynakları eklenmedi.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz seans talebi yok",
        description: "Yeni üyeler ders veya seans talebi bıraktıkça bu ekran dolacak.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz üye kartı oluşmadı",
        description: "Üyeler ve katılımcılar, ilk talepler geldikçe burada görünür."
      },
      reports: {
        title: "Henüz seans raporu yok",
        description: "İlk seanslar ve sınıf talepleri geldikçe kullanım trendleri oluşur."
      }
    },
    bookingRules: ["Seans uygunluğu ekip onayıyla belirlenir.", "AI son kapasite kararını vermez."],
    aiInstruction: "Seans türü, eğitmen tercihi varsa, isim, telefon, tarih ve saati topla. Uygunluğu garanti etme.",
    unsupportedAdvice: null,
    channelRequestCopy: "Seans ve ders talepleri burada toplanır. Son onay ekip ve kapasite kontrolü sonrası verilir.",
    bookingConfirmationCopy: "Talebiniz alındı. Ekip uygun eğitmen ve saat için sizinle iletişime geçecek.",
    publicFormIntro: "Seans türünü, tercih ettiğiniz saati ve iletişim bilginizi iletin.",
    publicDescription: "Seans türünü ve zaman tercihinizi paylaşın; ekip kapasite ve eğitmen uygunluğunu teyit etsin.",
    publicSubmitLabel: "Seans Talebi Gönder",
    quickShareLabel: "Paylaşılabilir seans linki",
    settingsSections: ["İşletme Bilgileri", "Hizmetler", "Eğitmenler", "Stüdyo Kaynakları", "AI Asistan"]
  }),
  HOTEL: createIndustryConfig(BusinessType.HOTEL, {
    appNameLabel: "Konaklama Platformu",
    dashboardTitle: "Konaklama Paneli",
    dashboardSubtitle: "Check-in, check-out ve oda taleplerini tek akışta yönetin.",
    primaryActionLabel: "Yeni Konaklama Talebi",
    reservationLabel: "Rezervasyon",
    reservationLabelPlural: "Rezervasyonlar",
    requestLabel: "Konaklama Talebi",
    requestLabelPlural: "Konaklama Talepleri",
    customerLabel: "Misafir",
    customerLabelPlural: "Misafirler",
    primaryResourceLabel: "Oda",
    primaryResourceLabelPlural: "Odalar",
    resourceLabel: "Oda",
    resourceLabelPlural: "Odalar",
    serviceLabel: "Oda Tipi",
    staffLabel: "Ekip",
    dateLabel: "Check-in",
    timeLabel: "Varış Saati",
    capacityLabel: "Oda Doluluğu",
    guestCountLabel: "Konuk Sayısı",
    notesLabel: "Konaklama Notu",
    channelRequestsLabel: "Kanal Konaklama Talepleri",
    serviceTypeLabel: "Oda Tipi",
    resourceBoardTitle: "Oda Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "endDate", "guestCount"],
    optionalFields: ["serviceType", "notes"],
    metadataFields: ["roomType", "specialRequests"],
    serviceExamples: ["Standart", "Deluxe", "Aile Odası", "Suit"],
    resourceExamples: ["Bahçe manzaralı oda", "Suit oda", "Bağlantılı oda"],
    staffExamples: ["Resepsiyon", "Misafir ilişkileri"],
    dashboardMetrics: [
      { label: "Yaklaşan konaklamalar", hint: "Check-in bekleyen kayıtlar" },
      { label: "Bugünkü check-in", hint: "Giriş günü olan konaklamalar" },
      { label: "Bugünkü check-out", hint: "Çıkış günü olan kayıtlar" },
      { label: "Oda talepleri", hint: "Onay bekleyen konaklama istekleri" }
    ],
    reportMetrics: [
      { label: "Rezervasyon talepleri", hint: "Konaklama hacmi ve dönemsel talep" },
      { label: "Oda tipi talebi", hint: "En çok talep alan konaklama tipi" },
      { label: "Doluluk trendi", hint: "Check-in / check-out yoğunluğu" },
      { label: "Kanal dönüşümü", hint: "Hangi kanal daha çok konaklama getiriyor" }
    ],
    quickActions: [
      { label: "Yeni Konaklama", hint: "Talep veya rezervasyon oluşturun" },
      { label: "Rezervasyonları Gör", hint: "Check-in akışını açın" },
      { label: "Odaları Yönet", hint: "Oda tipleri ve kaynakları güncelleyin" },
      { label: "AI Asistan", hint: "Misafir taleplerini ön toplayın" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz konaklama talebi yok",
        description: "Oda tiplerinizi ve konaklama kurallarınızı ekleyin.",
        cta: "Oda tiplerini düzenle"
      },
      resources: {
        title: "Henüz oda tanımı yapılmadı",
        description: "Oda kartları ve konaklama kaynakları eklendiğinde plan görünümü açılır.",
        cta: "Oda ekle"
      },
      requests: {
        title: "Henüz rezervasyon talebi yok",
        description: "Yeni misafir talepleri geldikçe check-in / check-out akışı burada görünür.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz misafir kaydı oluşmadı",
        description: "Misafirler ilk talep veya konaklama ile birlikte görünür."
      },
      reports: {
        title: "Henüz konaklama raporu yok",
        description: "İlk rezervasyonlar geldikçe doluluk ve oda tipi eğilimleri oluşur."
      }
    },
    bookingRules: ["AI oda uygunluğunu garanti etmez.", "Konaklama talebi ekip onayıyla kesinleşir."],
    aiInstruction: "Check-in, check-out, kişi sayısı, isim ve telefonu topla. Oda uygunluğunu garanti etme.",
    unsupportedAdvice: "Oda uygunluğunu garanti edemem; talebinizi ekibe iletip son onayı almalarını sağlarım.",
    channelRequestCopy: "Konaklama talepleri burada toplanır. Oda uygunluğu ve fiyatlandırma son olarak ekip tarafından teyit edilir.",
    bookingConfirmationCopy: "Talebiniz alındı. İşletme ekibi oda uygunluğunu kontrol edip size dönüş yapacak.",
    publicFormIntro: "Check-in, check-out ve misafir sayınızı paylaşın.",
    publicDescription: "Konaklama tarihlerinizi ve oda tercihinizi bırakın; ekip uygunluğu teyit ederek size dönüş yapsın.",
    publicSubmitLabel: "Konaklama Talebi Gönder",
    quickShareLabel: "Paylaşılabilir rezervasyon linki",
    settingsSections: ["İşletme Bilgileri", "Odalar", "Oda Tipleri", "Konaklama Kuralları", "AI Asistan"]
  }),
  CAR_SERVICE: createIndustryConfig(BusinessType.CAR_SERVICE, {
    appNameLabel: "Servis Platformu",
    dashboardTitle: "Servis Operasyon Paneli",
    dashboardSubtitle: "Araç servis taleplerini, kaynak kullanımını ve günlük iş akışını yönetin.",
    primaryActionLabel: "Yeni Servis Talebi",
    reservationLabel: "Servis Randevusu",
    reservationLabelPlural: "Servis Randevuları",
    requestLabel: "Servis Talebi",
    requestLabelPlural: "Servis Talepleri",
    customerLabel: "Araç Sahibi",
    customerLabelPlural: "Araç Sahipleri",
    primaryResourceLabel: "Servis Hattı",
    primaryResourceLabelPlural: "Servis Hatları",
    resourceLabel: "Servis Alanı",
    resourceLabelPlural: "Servis Alanları",
    serviceLabel: "Servis Türü",
    staffLabel: "Usta / Danışman",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Hat Kullanımı",
    guestCountLabel: "Araç",
    notesLabel: "Araç / Servis Notu",
    channelRequestsLabel: "Kanal Servis Talepleri",
    serviceTypeLabel: "Servis Türü",
    resourceBoardTitle: "Servis Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["notes"],
    metadataFields: ["vehicleModel", "plate"],
    serviceExamples: ["Periyodik bakım", "Yağ değişimi", "Arıza kontrolü", "Lastik"],
    resourceExamples: ["Servis hattı 1", "Hızlı bakım alanı", "Detaylı kontrol hattı"],
    staffExamples: ["Servis danışmanı", "Usta", "Teknisyen"],
    dashboardMetrics: [
      { label: "Bugünkü servis randevuları", hint: "Planlanan araç girişleri" },
      { label: "Bekleyen servis talepleri", hint: "Onay bekleyen araç talepleri" },
      { label: "Araç yoğunluğu", hint: "Servis hatlarının doluluğu" },
      { label: "Servis türleri", hint: "En çok talep alan işlemler" }
    ],
    reportMetrics: [
      { label: "Servis hacmi", hint: "Günlük ve haftalık araç akışı" },
      { label: "Hat kullanımı", hint: "Kaynak doluluk ve darboğazlar" },
      { label: "Servis türü talebi", hint: "Hangi işlem daha çok isteniyor" },
      { label: "Talep dönüşümü", hint: "İlk talep -> servis onayı oranı" }
    ],
    quickActions: [
      { label: "Yeni Servis Talebi", hint: "Araç kabul akışını başlatın" },
      { label: "Randevuları Gör", hint: "Günlük servis planını açın" },
      { label: "Kaynakları Yönet", hint: "Servis hatlarını güncelleyin" },
      { label: "AI Asistan", hint: "Araç mesajlarını ön izleyin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz servis talebi yok",
        description: "Servis türlerinizi ve çalışma hatlarınızı ekleyerek başlayın.",
        cta: "Servis türü ekle"
      },
      resources: {
        title: "Henüz servis alanı tanımlanmadı",
        description: "Hatlar ve servis alanları eklendiğinde kapasite görünümü aktif olur.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz araç talebi yok",
        description: "Yeni servis talepleri geldikçe burada görünür.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz araç sahibi kaydı yok",
        description: "Araç sahipleri ilk servis talebiyle birlikte burada görünür."
      },
      reports: {
        title: "Henüz servis raporu yok",
        description: "İlk araç randevuları geldikçe hat ve servis türü analitiği oluşur."
      }
    },
    bookingRules: ["Servis saati ekip onayıyla netleşir.", "AI araç kabulü kesinleştirmez."],
    aiInstruction: "Servis türü, araç modeli/plakası, isim, telefon, tarih ve saati topla.",
    unsupportedAdvice: null,
    channelRequestCopy: "Araç servis talepleri burada toplanır. Son uygunluk ve saat planlaması ekip tarafından teyit edilir.",
    bookingConfirmationCopy: "Talebiniz alındı. İşletme ekibi uygun servis zamanı için sizinle iletişime geçecek.",
    publicFormIntro: "Araç bilgilerinizi ve servis ihtiyacınızı paylaşın.",
    publicDescription: "Servis türünü, araç detayını ve uygun zamanınızı bırakın; ekip teyit ederek size dönüş yapsın.",
    publicSubmitLabel: "Servis Talebi Gönder",
    quickShareLabel: "Paylaşılabilir servis linki",
    settingsSections: ["İşletme Bilgileri", "Servis Türleri", "Ekip", "Servis Hatları", "AI Asistan"]
  }),
  CAR_WASH: createIndustryConfig(BusinessType.CAR_WASH, {
    appNameLabel: "Servis Platformu",
    dashboardTitle: "Yıkama Operasyon Paneli",
    dashboardSubtitle: "Yıkama taleplerini, hat kullanımını ve günlük yoğunluğu tek panelde yönetin.",
    primaryActionLabel: "Yeni Yıkama Talebi",
    reservationLabel: "Yıkama Randevusu",
    reservationLabelPlural: "Yıkama Randevuları",
    requestLabel: "Yıkama Talebi",
    requestLabelPlural: "Yıkama Talepleri",
    customerLabel: "Araç Sahibi",
    customerLabelPlural: "Araç Sahipleri",
    primaryResourceLabel: "Yıkama Hattı",
    primaryResourceLabelPlural: "Yıkama Hatları",
    resourceLabel: "Yıkama Alanı",
    resourceLabelPlural: "Yıkama Alanları",
    serviceLabel: "Paket",
    staffLabel: "Ekip",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Hat Kullanımı",
    guestCountLabel: "Araç",
    notesLabel: "Araç Notu",
    channelRequestsLabel: "Kanal Yıkama Talepleri",
    serviceTypeLabel: "Paket Türü",
    resourceBoardTitle: "Hat Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["notes"],
    metadataFields: ["vehicleModel", "plate"],
    serviceExamples: ["İç dış yıkama", "Hızlı yıkama", "Detaylı temizlik"],
    resourceExamples: ["Hızlı hat", "Detaylı bakım alanı"],
    staffExamples: ["Vardiya ekibi", "Detaylı bakım personeli"],
    dashboardMetrics: [
      { label: "Bugünkü yıkama randevuları", hint: "Takvimde planlanan araç girişleri" },
      { label: "Bekleyen talepler", hint: "Onay bekleyen araç talepleri" },
      { label: "Hat kullanımı", hint: "Kaynak yoğunluğu" },
      { label: "Paket talepleri", hint: "Hangi paketler öne çıkıyor" }
    ],
    reportMetrics: [
      { label: "Yıkama hacmi", hint: "Günlük araç akışı" },
      { label: "Hat verimliliği", hint: "Kaynak bazlı doluluk" },
      { label: "Paket dağılımı", hint: "Talep edilen paket türleri" },
      { label: "Talep dönüşümü", hint: "İlk talep -> onay oranı" }
    ],
    quickActions: [
      { label: "Yeni Talep", hint: "Yıkama talebi oluşturun" },
      { label: "Randevuları Gör", hint: "Günlük planı açın" },
      { label: "Hatları Yönet", hint: "Yıkama kaynaklarını güncelleyin" },
      { label: "AI Asistan", hint: "Araç mesajlarını ön toplayın" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz yıkama talebi yok",
        description: "Paketlerinizi ve yıkama hatlarınızı ekleyin.",
        cta: "Paket ekle"
      },
      resources: {
        title: "Henüz yıkama hattı yok",
        description: "Hatlar tanımlandığında yoğunluk görünümü burada aktif olur.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz araç talebi yok",
        description: "Yeni yıkama talepleri geldikçe burada görünür.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz araç sahibi kaydı oluşmadı",
        description: "Talep ve randevu akışıyla birlikte müşteri kartları görünür."
      },
      reports: {
        title: "Henüz rapor oluşturacak veri yok",
        description: "İlk yıkama talepleri geldikçe hat ve paket trendleri oluşur."
      }
    },
    bookingRules: ["Kesin saat ekip onayıyla netleşir."],
    aiInstruction: "Paket türü, araç modeli/plakası, isim, telefon, tarih ve saati topla.",
    unsupportedAdvice: null,
    channelRequestCopy: "Yıkama talepleri burada toplanır. Kapasite kontrolü sonrası ekip onayı verilir.",
    bookingConfirmationCopy: "Talebiniz alındı. Ekip uygun saat için sizinle iletişime geçecek.",
    publicFormIntro: "Araç ve paket bilgilerinizi bırakın.",
    publicDescription: "Yıkama paketinizi ve uygun saatinizi iletin; ekip teyit ederek dönüş yapsın.",
    publicSubmitLabel: "Yıkama Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki",
    settingsSections: ["İşletme Bilgileri", "Paketler", "Ekip", "Yıkama Hatları", "AI Asistan"]
  }),
  EVENT_VENUE: createIndustryConfig(BusinessType.EVENT_VENUE, {
    appNameLabel: "Etkinlik Platformu",
    dashboardTitle: "Etkinlik Paneli",
    dashboardSubtitle: "Organizasyon taleplerini, salonları ve paket beklentilerini tek panelde yönetin.",
    primaryActionLabel: "Yeni Etkinlik Talebi",
    reservationLabel: "Etkinlik Rezervasyonu",
    reservationLabelPlural: "Etkinlik Rezervasyonları",
    requestLabel: "Etkinlik Talebi",
    requestLabelPlural: "Etkinlik Talepleri",
    customerLabel: "Organizatör",
    customerLabelPlural: "Organizatörler",
    primaryResourceLabel: "Salon",
    primaryResourceLabelPlural: "Salonlar",
    resourceLabel: "Mekan",
    resourceLabelPlural: "Mekanlar",
    serviceLabel: "Paket",
    staffLabel: "Etkinlik Ekibi",
    dateLabel: "Etkinlik Tarihi",
    timeLabel: "Etkinlik Saati",
    capacityLabel: "Salon Kullanımı",
    guestCountLabel: "Katılımcı Sayısı",
    notesLabel: "Etkinlik Notu",
    channelRequestsLabel: "Kanal Etkinlik Talepleri",
    serviceTypeLabel: "Etkinlik Türü",
    resourceBoardTitle: "Salon Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "guestCount", "serviceType"],
    optionalFields: ["notes"],
    metadataFields: ["packagePreference"],
    serviceExamples: ["Düğün", "Nişan", "Kurumsal etkinlik", "Doğum günü"],
    resourceExamples: ["Ana salon", "Bahçe alanı", "Toplantı salonu"],
    staffExamples: ["Etkinlik sorumlusu", "Satış danışmanı"],
    dashboardMetrics: [
      { label: "Yaklaşan etkinlikler", hint: "Onaylanan rezervasyonlar" },
      { label: "Etkinlik talepleri", hint: "Onay bekleyen yeni istekler" },
      { label: "Salon kullanımı", hint: "Mekan ve tarih yoğunluğu" },
      { label: "Paket talepleri", hint: "Hangi paketler öne çıkıyor" }
    ],
    reportMetrics: [
      { label: "Etkinlik hacmi", hint: "Dönemsel etkinlik talebi" },
      { label: "Mekan kullanımı", hint: "Salon bazlı rezervasyon yoğunluğu" },
      { label: "Katılımcı hacmi", hint: "Toplam davetli potansiyeli" },
      { label: "Talep dönüşümü", hint: "İlk temas -> onay oranı" }
    ],
    quickActions: [
      { label: "Yeni Etkinlik", hint: "Talep veya ön rezervasyon oluşturun" },
      { label: "Etkinlikleri Gör", hint: "Akış ve tarihler görünümünü açın" },
      { label: "Salonları Yönet", hint: "Mekan ve paket yapısını düzenleyin" },
      { label: "AI Asistan", hint: "Etkinlik sorularını ön toplayın" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz etkinlik talebi yok",
        description: "Salonlarınızı ve paketlerinizi tanımlayarak talepleri toplamaya başlayın.",
        cta: "Paket ekle"
      },
      resources: {
        title: "Henüz mekan tanımı yapılmadı",
        description: "Salonlar ve alanlar eklendiğinde kapasite görünümü burada oluşur.",
        cta: "Mekan ekle"
      },
      requests: {
        title: "Henüz etkinlik talebi yok",
        description: "Web formu ve kanal talepleri geldikçe bu alan dolacak.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz organizatör kaydı yok",
        description: "Müşteri kartları ilk etkinlik talepleriyle birlikte oluşur."
      },
      reports: {
        title: "Henüz etkinlik raporu oluşmadı",
        description: "Etkinlik ve salon trafiği başladığında analitikler burada görünür."
      }
    },
    bookingRules: ["Salon uygunluğu ekip onayıyla kesinleşir.", "AI müsaitlik garantisi vermez."],
    aiInstruction: "Etkinlik türü, tarih, saat, katılımcı sayısı, isim ve telefonu topla.",
    unsupportedAdvice: null,
    channelRequestCopy: "Etkinlik talepleri burada toplanır. Son uygunluk ve paket doğrulaması ekip tarafından yapılır.",
    bookingConfirmationCopy: "Talebiniz alındı. Etkinlik ekibi uygunluk ve paket detaylarıyla size dönüş yapacak.",
    publicFormIntro: "Etkinlik türünüzü ve tarih tercihinizi paylaşın.",
    publicDescription: "Etkinlik türünü, davetli sayısını ve tarih tercihlerinizi bırakın; ekip uygun paketi onaylasın.",
    publicSubmitLabel: "Etkinlik Talebi Gönder",
    quickShareLabel: "Paylaşılabilir etkinlik linki",
    settingsSections: ["İşletme Bilgileri", "Paketler", "Mekanlar", "Kapasite Kuralları", "AI Asistan"]
  }),
  EDUCATION: createIndustryConfig(BusinessType.EDUCATION, {
    appNameLabel: "Ders Platformu",
    dashboardTitle: "Ders Paneli",
    dashboardSubtitle: "Ders taleplerini, öğretmen planını ve kurs akışını tek panelde yönetin.",
    primaryActionLabel: "Yeni Ders Talebi",
    reservationLabel: "Ders",
    reservationLabelPlural: "Dersler",
    requestLabel: "Ders Talebi",
    requestLabelPlural: "Ders Talepleri",
    customerLabel: "Öğrenci",
    customerLabelPlural: "Öğrenciler",
    primaryResourceLabel: "Öğretmen",
    primaryResourceLabelPlural: "Öğretmenler",
    resourceLabel: "Ders Kaynağı",
    resourceLabelPlural: "Ders Kaynakları",
    serviceLabel: "Kurs / Ders Türü",
    staffLabel: "Öğretmen",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Sınıf Kullanımı",
    guestCountLabel: "Katılımcı",
    notesLabel: "Ders Notu",
    channelRequestsLabel: "Kanal Ders Talepleri",
    serviceTypeLabel: "Ders / Kurs Türü",
    resourceBoardTitle: "Öğretmen Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "guestCount", "notes"],
    metadataFields: ["privateOrGroup", "parentContact"],
    serviceExamples: ["Özel ders", "Grup dersi", "Kurs", "Atölye"],
    resourceExamples: ["Sınıf", "Online oda", "Stüdyo"],
    staffExamples: ["Matematik öğretmeni", "Müzik eğitmeni", "Dil koçu"],
    dashboardMetrics: [
      { label: "Bugünkü dersler", hint: "Planlanan ders ve seanslar" },
      { label: "Ders talepleri", hint: "Onay bekleyen öğrenci başvuruları" },
      { label: "Öğretmen planı", hint: "Kadronun zaman kullanımı" },
      { label: "Kurs talebi", hint: "Hangi ders türleri öne çıkıyor" }
    ],
    reportMetrics: [
      { label: "Ders hacmi", hint: "Günlük ve haftalık ders akışı" },
      { label: "Öğretmen kullanımı", hint: "Öğretmen takvim yoğunluğu" },
      { label: "Kurs talebi", hint: "Hangi ders türü daha çok isteniyor" },
      { label: "Talep dönüşümü", hint: "İlk başvuru -> onay oranı" }
    ],
    quickActions: [
      { label: "Yeni Ders Talebi", hint: "Öğrenci başvurusu oluşturun" },
      { label: "Dersleri Gör", hint: "Ders akışını açın" },
      { label: "Öğretmenleri Yönet", hint: "Kadroyu ve kaynakları düzenleyin" },
      { label: "AI Asistan", hint: "Ön bilgi toplamayı yönetin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz ders talebi yok",
        description: "Kurslarınızı ve öğretmenlerinizi ekleyerek talepleri toplamaya başlayın.",
        cta: "Kurs ekle"
      },
      resources: {
        title: "Henüz ders kaynağı yok",
        description: "Sınıflar, online odalar veya özel ders kaynakları eklendiğinde plan görünümü açılır.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz öğrenci talebi yok",
        description: "Ders ve kurs talepleri geldikçe bu ekranda görünür.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz öğrenci profili oluşmadı",
        description: "Öğrenci kayıtları ilk talep veya ders onayıyla birlikte burada görünür."
      },
      reports: {
        title: "Henüz ders raporu yok",
        description: "İlk ders talepleri geldikçe kurs ve öğretmen analitiği oluşur."
      }
    },
    bookingRules: ["Ders uygunluğu kurum tarafından teyit edilir."],
    aiInstruction: "Ders türü, isim, telefon, tarih ve saati topla. Grup/özel bilgisi varsa not et.",
    unsupportedAdvice: null,
    channelRequestCopy: "Ders talepleri burada toplanır. Uygun öğretmen ve saat ekip tarafından onaylanır.",
    bookingConfirmationCopy: "Talebiniz alındı. Ekip uygun öğretmen ve zaman için sizinle iletişime geçecek.",
    publicFormIntro: "Ders türünü ve tercih ettiğiniz zamanı paylaşın.",
    publicDescription: "Kurs veya ders türünüzü ve zaman tercihinizi iletin; ekip uygun öğretmeni teyit ederek dönüş yapsın.",
    publicSubmitLabel: "Ders Talebi Gönder",
    quickShareLabel: "Paylaşılabilir ders linki",
    settingsSections: ["İşletme Bilgileri", "Kurslar", "Öğretmenler", "Kaynaklar", "AI Asistan"]
  }),
  CONSULTING: createIndustryConfig(BusinessType.CONSULTING, {
    appNameLabel: "Görüşme Platformu",
    dashboardTitle: "Görüşme Paneli",
    dashboardSubtitle: "Danışmanlık taleplerini, uzman takvimini ve görüşme akışını güvenli şekilde yönetin.",
    primaryActionLabel: "Yeni Görüşme Talebi",
    reservationLabel: "Görüşme",
    reservationLabelPlural: "Görüşmeler",
    requestLabel: "Görüşme Talebi",
    requestLabelPlural: "Görüşme Talepleri",
    customerLabel: "Danışan",
    customerLabelPlural: "Danışanlar",
    primaryResourceLabel: "Danışman",
    primaryResourceLabelPlural: "Danışmanlar",
    resourceLabel: "Görüşme Kaynağı",
    resourceLabelPlural: "Görüşme Kaynakları",
    serviceLabel: "Hizmet Konusu",
    staffLabel: "Danışman",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Takvim Doluluğu",
    guestCountLabel: "Görüşme",
    notesLabel: "Konu Özeti",
    channelRequestsLabel: "Kanal Görüşme Talepleri",
    serviceTypeLabel: "Hizmet Türü",
    resourceBoardTitle: "Danışman Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["customerEmail", "notes"],
    metadataFields: ["topicSummary", "consultantPreference"],
    serviceExamples: ["İlk görüşme", "Strateji toplantısı", "Takip görüşmesi"],
    resourceExamples: ["Toplantı odası", "Online görüşme alanı"],
    staffExamples: ["Kıdemli danışman", "Müşteri yöneticisi"],
    dashboardMetrics: [
      { label: "Görüşme talepleri", hint: "Yeni danışan başvuruları" },
      { label: "Yaklaşan görüşmeler", hint: "Takvimdeki onaylı kayıtlar" },
      { label: "Danışman takvimi", hint: "Uzman yoğunluğu" },
      { label: "Konu başlıkları", hint: "Hangi hizmetler daha çok talep ediliyor" }
    ],
    reportMetrics: [
      { label: "Görüşme hacmi", hint: "Günlük ve haftalık akış" },
      { label: "Danışman kullanımı", hint: "Takvim ve kapasite yoğunluğu" },
      { label: "Konu dağılımı", hint: "En çok talep alan hizmet alanları" },
      { label: "Talep dönüşümü", hint: "İlk görüşme -> onay oranı" }
    ],
    quickActions: [
      { label: "Yeni Görüşme", hint: "Manuel görüşme talebi oluşturun" },
      { label: "Görüşmeleri Gör", hint: "Takvimi açın" },
      { label: "Danışmanları Yönet", hint: "Kadroyu ve toplantı tiplerini düzenleyin" },
      { label: "AI Asistan", hint: "Gelen ön talepleri yönetin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz görüşme talebi yok",
        description: "Hizmet başlıklarınızı ve danışman kadronuzu ekleyerek başlayın.",
        cta: "Hizmet ekle"
      },
      resources: {
        title: "Henüz görüşme kaynağı yok",
        description: "Toplantı odaları veya online kaynaklar eklendiğinde plan görünümü çalışır.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz danışan talebi yok",
        description: "Yeni görüşme talepleri geldikçe burada toplanır.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz danışan profili oluşmadı",
        description: "Danışanlar ilk görüşme talebiyle birlikte burada görünür."
      },
      reports: {
        title: "Henüz görüşme raporu yok",
        description: "İlk görüşmeler geldikçe konu ve danışman performansı oluşur."
      }
    },
    bookingRules: ["AI hukuki veya finansal tavsiye vermez.", "Görüşme ekip onayıyla netleşir."],
    aiInstruction: "Konu özeti, isim, telefon veya e-posta, tarih ve saati topla. Hukuki/finansal tavsiye verme.",
    unsupportedAdvice: "Hukuki veya finansal tavsiye veremem; yalnızca görüşme talebinizi oluşturabilirim.",
    channelRequestCopy: "Görüşme talepleri burada toplanır. Son uygunluk danışman takvimi üzerinden teyit edilir.",
    bookingConfirmationCopy: "Talebiniz alındı. Ekip uygun danışman ve saat için size dönüş yapacak.",
    publicFormIntro: "Görüşme konunuzu ve iletişim bilginizi paylaşın.",
    publicDescription: "Konu özetinizi ve uygun zamanınızı iletin; ekip uygun danışmanı teyit ederek size dönüş yapsın.",
    publicSubmitLabel: "Görüşme Talebi Gönder",
    quickShareLabel: "Paylaşılabilir görüşme linki",
    settingsSections: ["İşletme Bilgileri", "Hizmetler", "Danışmanlar", "Görüşme Tipleri", "AI Güvenlik"]
  }),
  SPA: createIndustryConfig(BusinessType.SPA, {
    appNameLabel: "Randevu Platformu",
    dashboardTitle: "Spa Operasyon Paneli",
    dashboardSubtitle: "Spa ve terapi randevularını terapist tercihleriyle birlikte yönetin.",
    primaryActionLabel: "Yeni Spa Talebi",
    reservationLabel: "Randevu",
    reservationLabelPlural: "Randevular",
    requestLabel: "Spa Talebi",
    requestLabelPlural: "Spa Talepleri",
    customerLabel: "Danışan",
    customerLabelPlural: "Danışanlar",
    primaryResourceLabel: "Terapist",
    primaryResourceLabelPlural: "Terapistler",
    resourceLabel: "Spa Kaynağı",
    resourceLabelPlural: "Spa Kaynakları",
    serviceLabel: "Hizmet",
    staffLabel: "Terapist",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Dolu Slot",
    guestCountLabel: "Seans",
    notesLabel: "Seans Notu",
    channelRequestsLabel: "Kanal Spa Talepleri",
    serviceTypeLabel: "Hizmet",
    resourceBoardTitle: "Terapist Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "durationMinutes", "notes"],
    metadataFields: ["packagePreference"],
    serviceExamples: ["Masaj", "Hamam", "Bakım", "Paket seans"],
    resourceExamples: ["Masaj odası", "Hamam alanı", "Çift seans alanı"],
    staffExamples: ["Masaj terapisti", "Bakım uzmanı"],
    dashboardMetrics: [
      { label: "Bugünkü randevular", hint: "Takvimdeki spa seansları" },
      { label: "Bekleyen spa talepleri", hint: "Onay bekleyen yeni başvurular" },
      { label: "Terapist planı", hint: "Personel ve oda kullanımı" },
      { label: "Popüler hizmetler", hint: "En çok talep alan paketler" }
    ],
    reportMetrics: [
      { label: "Hizmet hacmi", hint: "Günlük spa talep akışı" },
      { label: "Terapist kullanımı", hint: "Takvim yoğunluğu" },
      { label: "Paket talebi", hint: "Hangi hizmetler öne çıkıyor" },
      { label: "Talep dönüşümü", hint: "Başvuru -> onay oranı" }
    ],
    quickActions: [
      { label: "Yeni Talep", hint: "Randevu talebi oluşturun" },
      { label: "Randevuları Gör", hint: "Takvimi açın" },
      { label: "Terapistleri Yönet", hint: "Kadroyu güncelleyin" },
      { label: "AI Asistan", hint: "İlk temas sorularını yönetin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz randevu yok",
        description: "İlk hizmetlerinizi ve terapistlerinizi ekleyerek başlayın.",
        cta: "Hizmet ekle"
      },
      resources: {
        title: "Henüz spa kaynağı yok",
        description: "Odalar ve terapist kaynakları eklendiğinde kapasite görünümü aktif olur.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz spa talebi yok",
        description: "Yeni başvurular web, DM veya AI üzerinden geldikçe burada görünür.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz danışan kartı oluşmadı",
        description: "Danışanlar ilk randevu talebiyle birlikte görünür."
      },
      reports: {
        title: "Henüz rapor oluşmadı",
        description: "İlk spa talepleri geldikçe hizmet ve terapist performansı oluşur."
      }
    },
    bookingRules: ["Randevu ekip onayıyla kesinleşir."],
    aiInstruction: "Hizmet, isim, telefon, tarih ve saati topla; terapist tercihi varsa not et.",
    unsupportedAdvice: null,
    channelRequestCopy: "Spa talepleri burada toplanır. Son saat ve terapist onayı ekip tarafından yapılır.",
    bookingConfirmationCopy: "Talebiniz alındı. Ekip uygun terapist ve saat için sizinle iletişime geçecek.",
    publicFormIntro: "Tercih ettiğiniz hizmeti ve zamanı paylaşın.",
    publicDescription: "Hizmeti ve saat tercihinizi iletin; ekip uygun terapist ile dönüş yapsın.",
    publicSubmitLabel: "Randevu Talebi Gönder",
    quickShareLabel: "Paylaşılabilir randevu linki",
    settingsSections: ["İşletme Bilgileri", "Hizmetler", "Terapistler", "Odalar", "AI Asistan"]
  }),
  WELLNESS: createIndustryConfig(BusinessType.WELLNESS, {
    appNameLabel: "Seans Platformu",
    dashboardTitle: "Wellness Paneli",
    dashboardSubtitle: "Wellness seanslarını, uzman tercihlerini ve bekleyen talepleri yönetin.",
    primaryActionLabel: "Yeni Seans Talebi",
    reservationLabel: "Seans",
    reservationLabelPlural: "Seanslar",
    requestLabel: "Seans Talebi",
    requestLabelPlural: "Seans Talepleri",
    customerLabel: "Danışan",
    customerLabelPlural: "Danışanlar",
    primaryResourceLabel: "Uzman",
    primaryResourceLabelPlural: "Uzmanlar",
    resourceLabel: "Wellness Kaynağı",
    resourceLabelPlural: "Wellness Kaynakları",
    serviceLabel: "Seans Türü",
    staffLabel: "Uzman",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Dolu Slot",
    guestCountLabel: "Seans",
    notesLabel: "Seans Notu",
    channelRequestsLabel: "Kanal Seans Talepleri",
    serviceTypeLabel: "Seans Türü",
    resourceBoardTitle: "Uzman Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["resourcePreference", "notes"],
    metadataFields: ["sessionGoal"],
    serviceExamples: ["Meditasyon", "Nefes çalışması", "Wellness koçluğu", "Rehberli seans"],
    resourceExamples: ["Sessiz oda", "Grup alanı", "Online görüşme odası"],
    staffExamples: ["Wellness koçu", "Meditasyon eğitmeni"],
    dashboardMetrics: [
      { label: "Bugünkü seanslar", hint: "Takvimde yer alan wellness seansları" },
      { label: "Bekleyen seans talepleri", hint: "Onay bekleyen başvurular" },
      { label: "Uzman planı", hint: "Uzman ve oda kullanımı" },
      { label: "Seans talebi", hint: "Hangi seans türleri öne çıkıyor" }
    ],
    reportMetrics: [
      { label: "Seans hacmi", hint: "Günlük talep trafiği" },
      { label: "Uzman kullanımı", hint: "Takvim yoğunluğu" },
      { label: "Seans türü dağılımı", hint: "Öne çıkan wellness alanları" },
      { label: "Talep dönüşümü", hint: "Başvuru -> onay oranı" }
    ],
    quickActions: [
      { label: "Yeni Seans", hint: "Yeni seans talebi oluşturun" },
      { label: "Seansları Gör", hint: "Takvimi açın" },
      { label: "Uzmanları Yönet", hint: "Kadroyu düzenleyin" },
      { label: "AI Asistan", hint: "Ön toplama akışını yönetin" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz seans talebi yok",
        description: "İlk seans türlerinizi ve uzmanlarınızı ekleyerek başlayın.",
        cta: "Seans türü ekle"
      },
      resources: {
        title: "Henüz kaynak oluşturulmadı",
        description: "Wellness odaları ve uzman kaynakları eklendiğinde plan görünümü aktif olur.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz seans talebi yok",
        description: "Yeni talepler geldikçe bu alan güncellenecek.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz danışan kaydı yok",
        description: "Danışan kartları ilk seans talepleri geldikçe görünür."
      },
      reports: {
        title: "Henüz rapor oluşturacak veri yok",
        description: "İlk seanslar geldikçe kullanım ve talep eğilimleri burada oluşur."
      }
    },
    bookingRules: ["Seans uygunluğu ekip onayıyla netleşir."],
    aiInstruction: "Seans türü, isim, telefon, tarih ve saati topla.",
    unsupportedAdvice: null,
    channelRequestCopy: "Wellness seans talepleri burada toplanır. Son uygunluk ekip onayına bağlıdır.",
    bookingConfirmationCopy: "Talebiniz alındı. Ekip uygun uzman ve zaman için size dönüş yapacak.",
    publicFormIntro: "Seans türünüzü ve uygun zamanınızı paylaşın.",
    publicDescription: "Wellness seans türünü ve zaman tercihinizi iletin; ekip uygun uzmanla dönüş yapsın.",
    publicSubmitLabel: "Seans Talebi Gönder",
    quickShareLabel: "Paylaşılabilir seans linki",
    settingsSections: ["İşletme Bilgileri", "Seans Türleri", "Uzmanlar", "Kaynaklar", "AI Asistan"]
  }),
  OTHER: createIndustryConfig(BusinessType.OTHER, {
    appNameLabel: "Rezervasyon Platformu",
    dashboardTitle: "Operasyon Paneli",
    dashboardSubtitle: "Talepleri, kaynakları ve günlük iş akışını tek merkezden yönetin.",
    primaryActionLabel: "Yeni Talep",
    reservationLabel: "Kayıt",
    reservationLabelPlural: "Kayıtlar",
    requestLabel: "Talep",
    requestLabelPlural: "Talepler",
    customerLabel: "Müşteri",
    customerLabelPlural: "Müşteriler",
    primaryResourceLabel: "Kaynak",
    primaryResourceLabelPlural: "Kaynaklar",
    resourceLabel: "Kaynak",
    resourceLabelPlural: "Kaynaklar",
    serviceLabel: "Hizmet",
    staffLabel: "Ekip",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    capacityLabel: "Kapasite",
    guestCountLabel: "Katılımcı",
    notesLabel: "Notlar",
    channelRequestsLabel: "Kanal Talepleri",
    serviceTypeLabel: "Hizmet Türü",
    resourceBoardTitle: "Kaynak Planı",
    requiredFields: ["guestName", "guestPhone", "requestedDate", "requestedTime", "serviceType"],
    optionalFields: ["notes"],
    metadataFields: ["customDetails"],
    serviceExamples: ["Özel hizmet", "Danışma", "Randevu"],
    resourceExamples: ["Kaynak 1", "Toplantı odası", "Hizmet alanı"],
    staffExamples: ["Sorumlu", "Uzman", "Koordinatör"],
    dashboardMetrics: [
      { label: "Bugünkü kayıtlar", hint: "Günlük operasyon akışı" },
      { label: "Bekleyen talepler", hint: "Onay bekleyen yeni başvurular" },
      { label: "Aktif müşteriler", hint: "Son dönemde işlem yapan müşteriler" },
      { label: "Kaynak kullanımı", hint: "Kaynak yoğunluğu" }
    ],
    reportMetrics: [
      { label: "Talep hacmi", hint: "Dönemsel talep trafiği" },
      { label: "Kaynak kullanımı", hint: "Kaynakların doluluk görünümü" },
      { label: "Müşteri hareketi", hint: "Yeni ve tekrar gelen müşteriler" },
      { label: "Dönüşüm", hint: "Talep -> onay oranı" }
    ],
    quickActions: [
      { label: "Yeni Talep", hint: "Talep veya kayıt oluşturun" },
      { label: "Kayıtları Gör", hint: "Akışı açın" },
      { label: "Kaynakları Yönet", hint: "Kaynak yapısını düzenleyin" },
      { label: "AI Asistan", hint: "Mesaj ön izleme akışını açın" }
    ],
    emptyStates: {
      dashboardPrimary: {
        title: "Henüz kayıt veya talep yok",
        description: "İşletme kurallarınızı ve hizmetlerinizi ayarlayarak ilk akışı başlatın.",
        cta: "İlk talebi oluştur"
      },
      resources: {
        title: "Henüz kaynak oluşturulmadı",
        description: "Kaynaklar eklendiğinde kapasite ve plan görünümü aktif olur.",
        cta: "Kaynak ekle"
      },
      requests: {
        title: "Henüz talep yok",
        description: "Web, mesajlaşma ve AI kaynaklı talepler geldikçe burada toplanır.",
        cta: "Paylaşım linkini aç"
      },
      customers: {
        title: "Henüz müşteri kaydı oluşmadı",
        description: "Müşteriler yeni talepler geldikçe burada görünür."
      },
      reports: {
        title: "Henüz rapor verisi yok",
        description: "İlk talepler geldikçe analitikler oluşur."
      }
    },
    bookingRules: ["Talep ekip onayından sonra kesinleşir."],
    aiInstruction: "Hizmet türü, isim, telefon, tarih ve saati topla. Son onayı işletmeye bırak.",
    unsupportedAdvice: null,
    channelRequestCopy: "Tüm kanal talepleri burada toplanır. Son uygunluk ekip tarafından onaylanır.",
    bookingConfirmationCopy: "Talebiniz alındı. İşletme ekibi uygunluğu kontrol edip size dönüş yapacak.",
    publicFormIntro: "İhtiyacınızı ve uygun zamanınızı paylaşın.",
    publicDescription: "Hizmet türünüzü ve zaman tercihinizi bırakın; ekip talebinizi inceleyip dönüş yapsın.",
    publicSubmitLabel: "Talep Gönder",
    quickShareLabel: "Paylaşılabilir bağlantı",
    settingsSections: ["İşletme Bilgileri", "Hizmetler", "Ekip", "Kaynaklar", "AI Asistan"]
  })
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
    requestedDate: config.dateLabel,
    requestedTime: config.timeLabel,
    endDate: config.businessType === BusinessType.HOTEL ? "Check-out" : "Bitiş Tarihi",
    guestCount: config.guestCountLabel,
    serviceType: config.serviceTypeLabel,
    resourcePreference: `${config.primaryResourceLabel} Tercihi`,
    durationMinutes: "Süre",
    notes: config.notesLabel
  };

  return map[field];
}

export function getIndustrySidebarLabels(businessType?: BusinessType | null) {
  const config = getIndustryConfig(businessType);

  return {
    dashboard: "Genel Bakış",
    reservations: config.reservationLabelPlural,
    tables: config.resourceLabelPlural,
    customers: config.customerLabelPlural,
    integrations: "Kanallar",
    reports: "Raporlar",
    security: "Güvenlik",
    billing: "Faturalama",
    settings: "Ayarlar"
  };
}
