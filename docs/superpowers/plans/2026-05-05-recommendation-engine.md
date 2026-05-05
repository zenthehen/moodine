# Recommendation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the decorative search bar into a working AI-powered natural language recommendation engine with per-card explanations.

**Architecture:** Gemini parses freeform user queries into a structured `ParsedIntent` object (1 API call). A local scoring engine ranks all DB restaurants against that intent. A template engine generates a one-sentence "why recommended" explanation per card using the intent fields. Keyword fallback activates if Gemini is unavailable.

**Tech Stack:** Next.js 16 App Router, `@google/genai` v1.51, Prisma/SQLite, React 19, TailwindCSS v4, Vitest (unit tests)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/recommendEngine.ts` | **Create** | Types (`ParsedIntent`, `RestaurantInput`, `ScoredRestaurant`), `scoreRestaurant`, `generateExplanation`, `rankRestaurants` |
| `src/lib/queryParser.ts` | **Create** | Keyword-based intent parsing — client+server safe, used as fallback |
| `src/lib/geminiParser.ts` | **Create** | Server-only: builds Gemini prompt, calls API, parses response, delegates to `queryParser` on failure |
| `src/app/api/recommend/route.ts` | **Create** | `POST /api/recommend` handler — thin glue between Gemini parser and client |
| `src/app/HomePageClient.tsx` | **Modify** | Wire search bar → API → score → render NL results with explanation chips |
| `.env` | **Modify** | Add `GEMINI_API_KEY` line |
| `src/lib/__tests__/recommendEngine.test.ts` | **Create** | Unit tests for scoring + explanation |
| `src/lib/__tests__/queryParser.test.ts` | **Create** | Unit tests for keyword fallback |
| `src/lib/__tests__/geminiParser.test.ts` | **Create** | Unit tests for response parsing |
| `vitest.config.ts` | **Create** | Vitest config with `@` path alias |

---

## Task 1: Environment + Test Tooling

**Files:**
- Modify: `.env`
- Create: `vitest.config.ts`

- [ ] **Step 1: Add GEMINI_API_KEY to .env**

Open `.env` and add (replace `your_key_here` with your actual key):

```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY=your_key_here
```

- [ ] **Step 2: Install vitest**

```bash
npm install --save-dev vitest
```

Expected: vitest added to `devDependencies` in `package.json`.

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add `"test": "vitest run"` to the `scripts` block:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run"
}
```

- [ ] **Step 5: Commit**

```bash
git add .env vitest.config.ts package.json
git commit -m "feat: add GEMINI_API_KEY env var and vitest test tooling"
```

---

## Task 2: recommendEngine.ts — Types, Scorer, Explainer

