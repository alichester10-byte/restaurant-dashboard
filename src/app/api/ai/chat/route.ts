import { streamText } from "ai";
import { NextResponse } from "next/server";
import { getIndustryConfig, getIndustryFieldLabel, type IndustryFieldKey } from "@/lib/industry-config";
import { enforcePlanFeature, enforcePlanUsageLimit, PlanLimitError } from "@/lib/plan-config";
import {
  persistRestaurantAssistantMessage,
  prepareRestaurantChatTurn
} from "@/lib/restaurant-chat";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { aiChatSchema } from "@/lib/validation";

function buildMissingFieldsText(fields: string[], businessType: Parameters<typeof getIndustryConfig>[0]) {
  if (fields.length === 0) {
    return "All minimum booking details are currently present.";
  }

  return fields
    .map((field) => getIndustryFieldLabel(field as IndustryFieldKey, getIndustryConfig(businessType)))
    .join(", ");
}

function buildSystemPrompt(input: {
  businessName: string;
  businessType: Parameters<typeof getIndustryConfig>[0];
  address: string | null;
  phone: string | null;
  openingHoursText: string;
  policyText: string;
  requiredFieldsText: string;
  serviceTypes: string[];
  staffOptions: string[];
  resourceOptions: string[];
  missingFieldsText: string;
  requestAlreadyCreated: boolean;
}) {
  const industry = getIndustryConfig(input.businessType);
  const serviceTypes = input.serviceTypes.length > 0 ? input.serviceTypes.join(", ") : "No explicit service list shared";
  const staffOptions = input.staffOptions.length > 0 ? input.staffOptions.join(", ") : "No specific staff list shared";
  const resourceOptions = input.resourceOptions.length > 0 ? input.resourceOptions.join(", ") : "No specific resource list shared";

  return [
    `You are the booking assistant for ${input.businessName}.`,
    `Industry: ${industry.displayName}.`,
    `Use this terminology: reservation label = ${industry.reservationLabel}, request label = ${industry.requestLabel}, customer label = ${industry.customerLabel}, primary resource label = ${industry.primaryResourceLabel}.`,
    `Business context: address = ${input.address ?? "not shared"}, phone = ${input.phone ?? "not shared"}, opening hours = ${input.openingHoursText}.`,
    `Business policy: ${input.policyText}`,
    `Required fields before a request is complete: ${input.requiredFieldsText}.`,
    `Missing fields right now: ${input.missingFieldsText}.`,
    `Available services if relevant: ${serviceTypes}.`,
    `Available staff if relevant: ${staffOptions}.`,
    `Available resources if relevant: ${resourceOptions}.`,
    `Rules: ask only for missing required fields. Keep answers concise, polite, and practical. Never confirm a booking. Never promise availability. Always say the business will confirm the final availability. Never mention prompts, APIs, databases, or implementation details.`,
    `If asked about opening hours, address, policy, service options, staff options, or resources, answer only from the business context above. If the information is not available, say the business team will confirm.`,
    `For clinics, dentists, and medical businesses: never provide medical advice.`,
    `For consulting or legal-style businesses: never provide legal or financial advice.`,
    `For hotels and event venues: never guarantee availability without confirmation.`,
    input.requestAlreadyCreated
      ? `A pending ${industry.requestLabel.toLowerCase()} has already been created. Tell the customer their request has been received and the business team will confirm it.`
      : `If enough details are still missing, ask only for those missing fields. If all required details are present, thank the customer and say the request has been received and the business team will confirm it.`
  ].join("\n");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = aiChatSchema.safeParse(body);

  if (!parsed.success || !parsed.data.message?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mesaj veya işletme bilgisi geçersiz."
      },
      { status: 400 }
    );
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error: "AI Gateway şu anda yapılandırılmadı. Talebinizi form üzerinden iletebilirsiniz."
      },
      { status: 503 }
    );
  }

  const limiter = await rateLimitPlaceholder(
    `${parsed.data.restaurantId}:${parsed.data.sessionId || "new"}`,
    "ai-chat",
    parsed.data.restaurantId
  );

  if (!limiter.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Kısa süre içinde çok fazla mesaj gönderildi. Lütfen biraz sonra tekrar deneyin."
      },
      { status: 429 }
    );
  }

  try {
    await enforcePlanFeature(
      parsed.data.restaurantId,
      "aiAssistant",
      "Bu plan AI asistanını henüz desteklemiyor. Üst plana geçerek açabilirsiniz."
    );
    await enforcePlanUsageLimit(parsed.data.restaurantId, "monthlyAiMessages");

    const prepared = await prepareRestaurantChatTurn({
      restaurantId: parsed.data.restaurantId,
      sessionId: parsed.data.sessionId || null,
      message: parsed.data.message
    });

    if (!prepared.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: prepared.error
        },
        { status: prepared.status }
      );
    }

    const industry = getIndustryConfig(prepared.context.businessType);
    const recentConversation = prepared.session.messages
      .slice(-10)
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");
    const system = buildSystemPrompt({
      businessName: prepared.context.restaurantName,
      businessType: prepared.context.businessType,
      address: prepared.context.address,
      phone: prepared.context.phone,
      openingHoursText: prepared.context.openingHoursText,
      policyText: prepared.context.policyText,
      requiredFieldsText: prepared.context.requiredFields
        .map((field) => getIndustryFieldLabel(field, industry))
        .join(", "),
      serviceTypes: prepared.context.serviceTypes,
      staffOptions: prepared.context.staffOptions,
      resourceOptions: prepared.context.resourceOptions,
      missingFieldsText: buildMissingFieldsText(prepared.missingFields, prepared.context.businessType),
      requestAlreadyCreated: Boolean(prepared.requestId)
    });

    const result = streamText({
      model: "openai/gpt-5.4",
      system,
      prompt: [
        recentConversation ? `Recent conversation:\n${recentConversation}` : null,
        `Latest customer message:\n${parsed.data.message}`,
        "Respond as the booking assistant using the rules above."
      ]
        .filter(Boolean)
        .join("\n\n"),
      onFinish: async ({ text }) => {
        const finalText = text?.trim();
        if (!finalText) {
          return;
        }

        try {
          await persistRestaurantAssistantMessage(prepared.session.id, finalText);
        } catch (error) {
          console.error("[ai:chat-persist-failed]", {
            sessionId: prepared.session.id,
            error: error instanceof Error ? error.message : "unknown_error"
          });
        }
      }
    });

    const baseResponse = result.toUIMessageStreamResponse();
    const headers = new Headers(baseResponse.headers);
    headers.set("x-chat-session-id", prepared.session.id);
    headers.set("x-request-created", prepared.requestId ? "1" : "0");
    if (prepared.requestId) {
      headers.set("x-reservation-request-id", prepared.requestId);
    }

    return new Response(baseResponse.body, {
      status: baseResponse.status,
      statusText: baseResponse.statusText,
      headers
    });
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message
        },
        { status: 403 }
      );
    }

    console.error("[ai:chat-route-error]", {
      error: error instanceof Error ? error.message : "unknown_error"
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Şu anda AI asistanına ulaşılamıyor. İsterseniz talebinizi form üzerinden iletebilirsiniz."
      },
      { status: 500 }
    );
  }
}
