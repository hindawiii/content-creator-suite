/**
 * Google AI Studio (Gemini) image generation with the user's own free-tier key.
 * Free tier has a limited daily quota — the user brings their own key (BYOK).
 */
const MODEL = "gemini-2.5-flash-image";

export async function geminiImage(opts: { apiKey: string; prompt: string }): Promise<string> {
  if (!opts.apiKey) throw new Error("missing_gemini_key");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": opts.apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    },
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`gemini_${res.status}:${t.slice(0, 160)}`);
  }
  const data = await res.json();
  const parts: { inlineData?: { data?: string; mimeType?: string } }[] =
    data?.candidates?.[0]?.content?.parts ?? [];
  const inline = parts.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline?.data) throw new Error("gemini_no_image");
  return `data:${inline.mimeType ?? "image/png"};base64,${inline.data}`;
}

export async function testGeminiKey(apiKey: string): Promise<boolean> {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
    headers: { "x-goog-api-key": apiKey },
  });
  return res.ok;
}
