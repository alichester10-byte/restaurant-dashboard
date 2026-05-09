import type { Metadata } from "next";

export type PublicLanguage = "tr" | "en";

type SearchParamsValue = string | string[] | undefined;

function normalizeLang(value: SearchParamsValue): PublicLanguage {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "en" ? "en" : "tr";
}

export function getPublicLanguage(searchParams?: Record<string, SearchParamsValue>): PublicLanguage {
  return normalizeLang(searchParams?.lang);
}

export function buildPublicHref(path: string, lang: PublicLanguage) {
  if (lang === "tr") {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=en`;
}

type PublicDictionary = {
  nav: {
    login: string;
    register: string;
    dashboard: string;
    channels: string;
    about: string;
    privacy: string;
    terms: string;
  };
  footer: {
    blurb: string;
    marker: string;
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
    cards: Array<{ title: string; body: string }>;
    stats: Array<{ title: string; value: string; body: string }>;
    howTitle: string;
    howHeadline: string;
    howBody: string;
    steps: string[];
    trust: Array<{ title: string; body: string }>;
  };
  about: {
    title: string;
    headline: string;
    intro: string;
    principles: string[];
    sections: Array<{ title: string; body: string }>;
    primary: string;
    secondary: string;
  };
  privacy: {
    title: string;
    headline: string;
    intro: string;
    sections: Array<{ title: string; body: string }>;
  };
  terms: {
    title: string;
    headline: string;
    items: string[];
  };
};

export const publicCopy: Record<PublicLanguage, PublicDictionary> = {
  tr: {
    nav: {
      login: "Giriş Yap",
      register: "Ücretsiz Başla",
      dashboard: "Panele Git",
      channels: "Kanalları Gör",
      about: "Hakkında",
      privacy: "Gizlilik Politikası",
      terms: "Kullanım Şartları"
    },
    footer: {
      blurb:
        "Limon Masa, küçük ve orta ölçekli hizmet işletmeleri için geliştirilen yapay zeka destekli rezervasyon ve randevu yönetim platformudur. WhatsApp ve Instagram entegrasyonları desteklenen senaryolarda ve Meta onayı sonrasında kullanılabilir.",
      marker: "Limon Masa vMetaReview"
    },
    home: {
      eyebrow: "Limon Masa",
      title: "Rezervasyon, randevu ve talep yönetimini tek merkezden yönetin.",
      description:
        "WhatsApp, Instagram, web formları ve AI asistanından gelen talepleri tek panelde toplayın, ekibinizle kolayca yönetin. Son onay işletme ekibinde kalır.",
      primary: "Ücretsiz Başla",
      secondary: "Demo Paneli Gör",
      cards: [
        {
          title: "Çok kanallı talep yönetimi",
          body: "WhatsApp, Instagram, web ve telefon akışlarını tek operasyon alanında toplayın. Talep kaybolmadan ekibinize yönlensin."
        },
        {
          title: "AI destekli rezervasyon asistanı",
          body: "AI asistanı müşteri mesajlarını çözümler, eksik alanları tespit eder ve ekibin değerlendireceği net talepler oluşturur."
        },
        {
          title: "Hizmet, personel ve kaynak yönetimi",
          body: "Hizmet kataloğu, ekip üyeleri ve kaynakları aynı panelden yönetin. Farklı sektörlerde aynı altyapıyla ilerleyin."
        },
        {
          title: "Planlara göre ölçeklenebilir kullanım",
          body: "İşletmeniz büyüdükçe AI, kanal entegrasyonları ve ekip kullanım limitleriyle birlikte daha gelişmiş operasyon akışlarına geçin."
        }
      ],
      stats: [
        {
          title: "Kanallar",
          value: "5+",
          body: "Web, widget, AI, WhatsApp, Instagram ve manuel akışlar."
        },
        {
          title: "Operasyon modeli",
          value: "Onay kontrollü",
          body: "Talep önce ekibe düşer, uygunluk kontrolü sonrasında kayıt kesinleşir."
        },
        {
          title: "Dikeyler",
          value: "Çok sektörlü",
          body: "Restoran, salon, klinik, otel ve hizmet işletmeleri için uyarlanabilir booking yapısı."
        },
        {
          title: "Ölçek",
          value: "Plan bazlı",
          body: "Kullanım limitleri, AI özellikleri ve kanal erişimi planınıza göre açılır."
        }
      ],
      howTitle: "Nasıl çalışır",
      howHeadline: "Talep alımından onaylı kayda uzanan sade operasyon akışı",
      howBody:
        "Limon Masa, farklı kanallardan gelen talebi toplar, gerekli bilgileri çıkarır ve ekip onayını merkeze alan düzenli bir iş akışı sunar.",
      steps: [
        "Müşteri mesaj veya form üzerinden talep gönderir.",
        "Sistem tarih, saat, kişi sayısı ve notları düzenler.",
        "Talep bekleyen istek olarak ekibin önüne gelir.",
        "İşletme ekibi talebi onaylar, düzenler veya reddeder."
      ],
      trust: [
        {
          title: "İşletmeler için",
          body: "Rezervasyon, randevu, müşteri geçmişi ve kanal yönetimini tek yerde toplamak isteyen işletme ekipleri için tasarlandı."
        },
        {
          title: "Veri gizliliği",
          body: "İşletme verileri ayrı tutulur, erişim yetkili kullanıcılarla sınırlandırılır ve güvenlik amaçlı kayıtlar tutulabilir."
        },
        {
          title: "İnsan onayı",
          body: "Yapay zeka yalnızca talebi çözümlemeye yardımcı olur; onay, düzenleme ve son karar işletme tarafında kalır."
        },
        {
          title: "Meta uyumlu anlatım",
          body: "WhatsApp ve Instagram talepleri, desteklenen durumlarda ve Meta onayı sonrasında bekleyen istek akışına dahil edilebilir."
        }
      ]
    },
    about: {
      title: "Limon Masa Hakkında",
      headline: "Çok kanallı rezervasyon ve randevu talebini sadeleştiren operasyon platformu",
      intro:
        "Limon Masa, işletmelerin farklı kanallardan gelen rezervasyon ve randevu taleplerini tek merkezde yönetmesine yardımcı olur. Amaç, tam otomasyona zorlamak değil; ekibe daha hızlı ve daha kontrollü karar verebileceği bir akış sunmaktır.",
      principles: [
        "Limon Masa; WhatsApp, Instagram, web formları ve AI destekli talep akışlarından gelen rezervasyonları tek panelde toplar.",
        "Müşteri mesajları doğrudan onaylı rezervasyona dönüşmez; önce onay bekleyen talep olarak oluşturulur.",
        "İşletme ekibi her talebi manuel olarak onaylar, düzenler veya reddeder.",
        "Platform özellikle küçük ve orta ölçekli hizmet işletmelerinin operasyon gerçeklerine göre tasarlanmıştır."
      ],
      sections: [
        {
          title: "Nasıl çalışır",
          body: "Gelen müşteri mesajları toplanır, tarih-saat-kişi sayısı gibi bilgiler çıkarılır ve ekip için onay bekleyen rezervasyon taleplerine dönüştürülür."
        },
        {
          title: "İşletmeler için",
          body: "Rezervasyon veya randevu operasyonunu düzenli hale getirmek isteyen, ancak müşteri ilişkisini ve son kararı ekip içinde tutmak isteyen işletmeler için geliştirildi."
        },
        {
          title: "Veri gizliliği",
          body: "Her işletmenin verisi ayrı tutulur. Erişim yetkili kullanıcılarla sınırlıdır ve güvenlik/günlük kayıtları işletme hesabını korumaya yardımcı olur."
        },
        {
          title: "İnsan onayı",
          body: "Limon Masa, kaydı işletme adına otomatik olarak kesinleştirmez. Son onay her zaman işletme ekibindedir."
        }
      ],
      primary: "Ücretsiz Başla",
      secondary: "Ana Sayfaya Dön"
    },
    privacy: {
      title: "Gizlilik Politikası",
      headline: "Veri işleme ve gizlilik yaklaşımımız",
      intro:
        "Limon Masa, işletmelerin rezervasyon ve randevu iletişimini yönetmesine yardımcı olurken verileri ayrı tutmak ve erişimi yetkili kullanıcılarla sınırlamak için tasarlanmıştır.",
      sections: [
        {
          title: "İşletme verisi izolasyonu",
          body: "Her işletme hesabı kendi verisiyle çalışır. Destek veya güvenlik gerekmediği sürece işletme dışı erişim açılmaz."
        },
        {
          title: "Rezervasyon talepleri",
          body: "Desteklenen kanallardan gelen mesajlar onay bekleyen taleplere dönüştürülebilir. İşletme onayı olmadan kesin kayıt oluşmaz."
        },
        {
          title: "Ödeme ve faturalama",
          body: "Ödeme işlemleri desteklenen ödeme sağlayıcıları üzerinden yürütülür. Ham ödeme bilgileri müşteri arayüzünde gösterilmez."
        },
        {
          title: "Güvenlik uygulamaları",
          body: "Şifreler güvenli şekilde saklanır, oturum kontrolleri uygulanır ve güvenlikle ilgili olaylar gerektiğinde kayıt altına alınabilir."
        }
      ]
    },
    terms: {
      title: "Kullanım Şartları",
      headline: "Limon Masa kullanım çerçevesi",
      items: [
        "Limon Masa, rezervasyon, randevu ve booking operasyonları ile ekip içi iş akışları için tasarlanmıştır.",
        "Platform üzerinden oluşturulan veya incelenen kayıtların son onayı, zamanlaması ve hizmet kararı işletmenin sorumluluğundadır.",
        "WhatsApp ve Instagram gibi kanal entegrasyonları, desteklenen durumlarda ve Meta onayı sonrasında kullanılabilir.",
        "AI destekli çözümleme, ekiplerin müşteri talebini daha hızlı anlamasına yardımcı olur; ancak önemli detaylar onaydan önce doğrulanmalıdır.",
        "Platform; entegrasyonlar, ödeme akışları ve operasyon özellikleri geliştikçe güncellenebilir."
      ]
    }
  },
  en: {
    nav: {
      login: "Login",
      register: "Start Free",
      dashboard: "Open Dashboard",
      channels: "View Channels",
      about: "About",
      privacy: "Privacy Policy",
      terms: "Terms of Service"
    },
    footer: {
      blurb:
        "Limon Masa is an AI-powered booking and appointment operations platform for small and medium service businesses. WhatsApp and Instagram integrations are available where supported and after Meta approval.",
      marker: "Limon Masa vMetaReview"
    },
    home: {
      eyebrow: "Limon Masa",
      title: "Manage bookings, appointments, and inbound requests from one place.",
      description:
        "Collect inbound demand from WhatsApp, Instagram, website forms, and AI assistant flows in one workspace. Final approval stays with your team.",
      primary: "Start Free",
      secondary: "View Demo",
      cards: [
        {
          title: "Multi-channel request management",
          body: "Bring website, WhatsApp, Instagram, and manual demand into one calm operational workspace."
        },
        {
          title: "AI booking assistant",
          body: "AI helps collect missing details, summarize intent, and prepare pending requests for team review."
        },
        {
          title: "Services, staff, and resources",
          body: "Manage what you offer, who delivers it, and which resources are bookable in the same system."
        },
        {
          title: "Scales with your plan",
          body: "Unlock higher usage, AI features, and channel integrations as the business grows."
        }
      ],
      stats: [
        {
          title: "Channels",
          value: "4+",
          body: "Website, WhatsApp, Instagram, and AI-assisted request intake."
        },
        {
          title: "Approval flow",
          value: "Human-first",
          body: "Requests stay pending until the business team confirms them."
        },
        {
          title: "Built for",
          value: "Businesses",
          body: "Created for small and medium service businesses that need clear operations without heavy software."
        },
        {
          title: "Trust",
          value: "Controlled rollout",
          body: "Channel support expands where integrations are approved and available."
        }
      ],
      howTitle: "How it works",
      howHeadline: "From customer message to approved reservation",
      howBody:
        "Limon Masa helps businesses review demand from different channels without handing final control to automation.",
      steps: [
        "A customer sends a message or reservation request.",
        "Limon Masa extracts date, time, guest count, and notes.",
        "The request stays pending for business review.",
        "The business team approves the booking manually."
      ],
      trust: [
        {
          title: "For businesses",
          body: "Built for businesses that want booking flow, customer history, and channel management in one place."
        },
        {
          title: "Data privacy",
          body: "Business data is stored separately, access is limited to authorized users, and security events can be logged when needed."
        },
        {
          title: "Human approval",
          body: "AI helps with extraction and triage, but the business remains in charge of confirmation, edits, and customer decisions."
        },
        {
          title: "Meta review friendly",
          body: "WhatsApp and Instagram request flows are offered where supported and after Meta approval."
        }
      ]
    },
    about: {
      title: "About Limon Masa",
      headline: "A calmer way to manage multi-channel reservation demand",
      intro:
        "Limon Masa helps businesses manage booking and appointment requests from multiple channels in one place. The platform is designed to support faster decisions without forcing teams into fully automated approval.",
      principles: [
        "Limon Masa brings reservation requests from WhatsApp, Instagram, website forms, and AI-assisted request flows into one workspace.",
        "Customer messages can be converted into pending reservation requests instead of confirmed bookings.",
        "Business teams manually approve, edit, or reject requests.",
        "The platform is designed for small and medium service businesses."
      ],
      sections: [
        {
          title: "How it works",
          body: "Incoming customer messages are collected, analyzed, and organized into pending requests for business review."
        },
        {
          title: "For businesses",
          body: "Designed for businesses that want one control center for bookings without losing the human judgment of the operations team."
        },
        {
          title: "Data privacy",
          body: "Each business workspace is separated, access stays limited to authorized users, and activity can be logged for support and security."
        },
        {
          title: "Human approval",
          body: "Limon Masa does not automatically finalize bookings on behalf of the business. Final approval stays with the team."
        }
      ],
      primary: "Start with Limon Masa",
      secondary: "Back to Homepage"
    },
    privacy: {
      title: "Privacy Policy",
      headline: "Privacy and data handling",
      intro:
        "Limon Masa is designed to help businesses manage booking communication while keeping business data separated and access limited to authorized users.",
      sections: [
        {
          title: "Business data isolation",
          body: "Each business workspace operates with its own records. External access is limited unless support or security review is required."
        },
        {
          title: "Reservation request handling",
          body: "Messages from supported channels may be converted into pending booking requests. Businesses approve these requests before they become confirmed records."
        },
        {
          title: "Payments and billing",
          body: "Payment handling is provided through supported payment partners. Raw payment credentials are not exposed in the customer interface."
        },
        {
          title: "Security practices",
          body: "Passwords are stored securely, session controls are applied, and security-related events may be logged to protect accounts."
        }
      ]
    },
    terms: {
      title: "Terms of Service",
      headline: "Using Limon Masa responsibly",
      items: [
        "Limon Masa is intended for booking, appointment, and internal team workflows.",
        "Businesses remain responsible for the final approval, timing, and service delivery of records created or reviewed through the platform.",
        "Channel integrations such as WhatsApp and Instagram are available where supported and after Meta approval.",
        "AI-assisted extraction is designed to help teams review customer intent, but businesses should validate important details before confirming a booking.",
        "The service may evolve over time as integrations, payment support, and operational tooling expand."
      ]
    }
  }
};

export function getPublicCopy(language: PublicLanguage) {
  return publicCopy[language];
}

export function getPublicMetadataBase(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        "tr-TR": path,
        "en-US": buildPublicHref(path, "en")
      }
    }
  };
}