**Files:**
- Create: `src/lib/recommendEngine.ts`
- Create: `src/lib/__tests__/recommendEngine.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/recommendEngine.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  scoreRestaurant,
  generateExplanation,
  rankRestaurants,
} from "../recommendEngine";
import type { ParsedIntent, RestaurantInput } from "../recommendEngine";

const romanticIntent: ParsedIntent = {
  vibeProfile: { intimacy: 9, energy: 2, formality: 8, noise: 2, outdoorsy: 2 },
  occasion: "date night",
  budgetHint: "$$$$",
  groupContext: "couple",
  atmosphereKeywords: ["candlelit", "quiet"],
  rawIntent: "romantic date night dinner",
};

const highMatchRestaurant: RestaurantInput = {
  id: "1",
  name: "Chez Lumière",
  cuisine: "French Continental",
  location: "Lazimpat",
  description: "Intimate candlelit dining.",
  priceLevel: "$$$$",
  imageUrl: "",
  vibe: { intimacy: 9, energy: 2, formality: 9, noise: 2, outdoorsy: 1 },
  averageRating: 4.8,
  reviewCount: 124,
  isFeatured: true,
};

const lowMatchRestaurant: RestaurantInput = {
  id: "2",
  name: "Himalayan Brewhouse",
  cuisine: "Pub & Grill",
  location: "Thamel",
  description: "Loud pub with DJ nights.",
  priceLevel: "$$",
  imageUrl: "",
  vibe: { intimacy: 1, energy: 10, formality: 1, noise: 9, outdoorsy: 4 },
  averageRating: 4.2,
  reviewCount: 89,
  isFeatured: false,
};

describe("scoreRestaurant", () => {
  it("gives high score to well-matched restaurant", () => {
    const score = scoreRestaurant(highMatchRestaurant, romanticIntent);
    expect(score).toBeGreaterThan(80);
  });

  it("gives low score to poorly matched restaurant", () => {
    const score = scoreRestaurant(lowMatchRestaurant, romanticIntent);
    expect(score).toBeLessThan(50);
  });

  it("adds budget bonus when priceLevel matches budgetHint", () => {
    const withBudget = scoreRestaurant(highMatchRestaurant, romanticIntent);
    const noBudgetIntent: ParsedIntent = { ...romanticIntent, budgetHint: null };
    const withoutBudget = scoreRestaurant(highMatchRestaurant, noBudgetIntent);
    expect(withBudget).toBeGreaterThan(withoutBudget);
  });

  it("caps score at 100", () => {
    const score = scoreRestaurant(highMatchRestaurant, romanticIntent);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("adds featured bonus for featured restaurants", () => {
    const featuredScore = scoreRestaurant(highMatchRestaurant, romanticIntent);
    const unfeatured = { ...highMatchRestaurant, isFeatured: false };
    const unfeaturedScore = scoreRestaurant(unfeatured, romanticIntent);
    expect(featuredScore).toBeGreaterThan(unfeaturedScore);
  });
});

describe("generateExplanation", () => {
  it("includes rawIntent in explanation", () => {
    const explanation = generateExplanation(highMatchRestaurant, romanticIntent);
    expect(explanation).toContain("romantic date night dinner");
  });

  it("includes cuisine in explanation", () => {
    const explanation = generateExplanation(highMatchRestaurant, romanticIntent);
    expect(explanation).toContain("French Continental");
  });

  it("includes budget note when price matches", () => {
    const explanation = generateExplanation(highMatchRestaurant, romanticIntent);
    expect(explanation).toContain("$$$$");
  });

  it("omits budget note when price does not match", () => {
    const explanation = generateExplanation(lowMatchRestaurant, romanticIntent);
    expect(explanation).not.toContain("Fits your budget");
  });

  it("returns a non-empty string", () => {
    const explanation = generateExplanation(highMatchRestaurant, romanticIntent);
    expect(explanation.length).toBeGreaterThan(20);
  });
});

describe("rankRestaurants", () => {
  it("returns highest scoring restaurant first", () => {
    const { restaurants } = rankRestaurants(
      [lowMatchRestaurant, highMatchRestaurant],
      romanticIntent
    );
    expect(restaurants[0].id).toBe("1");
  });

  it("sets hasAlternatives=false when results meet threshold", () => {
    const { hasAlternatives } = rankRestaurants(
      [highMatchRestaurant],
      romanticIntent
    );
    expect(hasAlternatives).toBe(false);
  });

  it("returns alternatives when nothing meets threshold", () => {
    const { restaurants, hasAlternatives } = rankRestaurants(
      [lowMatchRestaurant],
      romanticIntent,
      99
    );
    expect(hasAlternatives).toBe(true);
    expect(restaurants.length).toBeLessThanOrEqual(3);
  });

  it("attaches an explanation string to every result", () => {
    const { restaurants } = rankRestaurants(
      [highMatchRestaurant],
      romanticIntent
    );
    expect(typeof restaurants[0].explanation).toBe("string");
    expect(restaurants[0].explanation.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
npm test
```

Expected: `Cannot find module '../recommendEngine'` — module does not exist yet.

- [ ] **Step 3: Create src/lib/recommendEngine.ts**

