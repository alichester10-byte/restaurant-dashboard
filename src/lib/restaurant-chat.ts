import "server-only";

import { AuditCategory, BusinessType, ChatMessageRole, ChatSessionStatus, ReservationRequestStatus, ReservationSource } from "@prisma/client";
import { extractReservationRequest } from "@/lib/ai-reservation";
import { safeCreateAuditLog } from "@/lib/audit";
import { getIndustryConfig, getIndustryFieldLabel, type IndustryFieldKey } from "@/lib/industry-config";
import { enforcePlanUsageLimit } from "@/lib/plan-config";
import { prisma } from "@/lib/prisma";

type RestaurantContext = {
  businessId: string;
  businessType: BusinessType;
  restaurantName: string;
  address: string | null;
  phone: string | null;
  openingHoursText: string;
  menuUrl: string | null;
  policyText: string;
  maxPartySize: number;
  assistantEnabled: boolean;
  autoCreateReservationRequests: boolean;
  welcomeMessage: string;
  tone: "friendly" | "professional";
  requiredFields: IndustryFieldKey[];
  serviceTypes: string[];
  staffOptions: string[];
  resourceOptions: string[];
  unsupportedAdvice: string | null;
  requestLabel: string;
  primaryResourceLabel: string;
  serviceTypeLabel: string;
};

type ChatSessionWithMessages = Awaited<ReturnType<typeof loadOrCreateChatSession>>;

type AssistantTurnResult = {
  sessionId: string;
  reply: string;
  requestCreated: boolean;
  reservationRequestId?: string;
  confidenceScore?: number | null;
  missingFields: string[];
};

function formatOpeningHoursText(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Çalışma saatleri için lütfen talebinizi iletin; ekip kısa sürede dönüş yapacaktır.";
  }

  const labels: Record<string, string> = {
    monday: "Pazartesi",
    tuesday: "Salı",
    wednesday: "Çarşamba",
    thursday: "Perşembe",
    friday: "Cuma",
    saturday: "Cumartesi",
    sunday: "Pazar"
  };

  const rows = Object.entries(input as Record<string, unknown>)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => `${labels[key] ?? key}: ${String(value).trim()}`);

  return rows.length > 0 ? rows.join(" • ") : "Çalışma saatleri için lütfen talebinizi iletin; ekip kısa sürede dönüş yapacaktır.";
}

export async function loadRestaurantChatContext(restaurantId: string) {
  const business = await prisma.business.findUnique({
    where: {
      id: restaurantId
    },
    include: {
      settings: {
        take: 1
      },
      services: {
        where: { isActive: true },
        select: { name: true }
      },
      staffMembers: {
        where: { isActive: true },
        select: { name: true }
      },
      bookableResources: {
        where: { isActive: true },
        select: { name: true }
      }
    }
  });

  if (!business) {
    return null;
  }

  const settings = business.settings[0];
  const industry = getIndustryConfig(business.businessType);

  return {
    businessId: business.id,
    businessType: business.businessType,
    restaurantName: settings?.restaurantName ?? business.name,
    address: settings?.address ?? business.businessAddress ?? null,
    phone: settings?.phone ?? business.businessPhone ?? null,
    openingHoursText: formatOpeningHoursText(settings?.openingHours ?? null),
    menuUrl: null,
    policyText:
      settings?.notes?.trim() ||
      `${industry.requestLabelPlural} ekip onayından geçer. Nihai uygunluk işletme tarafından teyit edilir.`,
    maxPartySize: settings?.maxPartySize ?? 12,
    assistantEnabled: true,
    autoCreateReservationRequests: true,
    welcomeMessage: `${settings?.restaurantName ?? business.name} için ${industry.requestLabel.toLocaleLowerCase("tr-TR")} memnuniyetle alırım. Gerekli bilgileri paylaşırsanız talebinizi ekip onayına hazırlayabilirim.`,
    tone: "friendly",
    requiredFields: industry.requiredFields,
    serviceTypes: business.services.length > 0 ? business.services.map((service) => service.name) : industry.serviceTypes,
    staffOptions: business.staffMembers.map((member) => member.name),
    resourceOptions: business.bookableResources.map((resource) => resource.name),
    unsupportedAdvice: industry.unsupportedAdvice,
    requestLabel: industry.requestLabel,
    primaryResourceLabel: industry.primaryResourceLabel,
    serviceTypeLabel: industry.serviceTypeLabel
  } satisfies RestaurantContext;
}

async function loadOrCreateChatSession(input: {
  businessId: string;
  sessionId?: string | null;
}) {
  if (input.sessionId) {
    const existing = await prisma.chatSession.findFirst({
      where: {
        id: input.sessionId,
        businessId: input.businessId
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc"
          },
          take: 30
        }
      }
    });

    if (existing) {
      return existing;
    }
  }

  return prisma.chatSession.create({
    data: {
      businessId: input.businessId,
      status: ChatSessionStatus.ACTIVE
    },
    include: {
      messages: true
    }
  });
}

