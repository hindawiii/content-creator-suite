import { SYSTEM_PROMPT } from "@/utils/prompts";

const TOGETHER_URL = "https://api.together.xyz/v1/chat/completions";
const MODEL = "meta-llama/Llama-3-8B-Instruct";

export interface ChatOptions {
  apiKey: string;
  userPrompt: string;
  system?: string;
  temperature?: number;
}

export async function togetherChat({ apiKey, userPrompt, system, temperature = 0.8 }: ChatOptions): Promise<string> {
  if (!apiKey) throw new Error("missing_together_key");
  const res = await fetch(TOGETHER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      messages: [
        { role: "system", content: system ?? SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`together_${res.status}:${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("together_empty");
  return content as string;
}