```ts
import {
  type VibeDimensions,
  calculateMatchScore,
} from "@/data/mockRestaurants";

export type { VibeDimensions };

export type ParsedIntent = {
  vibeProfile: VibeDimensions;
  occasion: string;
  budgetHint: "$" | "$$" | "$$$" | "$$$$" | null;
  groupContext: "solo" | "couple" | "family" | "friends" | "colleagues";
  atmosphereKeywords: string[];
  rawIntent: string;
};

export type RestaurantInput = {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  description: string;
  priceLevel: string;
  imageUrl: string;
  vibe: VibeDimensions;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
};

export type ScoredRestaurant = RestaurantInput & {
  matchScore: number;
  explanation: string;
};

export type RankResult = {
  restaurants: ScoredRestaurant[];
  hasAlternatives: boolean;
};

const VIBE_LABELS: Record<keyof VibeDimensions, [string, string, string]> = {
  intimacy: ["open & social", "semi-private", "deeply intimate"],
  energy: ["calm & relaxed", "moderate energy", "high energy"],
  formality: ["casual", "smart casual", "formal & upscale"],
  noise: ["very quiet", "moderate noise", "lively & loud"],
  outdoorsy: ["fully indoor", "indoor-outdoor mix", "great outdoor setting"],
};

function vibeLabel(dim: keyof VibeDimensions, value: number): string {
  const tier = value <= 3 ? 0 : value <= 6 ? 1 : 2;
  return VIBE_LABELS[dim][tier];
}

export function scoreRestaurant(
  restaurant: RestaurantInput,
  intent: ParsedIntent
): number {
  let score = calculateMatchScore(restaurant.vibe, intent.vibeProfile);
  if (intent.budgetHint && restaurant.priceLevel === intent.budgetHint) score += 10;
  if (restaurant.averageRating >= 4.8) score += 8;
  else if (restaurant.averageRating >= 4.5) score += 5;
  if (restaurant.isFeatured) score += 3;
  return Math.min(score, 100);
}

export function generateExplanation(
  restaurant: RestaurantInput,
  intent: ParsedIntent
): string {
  const dims = Object.keys(intent.vibeProfile) as (keyof VibeDimensions)[];
  const sorted = dims
    .map((key) => ({
      key,
      diff: Math.abs(restaurant.vibe[key] - intent.vibeProfile[key]),
    }))
    .sort((a, b) => a.diff - b.diff);

  const topTraits = sorted
    .slice(0, 2)
    .map((d) => vibeLabel(d.key, restaurant.vibe[d.key]));

  const budgetLine =
    intent.budgetHint && restaurant.priceLevel === intent.budgetHint
      ? ` Fits your budget (${restaurant.priceLevel}).`
      : "";

  return `Recommended for your ${intent.rawIntent} — ${topTraits.join(", ")}, with ${restaurant.cuisine} dining.${budgetLine}`;
}

export function rankRestaurants(
  restaurants: RestaurantInput[],
  intent: ParsedIntent,
  threshold = 35
): RankResult {
  const scored: ScoredRestaurant[] = restaurants.map((r) => ({
    ...r,
    matchScore: scoreRestaurant(r, intent),
    explanation: generateExplanation(r, intent),
  }));

  const aboveThreshold = scored
    .filter((r) => r.matchScore >= threshold)
    .sort((a, b) => b.matchScore - a.matchScore);

  if (aboveThreshold.length === 0) {
    const alternatives = scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
    return { restaurants: alternatives, hasAlternatives: true };
  }

  return { restaurants: aboveThreshold, hasAlternatives: false };
}
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
npm test
```

Expected: All tests in `recommendEngine.test.ts` pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommendEngine.ts src/lib/__tests__/recommendEngine.test.ts
git commit -m "feat: add recommendation scoring engine with tests"
```

---

## Task 3: queryParser.ts — Keyword Fallback

**Files:**
- Create: `src/lib/queryParser.ts`
- Create: `src/lib/__tests__/queryParser.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/queryParser.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseQueryWithKeywords } from "../queryParser";