function getLatestUserConversationText(session: ChatSessionWithMessages, currentMessage: string) {
  const history = session.messages
    .filter((message) => message.role === ChatMessageRole.USER)
    .map((message) => message.content.trim())
    .filter(Boolean);

  return [...history, currentMessage.trim()].join("\n");
}

function detectQuestionIntent(message: string) {
  const normalized = message.toLocaleLowerCase("tr-TR");

  return {
    asksHours: /(saat|kaçta|açık|kapan|çalışma saati)/i.test(normalized),
    asksAddress: /(adres|konum|nerede|yol tarifi)/i.test(normalized),
    asksMenu: /(menü|menu|fiyat|yemekler)/i.test(normalized),
    asksPolicy: /(iptal|cancellation|kural|politika|çocuk|rezervasyon şart)/i.test(normalized),
    asksAvailability: /(müsait|uygunluk|yer var mı|masa var mı|availability)/i.test(normalized)
  };
}

function listMissingFields(
  context: RestaurantContext,
  extracted: {
  guestName?: string;
  guestPhone?: string;
  customerEmail?: string;
  requestedDate?: string;
  requestedTime?: string;
  endDate?: string;
  guestCount?: number;
  serviceType?: string;
}) {
  return context.requiredFields.filter((field) => {
    if (field === "serviceType") {
      return !extracted.serviceType;
    }
    if (field === "guestCount") {
      return !extracted.guestCount;
    }

    return !extracted[field as keyof typeof extracted];
  });
}

function formatMissingFieldPrompt(fields: string[], context: RestaurantContext) {
  if (fields.length === 0) {
    return "";
  }

  const labels = fields.map((field) =>
    getIndustryFieldLabel(field as IndustryFieldKey, getIndustryConfig(context.businessType)).toLocaleLowerCase("tr-TR")
  );

  if (fields.length === 1) {
    return `Devam edebilmem için ${labels[0]} bilgisini paylaşır mısınız?`;
  }

  const last = labels.pop();
  return `Devam edebilmem için ${labels.join(", ")} ve ${last} paylaşır mısınız?`;
}

function buildRuleBasedReply(input: {
  context: RestaurantContext;
  latestMessage: string;
  missingFields: string[];
  requestCreated: boolean;
}) {
  const questionIntent = detectQuestionIntent(input.latestMessage);
  const parts: string[] = [];

  if (questionIntent.asksHours) {
    parts.push(`Çalışma saatlerimiz: ${input.context.openingHoursText}.`);
  }

  if (questionIntent.asksAddress && input.context.address) {
    parts.push(`Adres bilgimiz: ${input.context.address}.`);
  }

  if (questionIntent.asksMenu) {
    parts.push(
      input.context.menuUrl
        ? `Menü bağlantımız: ${input.context.menuUrl}.`
        : "Menü bağlantısı şu anda paylaşılmamış. İsterseniz talebinizi alayım, ekip size ayrıca bilgi verebilir."
    );
  }

  if (questionIntent.asksPolicy) {
    parts.push(input.context.policyText);
  }

  if (questionIntent.asksAvailability) {
    parts.push(`Uygunluğu kesinleştiremiyorum; talebinizi alırım ve işletme ekibi son müsaitliği onaylar.`);
  }

  if (input.context.unsupportedAdvice && /(tedavi|teşhis|ilaç|hukuk|mahkeme|yatırım|finans)/i.test(input.latestMessage)) {
    parts.push(input.context.unsupportedAdvice);
  }

  if (input.requestCreated) {
    parts.push(`${input.context.requestLabel} alındı ve ekip onayına iletildi. İşletme ekibi son uygunluğu teyit ederek sizinle iletişime geçecek.`);
  } else if (input.missingFields.length > 0) {
    if (input.missingFields.includes("serviceType") && input.context.serviceTypes.length > 0) {
      parts.push(`Sunulan seçenekler: ${input.context.serviceTypes.slice(0, 6).join(", ")}.`);
    }
    parts.push(formatMissingFieldPrompt(input.missingFields, input.context));
  } else {
    parts.push("Talebinizi hazırlıyorum. İşletme ekibi son uygunluğu onaylayacaktır.");
  }

  return parts.join(" ").trim();
}

function buildConversationSummary(session: ChatSessionWithMessages, latestMessage: string) {
  const rows = session.messages.map((message) => `${message.role}: ${message.content}`);
  rows.push(`USER: ${latestMessage}`);
  return rows.slice(-12).join("\n");
}

