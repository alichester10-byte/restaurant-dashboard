import { ReservationSource } from "@prisma/client";
import { extractReservationSignal } from "@/lib/integrations";

export type ReservationExtractionResult = {
  guestName: string;
  guestPhone?: string;
  requestedDate?: string;
  requestedTime?: string;
  guestCount?: number;
  notes?: string;
  source: ReservationSource;
  confidenceScore: number;
  provider: "rule-based" | "openai";
};

function normalizeResult(input: Partial<ReservationExtractionResult>, fallbackMessage: string, source: ReservationSource): ReservationExtractionResult {
  const fallback = extractReservationSignal(fallbackMessage);
  return {
    guestName: input.guestName?.trim() || fallback.guestName,
    guestPhone: input.guestPhone?.trim() || fallback.guestPhone,
    requestedDate: input.requestedDate || fallback.requestedDate,
    requestedTime: input.requestedTime || fallback.requestedTime,
    guestCount: input.guestCount || fallback.guestCount,
    notes: input.notes?.trim() || fallbackMessage.trim(),
    source,
    confidenceScore: Math.min(0.99, Math.max(0.2, input.confidenceScore ?? fallback.confidenceScore)),
    provider: input.provider ?? "rule-based"
  };
}

async function extractWithOpenAi(message: string, source: ReservationSource) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.AI_RESERVATION_MODEL ?? "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract restaurant reservation intent from Turkish messages. Return strict JSON with guestName, guestPhone, requestedDate, requestedTime, guestCount, notes, confidenceScore. Use ISO date YYYY-MM-DD and HH:MM 24h time when possible. Leave unknown fields null."
        },
        {
          role: "user",
          content: message
        }
      ]
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[ai:reservation_extract_failed]", {
      status: response.status,
      body
    });
    return null;
  }

  const payload = await response.json();
  const raw = payload?.choices?.[0]?.message?.content;
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeResult(
      {
        guestName: parsed.guestName,
        guestPhone: parsed.guestPhone,
        requestedDate: parsed.requestedDate,
        requestedTime: parsed.requestedTime,
        guestCount: typeof parsed.guestCount === "number" ? parsed.guestCount : undefined,
        notes: parsed.notes,
        confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : undefined,
        provider: "openai"
      },
      message,
      source
    );
  } catch (error) {
    console.error("[ai:reservation_extract_parse_failed]", {
      error: error instanceof Error ? error.message : "unknown_error"
    });
    return null;
  }
}

export async function extractReservationRequest(message: string, source: ReservationSource): Promise<ReservationExtractionResult> {
  const openAiResult = await extractWithOpenAi(message, source).catch((error) => {
    console.error("[ai:reservation_extract_error]", {
      error: error instanceof Error ? error.message : "unknown_error"
    });
    return null;
  });

  if (openAiResult) {
    return openAiResult;
  }

  return normalizeResult({ provider: "rule-based" }, message, source);
}
