import { describe, it, expect } from "vitest";
import { buildPrompt, parseGeminiResponse } from "../geminiParser";

const validResponseJson = JSON.stringify({
  vibeProfile: { intimacy: 8, energy: 3, formality: 7, noise: 3, outdoorsy: 2 },
  occasion: "date",
  budgetHint: "$$$",
  groupContext: "couple",
  atmosphereKeywords: ["candlelit", "quiet"],
  rawIntent: "romantic dinner for two",
});

describe("buildPrompt", () => {
  it("includes the user query in the prompt", () => {
    const prompt = buildPrompt("romantic dinner for two");
    expect(prompt).toContain("romantic dinner for two");
  });

  it("instructs Gemini to return JSON only", () => {
    const prompt = buildPrompt("any query");
    expect(prompt.toLowerCase()).toContain("json");
  });

  it("includes all 5 vibe dimension names", () => {
    const prompt = buildPrompt("test");
    expect(prompt).toContain("intimacy");
    expect(prompt).toContain("energy");
    expect(prompt).toContain("formality");
    expect(prompt).toContain("noise");
    expect(prompt).toContain("outdoorsy");
  });
});

describe("parseGeminiResponse", () => {
  it("parses a valid JSON response", () => {
    const intent = parseGeminiResponse(validResponseJson, "romantic dinner");
    expect(intent.vibeProfile.intimacy).toBe(8);
    expect(intent.occasion).toBe("date");
    expect(intent.budgetHint).toBe("$$$");
    expect(intent.groupContext).toBe("couple");
  });

  it("strips markdown code fences before parsing", () => {
    const wrapped = "```json\n" + validResponseJson + "\n```";
    const intent = parseGeminiResponse(wrapped, "romantic dinner");
    expect(intent.vibeProfile.intimacy).toBe(8);
  });

  it("clamps intimacy above 10 to 10", () => {
    const extreme = JSON.stringify({
      vibeProfile: { intimacy: 15, energy: 5, formality: 5, noise: 5, outdoorsy: 5 },
      occasion: "general", budgetHint: null, groupContext: "couple",
      atmosphereKeywords: [], rawIntent: "test",
    });
    const intent = parseGeminiResponse(extreme, "test");
    expect(intent.vibeProfile.intimacy).toBe(10);
  });

  it("clamps energy below 1 to 1", () => {
    const extreme = JSON.stringify({
      vibeProfile: { intimacy: 5, energy: -3, formality: 5, noise: 5, outdoorsy: 5 },
      occasion: "general", budgetHint: null, groupContext: "couple",
      atmosphereKeywords: [], rawIntent: "test",
    });
    const intent = parseGeminiResponse(extreme, "test");
    expect(intent.vibeProfile.energy).toBe(1);
  });

  it("sets budgetHint to null for unrecognised values", () => {
    const bad = JSON.stringify({
      vibeProfile: { intimacy: 5, energy: 5, formality: 5, noise: 5, outdoorsy: 5 },
      occasion: "general", budgetHint: "FREE", groupContext: "couple",
      atmosphereKeywords: [], rawIntent: "test",
    });
    const intent = parseGeminiResponse(bad, "test");
    expect(intent.budgetHint).toBeNull();
  });

  it("falls back to keyword parsing on invalid JSON", () => {
    const intent = parseGeminiResponse("not valid json at all", "romantic dinner");
    expect(intent.vibeProfile.intimacy).toBeGreaterThan(7);
  });

  it("falls back to keyword parsing on missing vibeProfile", () => {
    const incomplete = JSON.stringify({ occasion: "date" });
    const intent = parseGeminiResponse(incomplete, "quiet study café");
    expect(intent.vibeProfile.noise).toBeLessThan(4);
  });
});