async function maybeCreateReservationRequest(input: {
  session: ChatSessionWithMessages;
  context: RestaurantContext;
  extracted: Awaited<ReturnType<typeof extractReservationRequest>>;
  latestMessage: string;
}) {
  if (!input.context.autoCreateReservationRequests) {
    return null;
  }

  if (input.session.completedReservationRequestId) {
    return input.session.completedReservationRequestId;
  }

  const missingFields = listMissingFields(input.context, input.extracted);
  if (missingFields.length > 0) {
    return null;
  }

  const sourceMessageId = `chat-complete:${input.session.id}`;
  const existing = await prisma.reservationRequest.findFirst({
    where: {
      businessId: input.context.businessId,
      sourceMessageId
    }
  });

  if (existing) {
    await prisma.chatSession.update({
      where: {
        id: input.session.id
      },
      data: {
        status: ChatSessionStatus.COMPLETED,
        completedReservationRequestId: existing.id
      }
    });
    return existing.id;
  }

  await enforcePlanUsageLimit(input.context.businessId, "monthlyReservationRequests");

  const created = await prisma.reservationRequest.create({
    data: {
      businessId: input.context.businessId,
      source: ReservationSource.AI,
      status: ReservationRequestStatus.PENDING,
      sourceConversationId: input.session.id,
      sourceMessageId,
      guestName: input.extracted.guestName ?? "Web Chat Talebi",
      guestPhone: input.extracted.guestPhone ?? null,
      requestedDate: input.extracted.requestedDate ?? null,
      requestedTime: input.extracted.requestedTime ?? null,
      guestCount: input.extracted.guestCount ?? null,
      notes: input.extracted.notes ?? null,
      confidenceScore: input.extracted.confidenceScore,
      rawMessage: buildConversationSummary(input.session, input.latestMessage),
      extractedData: {
        ...input.extracted,
        channel: "WEBSITE_CHATBOT",
        sessionId: input.session.id,
        businessType: input.context.businessType
      }
    }
  });

  await prisma.chatSession.update({
    where: {
      id: input.session.id
    },
    data: {
      status: ChatSessionStatus.COMPLETED,
      completedReservationRequestId: created.id
    }
  });

  await safeCreateAuditLog({
    businessId: input.context.businessId,
    category: AuditCategory.INTEGRATION,
    action: "pending_request_created",
    message: "Pending reservation request created from website chatbot.",
    targetType: "ReservationRequest",
    targetId: created.id,
    metadata: {
      source: ReservationSource.AI,
      channel: "WEBSITE_CHATBOT",
      sessionId: input.session.id
    }
  });

  return created.id;
}

export async function handleRestaurantChatMessage(input: {
  restaurantId: string;
  sessionId?: string | null;
  message: string;
  source?: string | null;
}) {
  const context = await loadRestaurantChatContext(input.restaurantId);

  if (!context) {
    return {
      ok: false as const,
      status: 404,
      error: "Restoran bulunamadı."
    };
  }

  if (!context.assistantEnabled) {
    return {
      ok: false as const,
      status: 403,
      error: "AI Assistant şu anda bu restoran için aktif değil."
    };
  }

  const session = await loadOrCreateChatSession({
    businessId: context.businessId,
    sessionId: input.sessionId
  });

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: ChatMessageRole.USER,
      content: input.message
    }
  });

  const conversationText = getLatestUserConversationText(session, input.message);
  const extracted = await extractReservationRequest(conversationText, ReservationSource.AI, {
    businessType: context.businessType,
    serviceTypes: context.serviceTypes
  });
  const missingFields = listMissingFields(context, extracted);

  await prisma.chatSession.update({
    where: {
      id: session.id
    },
    data: {
      customerName: extracted.guestName ?? null,
      customerPhone: extracted.guestPhone ?? null,
      requestedDate: extracted.requestedDate ?? null,
      requestedTime: extracted.requestedTime ?? null,
      partySize: extracted.guestCount ?? null,
      notes: extracted.notes ?? null
    }
  });

  const requestId = await maybeCreateReservationRequest({
    session,
    context,
    extracted,
    latestMessage: input.message
  });

  const reply = buildRuleBasedReply({
    context,
    latestMessage: input.message,
    missingFields,
    requestCreated: Boolean(requestId)
  });

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: ChatMessageRole.ASSISTANT,
      content: reply
    }
  });

  return {
    ok: true as const,
    status: 200,
    payload: {
      sessionId: session.id,
      reply,
      requestCreated: Boolean(requestId),
      reservationRequestId: requestId ?? undefined,
      confidenceScore: extracted.confidenceScore ?? null,
      missingFields,
      context: {
        restaurantName: context.restaurantName
      }
    } satisfies AssistantTurnResult & { context: { restaurantName: string } }
  };
}