describe("parseQueryWithKeywords", () => {
  it("maps 'romantic' to high intimacy and low noise", () => {
    const intent = parseQueryWithKeywords("romantic dinner");
    expect(intent.vibeProfile.intimacy).toBeGreaterThan(7);
    expect(intent.vibeProfile.noise).toBeLessThan(4);
  });

  it("maps 'study' and 'quiet' to low noise and low energy", () => {
    const intent = parseQueryWithKeywords("quiet café for studying");
    expect(intent.vibeProfile.noise).toBeLessThan(4);
    expect(intent.vibeProfile.energy).toBeLessThan(4);
  });

  it("maps 'friends' to high energy", () => {
    const intent = parseQueryWithKeywords("group hangout with friends");
    expect(intent.vibeProfile.energy).toBeGreaterThan(6);
  });

  it("sets groupContext to 'solo' for solo queries", () => {
    const intent = parseQueryWithKeywords("solo lunch");
    expect(intent.groupContext).toBe("solo");
  });

  it("sets groupContext to 'family' for family queries", () => {
    const intent = parseQueryWithKeywords("family dinner with kids");
    expect(intent.groupContext).toBe("family");
  });

  it("sets budgetHint to '$' for cheap/budget queries", () => {
    const intent = parseQueryWithKeywords("cheap eats tonight");
    expect(intent.budgetHint).toBe("$");
  });

  it("sets budgetHint to '$$$$' for luxury queries", () => {
    const intent = parseQueryWithKeywords("luxury fine dining");
    expect(intent.budgetHint).toBe("$$$$");
  });

  it("returns a non-empty rawIntent derived from query", () => {
    const intent = parseQueryWithKeywords("birthday celebration dinner");
    expect(intent.rawIntent.length).toBeGreaterThan(0);
  });

  it("returns balanced defaults for a vague query", () => {
    const intent = parseQueryWithKeywords("nice place");
    expect(intent.vibeProfile.intimacy).toBe(5);
    expect(intent.vibeProfile.energy).toBe(5);
  });
});
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
npm test -- queryParser
```

Expected: `Cannot find module '../queryParser'`

- [ ] **Step 3: Create src/lib/queryParser.ts**

```ts
import type { ParsedIntent } from "./recommendEngine";

type KeywordOverride = {
  intimacy?: number;
  energy?: number;
  formality?: number;
  noise?: number;
  outdoorsy?: number;
  occasion?: string;
  budgetHint?: ParsedIntent["budgetHint"];
  groupContext?: ParsedIntent["groupContext"];
};

