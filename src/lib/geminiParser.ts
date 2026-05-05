import { GoogleGenAI } from "@google/genai";
import type { ParsedIntent } from "./recommendEngine";
import { parseQueryWithKeywords } from "./queryParser";

export function buildPrompt(query: string): string {
  return `You are a restaurant recommendation assistant. Analyze the user's query and return a JSON object describing their dining intent.

User query: "${query}"

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "vibeProfile": {
    "intimacy": <integer 1-10, how private/intimate the setting should be>,
    "energy": <integer 1-10, how lively/energetic the atmosphere>,
    "formality": <integer 1-10, how formal the setting>,
    "noise": <integer 1-10, how loud the environment>,
    "outdoorsy": <integer 1-10, preference for outdoor seating>
  },
  "occasion": "<one of: date|birthday|business|party|study|hangout|family|anniversary|general>",
  "budgetHint": <one of: "$"|"$$"|"$$$"|"$$$$"|null>,
  "groupContext": "<one of: solo|couple|family|friends|colleagues>",
  "atmosphereKeywords": ["<up to 4 single words like: quiet, candlelit, outdoor, rooftop, aesthetic>"],
  "rawIntent": "<8 words max summary of the user's intent>"
}`;
}

export function parseGeminiResponse(text: string, fallbackQuery: string): ParsedIntent {
  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.vibeProfile || typeof parsed.vibeProfile.intimacy !== "number") {
      throw new Error("Missing vibeProfile");
    }

    const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));
    const validBudgets = ["$", "$$", "$$$", "$$$$"];
    const validGroups = ["solo", "couple", "family", "friends", "colleagues"];

    return {
      vibeProfile: {
        intimacy:  clamp(parsed.vibeProfile.intimacy),
        energy:    clamp(parsed.vibeProfile.energy),
        formality: clamp(parsed.vibeProfile.formality),
        noise:     clamp(parsed.vibeProfile.noise),
        outdoorsy: clamp(parsed.vibeProfile.outdoorsy),
      },
      occasion: typeof parsed.occasion === "string" ? parsed.occasion : "general",
      budgetHint: validBudgets.includes(parsed.budgetHint)
        ? (parsed.budgetHint as ParsedIntent["budgetHint"])
        : null,
      groupContext: validGroups.includes(parsed.groupContext)
        ? (parsed.groupContext as ParsedIntent["groupContext"])
        : "couple",
      atmosphereKeywords: Array.isArray(parsed.atmosphereKeywords)
        ? parsed.atmosphereKeywords.slice(0, 4).map(String)
        : [],
      rawIntent:
        typeof parsed.rawIntent === "string"
          ? parsed.rawIntent.slice(0, 60)
          : fallbackQuery.slice(0, 60),
    };
  } catch {
    return parseQueryWithKeywords(fallbackQuery);
  }
}

export async function parseQueryWithGemini(query: string): Promise<ParsedIntent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return parseQueryWithKeywords(query);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: buildPrompt(query) }] }],
    });

    const text = response.text ?? "";
    return parseGeminiResponse(text, query);
  } catch {
    return parseQueryWithKeywords(query);
  }
}
