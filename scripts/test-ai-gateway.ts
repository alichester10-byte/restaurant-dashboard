import { config as loadEnv } from "dotenv";
import { streamText } from "ai";

loadEnv({ path: ".env.local" });

async function main() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;

  if (!gatewayKey || gatewayKey === "your_key_here") {
    throw new Error("Missing AI_GATEWAY_API_KEY in .env.local");
  }

  const result = streamText({
    model: "openai/gpt-5.4",
    prompt: "Write a short professional welcome message for a universal reservation platform."
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  const usage = await result.usage;
  process.stdout.write(`\n\nToken usage: ${JSON.stringify(usage, null, 2)}\n`);
}

main().catch((error) => {
  console.error("AI Gateway test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