const KEYWORD_MAP: [string, KeywordOverride][] = [
  ["romantic",     { intimacy: 9, energy: 2, formality: 7, noise: 2, occasion: "date night" }],
  ["date",         { intimacy: 8, energy: 3, formality: 7, noise: 3, occasion: "date night", groupContext: "couple" }],
  ["birthday",     { intimacy: 6, energy: 7, formality: 6, noise: 5, occasion: "birthday celebration" }],
  ["celebration",  { intimacy: 6, energy: 7, formality: 7, noise: 5, occasion: "celebration" }],
  ["anniversary",  { intimacy: 9, energy: 3, formality: 8, noise: 2, occasion: "anniversary dinner", groupContext: "couple" }],
  ["business",     { intimacy: 4, formality: 9, energy: 2, noise: 2, occasion: "business meeting", groupContext: "colleagues" }],
  ["meeting",      { intimacy: 4, formality: 8, energy: 2, noise: 2, occasion: "business meeting", groupContext: "colleagues" }],
  ["family",       { intimacy: 3, energy: 7, formality: 2, noise: 7, groupContext: "family", occasion: "family outing" }],
  ["kids",         { energy: 7, formality: 1, noise: 7, groupContext: "family" }],
  ["friends",      { intimacy: 2, energy: 8, formality: 2, noise: 7, groupContext: "friends", occasion: "group hangout" }],
  ["group",        { intimacy: 2, energy: 8, formality: 2, noise: 7, occasion: "group hangout" }],
  ["party",        { intimacy: 1, energy: 9, formality: 2, noise: 9, occasion: "party" }],
  ["study",        { energy: 2, formality: 2, noise: 1, occasion: "study session" }],
  ["work",         { energy: 2, formality: 4, noise: 2, occasion: "work session" }],
  ["café",         { intimacy: 6, energy: 2, formality: 2, noise: 2, occasion: "café visit" }],
  ["cafe",         { intimacy: 6, energy: 2, formality: 2, noise: 2, occasion: "café visit" }],
  ["coffee",       { intimacy: 5, energy: 2, formality: 2, noise: 2 }],
  ["solo",         { intimacy: 6, energy: 2, groupContext: "solo", occasion: "solo dining" }],
  ["couple",       { intimacy: 8, formality: 6, groupContext: "couple" }],
  ["quiet",        { noise: 2, energy: 2 }],
  ["peaceful",     { noise: 2, energy: 2 }],
  ["loud",         { noise: 8, energy: 8 }],
  ["lively",       { energy: 8, noise: 7 }],
  ["outdoor",      { outdoorsy: 8 }],
  ["rooftop",      { outdoorsy: 7, energy: 6 }],
  ["luxury",       { formality: 9, intimacy: 7, budgetHint: "$$$$" }],
  ["fine dining",  { formality: 9, intimacy: 8, budgetHint: "$$$$", occasion: "fine dining" }],
  ["fancy",        { formality: 8, intimacy: 7, budgetHint: "$$$" }],
  ["cheap",        { budgetHint: "$" }],
  ["budget",       { budgetHint: "$" }],
  ["affordable",   { budgetHint: "$$" }],
  ["casual",       { formality: 2, energy: 5 }],
  ["cozy",         { intimacy: 7, energy: 2, noise: 2 }],
  ["aesthetic",    { intimacy: 6, formality: 5 }],
];

export function parseQueryWithKeywords(query: string): ParsedIntent {
  const lower = query.toLowerCase();
  const vibe = { intimacy: 5, energy: 5, formality: 5, noise: 5, outdoorsy: 5 };
  let occasion = "dining out";
  let budgetHint: ParsedIntent["budgetHint"] = null;
  let groupContext: ParsedIntent["groupContext"] = "couple";

  for (const [keyword, overrides] of KEYWORD_MAP) {
    if (lower.includes(keyword)) {
      if (overrides.intimacy  !== undefined) vibe.intimacy  = overrides.intimacy;
      if (overrides.energy    !== undefined) vibe.energy    = overrides.energy;
      if (overrides.formality !== undefined) vibe.formality = overrides.formality;
      if (overrides.noise     !== undefined) vibe.noise     = overrides.noise;
      if (overrides.outdoorsy !== undefined) vibe.outdoorsy = overrides.outdoorsy;
      if (overrides.occasion)    occasion    = overrides.occasion;
      if (overrides.budgetHint)  budgetHint  = overrides.budgetHint;
      if (overrides.groupContext) groupContext = overrides.groupContext;
    }
  }

  return {
    vibeProfile: vibe,
    occasion,
    budgetHint,
    groupContext,
    atmosphereKeywords: [],
    rawIntent: query.trim().slice(0, 50),
  };
}
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
npm test -- queryParser
```

Expected: All 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queryParser.ts src/lib/__tests__/queryParser.test.ts
git commit -m "feat: add keyword-based query parser with tests"
```

---

## Task 4: geminiParser.ts — Gemini Integration

**Files:**
- Create: `src/lib/geminiParser.ts`
- Create: `src/lib/__tests__/geminiParser.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/geminiParser.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
npm test -- geminiParser
```

Expected: `Cannot find module '../geminiParser'`

- [ ] **Step 3: Create src/lib/geminiParser.ts**

```ts
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

    if (
      !parsed.vibeProfile ||
      typeof parsed.vibeProfile.intimacy !== "number"
    ) {
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
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
npm test -- geminiParser
```

