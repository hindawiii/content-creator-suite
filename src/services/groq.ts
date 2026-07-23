import { SYSTEM_PROMPT } from "@/utils/prompts";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-8b-8192";

export interface ChatOptions {
  apiKey: string;
  userPrompt: string;
  system?: string;
  temperature?: number;
}

export async function groqChat({ apiKey, userPrompt, system, temperature = 0.8 }: ChatOptions): Promise<string> {
  if (!apiKey) throw new Error("missing_groq_key");
  const res = await fetch(GROQ_URL, {
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
    throw new Error(`groq_${res.status}:${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("groq_empty");
  return content as string;
}