Expected: All 8 tests pass.

- [ ] **Step 5: Run all tests together**

```bash
npm test
```

Expected: All tests across all 3 test files pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/geminiParser.ts src/lib/__tests__/geminiParser.test.ts
git commit -m "feat: add Gemini parser with keyword fallback and tests"
```

---

## Task 5: POST /api/recommend Route

**Files:**
- Create: `src/app/api/recommend/route.ts`

- [ ] **Step 1: Create the route handler**

```ts
import { NextResponse } from "next/server";
import { parseQueryWithGemini } from "@/lib/geminiParser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const intent = await parseQueryWithGemini(query);
    return NextResponse.json({ intent });
  } catch (error) {
    console.error("[/api/recommend]", error);
    return NextResponse.json({ error: "parse_failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Smoke test the route manually**

Start the dev server (`npm run dev`), then in another terminal:

```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query":"romantic dinner for two"}'
```

Expected response shape:
```json
{
  "intent": {
    "vibeProfile": { "intimacy": 8, "energy": 2, "formality": 7, "noise": 2, "outdoorsy": 3 },
    "occasion": "date",
    "budgetHint": null,
    "groupContext": "couple",
    "atmosphereKeywords": ["candlelit","intimate"],
    "rawIntent": "romantic dinner for two"
  }
}
```

(Exact values will vary — confirm the shape is correct and no 500 error.)

- [ ] **Step 3: Test empty query returns 400**

```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query":""}'
```

Expected: `{"error":"Query is required"}` with HTTP 400.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/recommend/route.ts
git commit -m "feat: add /api/recommend POST route"
```

---

## Task 6: Wire HomePageClient.tsx — NL Search UI

**Files:**
- Modify: `src/app/HomePageClient.tsx`

This task replaces the entire file. The key changes from the current version:

1. `MappedRestaurant` type gains `isFeatured: boolean`
2. DB mapping includes `isFeatured`
3. Existing `scoredRestaurants` useMemo renamed to `moodResults`, still works the same
4. New `allRestaurants` useMemo (no scoring, used by NL search)
5. New state: `isSearching`, `nlResults`
6. `handleSearch` async function calls `/api/recommend`, then `rankRestaurants`
7. Mood chip click clears NL results
8. Results section renders from `nlResults` when present, `moodResults` otherwise
9. `RestaurantCard` gains optional `explanation` prop and renders it as an amber chip

- [ ] **Step 1: Replace src/app/HomePageClient.tsx**

```tsx
"use client";

import { useState, useMemo } from "react";
import { MapPin, Sparkles, Star, Loader2 } from "lucide-react";
import {
  moodProfiles,
  calculateMatchScore,
} from "@/data/mockRestaurants";
import {
  rankRestaurants,
  type ScoredRestaurant,
  type RankResult,
  type RestaurantInput,
} from "@/lib/recommendEngine";
import { parseQueryWithKeywords } from "@/lib/queryParser";
import { Restaurant as DbRes } from "@prisma/client";
import Link from "next/link";

const moodChips = Object.keys(moodProfiles);

export default function HomePageClient({
  dbRestaurants,
}: {
  dbRestaurants: DbRes[];
}) {
  const [selectedMood, setSelectedMood] = useState<string>("Romantic");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [nlResults, setNlResults] = useState<RankResult | null>(null);

  // All restaurants mapped from DB — no scoring applied
  const allRestaurants = useMemo<RestaurantInput[]>(
    () =>
      dbRestaurants.map((r) => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        location: r.locationArea,
        description: r.description,
        priceLevel: r.priceLevel,
        imageUrl: r.imageUrl || "",
        averageRating: r.averageRating || 0,
        reviewCount: r.reviewCount || 0,
        isFeatured: r.isFeatured,
        vibe: {
          intimacy: r.vibeIntimacy,
          energy: r.vibeEnergy,
          formality: r.vibeFormality,
          noise: r.vibeNoise,
          outdoorsy: r.vibeOutdoorsy,
        },
      })),
    [dbRestaurants]
  );

  // Mood-chip based scoring (existing behaviour)
  const moodResults = useMemo(() => {
    const profile = moodProfiles[selectedMood];
    if (!profile) return allRestaurants.map((r) => ({ ...r, matchScore: 0, explanation: "" }));
    return allRestaurants
      .map((r) => ({
        ...r,
        matchScore: calculateMatchScore(r.vibe, profile),
        explanation: "",
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .filter((r) => r.matchScore >= 40);
  }, [selectedMood, allRestaurants]);

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      const intent = data.intent ?? parseQueryWithKeywords(q);
      setNlResults(rankRestaurants(allRestaurants, intent));
    } catch {
      const intent = parseQueryWithKeywords(q);
      setNlResults(rankRestaurants(allRestaurants, intent));
    } finally {
      setIsSearching(false);
    }
  }

  function handleMoodSelect(mood: string) {
    setSelectedMood(mood);
    setNlResults(null);
    setSearchQuery("");
  }

  const displayedResults = nlResults ? nlResults.restaurants : moodResults;
  const isAlternatives = nlResults?.hasAlternatives ?? false;

  const sectionTitle = nlResults
    ? isAlternatives
      ? "Best alternatives for your search"
      : `Results for "${searchQuery}"`
    : `Perfect for ${selectedMood}`;

  return (
    <main className="flex-1 flex flex-col w-full">
      {/* Hero Section */}
      <section className="bg-cream pt-24 pb-16 px-6 sm:px-12 lg:px-24 border-b border-rust/10 w-full">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="font-cormorant text-5xl sm:text-6xl md:text-7xl font-semibold text-ink leading-tight">
            Find the perfect spot for{" "}
            <span className="italic text-rust">your mood</span>
          </h1>
          <p className="text-lg text-sage font-light max-w-2xl mx-auto">
            Not just what's nearby. Discover restaurants that match the exact
            vibe you're looking for right now.
          </p>

          <div className="relative max-w-2xl mx-auto mt-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Sparkles className="h-5 w-5 text-gold" />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-36 py-4 rounded-full border border-rust/20 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-transparent text-ink placeholder:text-sage/60 transition-all font-outfit"
              placeholder="e.g., romantic date night, quiet café for studying..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="absolute inset-y-2 right-2 bg-rust text-cream px-6 rounded-full font-medium hover:bg-rust/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                "Find Vibe"
              )}
            </button>
          </div>

          <div className="pt-8">
            <p className="text-sm text-sage/80 mb-4 uppercase tracking-widest font-dm-mono">
              Or quick select
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {moodChips.map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleMoodSelect(mood)}
                  className={`px-5 py-2 rounded-full text-sm transition-all duration-300 font-medium ${
                    selectedMood === mood && !nlResults
                      ? "bg-ink text-cream shadow-md"
                      : "bg-white border border-rust/10 text-ink hover:border-rust/30 hover:bg-cream"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-6 sm:px-12 lg:px-24 bg-[#FAF7F2] w-full flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-cormorant text-3xl font-semibold text-ink">
                <span className="italic text-rust">{sectionTitle}</span>
              </h2>
              <p className="text-sage mt-2">
                {isAlternatives
                  ? "No exact matches — showing the closest picks"
                  : `Showing ${displayedResults.length} tailored recommendations`}
              </p>
            </div>
            {nlResults && (
              <button
                onClick={() => {
                  setNlResults(null);
                  setSearchQuery("");
                }}
                className="text-sm text-sage hover:text-rust transition-colors underline"
              >
                Clear search
              </button>
            )}
          </div>

          {displayedResults.length === 0 && !isSearching && (
            <div className="text-center py-24 text-sage">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gold/40" />
              <p className="text-lg font-cormorant">No restaurants found for this vibe.</p>
              <p className="text-sm mt-2">Try a different mood or search query.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayedResults.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                explanation={(restaurant as ScoredRestaurant).explanation || ""}
                showExplanation={!!nlResults}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

type CardRestaurant = RestaurantInput & { matchScore: number };

function RestaurantCard({
  restaurant,
  explanation,
  showExplanation,
}: {
  restaurant: CardRestaurant;
  explanation: string;
  showExplanation: boolean;
}) {
  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-400 border border-rust/5 hover:-translate-y-1"
    >
      <div className="relative h-60 overflow-hidden bg-gray-100">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-rust shadow-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          {restaurant.matchScore}% Match
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-cormorant text-2xl font-semibold text-ink leading-tight mb-1">
          {restaurant.name}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3.5 h-3.5 text-gold fill-gold" />
          <span className="text-xs font-medium text-ink">
            {restaurant.averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-sage">
            ({restaurant.reviewCount} reviews)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sage mb-4 font-dm-mono">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {restaurant.location}
          </span>
          <span>•</span>
          <span>{restaurant.cuisine}</span>
          <span>•</span>
          <span className="font-semibold text-ink">{restaurant.priceLevel}</span>
        </div>

        <p className="text-ink/70 text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
          {restaurant.description}
        </p>

        {showExplanation && explanation && (
          <div className="mt-2 mb-4 bg-gold/10 border border-gold/20 rounded-xl px-3 py-2.5">
            <p className="text-xs text-ink/80 leading-relaxed">
              <span className="font-semibold text-gold mr-1">✦ Why this?</span>
              {explanation}
            </p>
          </div>
        )}

        <div className="space-y-2.5 pt-4 border-t border-rust/10 mt-auto">
          <VibeBar label="Intimacy" value={restaurant.vibe.intimacy} />
          <VibeBar label="Energy" value={restaurant.vibe.energy} />
          <VibeBar label="Formality" value={restaurant.vibe.formality} />
        </div>
      </div>
    </Link>
  );
}

function VibeBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="w-20 text-sage font-medium">{label}</span>
      <div className="flex-1 h-1.5 bg-cream rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Start dev server and test manually**

```bash
npm run dev
```

Open http://localhost:3000 in a browser. Test the following queries:

| Query | Expected top result |
|-------|-------------------|
| `romantic date night dinner` | Chez Lumière, Sakura Garden, or The Moonlit Table |
| `birthday celebration place` | Summit Hotel Roof Garden, Dwarika's Heritage Bar, or Krishnarpan |
| `quiet café for studying` | The Reading Room Café or Himal Lounge |
| `group hangout with friends` | Himalayan Brewhouse, The Masala Table, or Namaste Rooftop |
| `family-friendly restaurant` | Thakali Kitchen, Bhojan Griha, or Roadhouse Café |
| `luxury fine dining experience` | Krishnarpan, Chez Lumière, or Dwarika's Heritage Bar |

Verify each card shows the amber "✦ Why this?" chip with an explanation.

- [ ] **Step 4: Test edge cases**

- Type `nice place` → should show results (not empty)
- Type a query and click "Clear search" → should return to mood-chip view
- Click any mood chip while in NL mode → should clear NL results
- Type `cheap luxury restaurant` → should show luxury results (Gemini resolves conflict)
- Submit empty query → button should stay disabled

- [ ] **Step 5: Commit**

```bash
git add src/app/HomePageClient.tsx
git commit -m "feat: wire NL search UI with Gemini recommendations and explanation chips"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass, no failures.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: Build completes without errors. If there are errors, fix them before proceeding.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete AI-powered natural language recommendation engine"
```

---

## Running Locally

```bash
# 1. Add your Gemini API key
echo 'GEMINI_API_KEY=your_actual_key' >> .env

# 2. Generate Prisma client
npx prisma generate

# 3. Seed the database (if empty)
npx prisma db seed

# 4. Start dev server
npm run dev
```

Open http://localhost:3000 — type any natural language query and click "Find Vibe".

---

## New Dependencies

None — `@google/genai` was already installed. Only `vitest` is added as a dev dependency.
