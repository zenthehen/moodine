# Natural Language Restaurant Recommendation Engine

**Date:** 2026-05-05  
**Project:** Moodine — Restaurant Recommendation System  
**Status:** Approved

---

## Overview

Upgrade Moodine's decorative search bar into a working AI-powered natural language recommendation engine. Users type freeform queries ("romantic date night dinner", "quiet café for studying") and receive ranked restaurant results with a per-card explanation of why each was recommended.

Architecture: **Gemini parses intent once → local engine scores & ranks → template logic generates explanations.**

---

## Architecture & Data Flow

### 1. ParsedIntent (Gemini output schema)

```ts
type ParsedIntent = {
  vibeProfile: {
    intimacy: number;   // 1-10
    energy: number;
    formality: number;
    noise: number;
    outdoorsy: number;
  };
  occasion: string;              // "date", "birthday", "business", "party", "study", "hangout", "family", "general"
  budgetHint: "$" | "$$" | "$$$" | "$$$$" | null;
  groupContext: "solo" | "couple" | "family" | "friends" | "colleagues";
  atmosphereKeywords: string[];  // up to 4 tags e.g. ["quiet", "outdoor", "candlelit"]
  rawIntent: string;             // ≤8-word summary e.g. "romantic candlelit dinner for two"
};
```

### 2. API Route — `POST /api/recommend`

- Accepts `{ query: string }`
- Sends query to Gemini with a structured prompt instructing it to return `ParsedIntent` as JSON
- Returns `{ intent: ParsedIntent }` to the client
- On Gemini failure: returns `{ intent: null, error: "parse_failed" }` so client can fall back

### 3. Scoring Engine — `src/lib/recommendEngine.ts`

Scoring per restaurant (all computed client-side):

| Signal | Points |
|---|---|
| Vibe match (existing `calculateMatchScore`) | 0–100 (base) |
| Budget match | +10 |
| Rating ≥ 4.5 | +5 |
| Rating ≥ 4.8 | +8 (replaces above) |
| Featured restaurant | +3 |

Final score is capped at 100. Restaurants sorted descending. Threshold: score ≥ 35 shown. If zero results pass threshold, show top 3 regardless.

### 4. Explanation Generator — `src/lib/recommendEngine.ts`

Template-based, no second API call. Composed from `ParsedIntent` fields:

> "Recommended for your **{occasion}** — {top vibe trait}, {second vibe trait}, and {cuisine}. {budget line if applicable}."

Examples:
- "Recommended for your **date night** — deeply intimate, very quiet, and fine French dining. Mid-range pricing."
- "A great pick for your **group hangout** — high energy, lively atmosphere, and vibrant Indian street food."

Vibe traits are derived by comparing the restaurant's dimension scores against the parsed intent: whichever 2 dimensions have the smallest absolute difference are called out as "matches."

---

## Files

### New
- `src/app/api/recommend/route.ts` — Gemini parsing endpoint
- `src/lib/geminiParser.ts` — Gemini prompt construction + response parsing
- `src/lib/recommendEngine.ts` — scoring function + explanation generator

### Modified
- `src/app/HomePageClient.tsx` — wire search bar submit → `/api/recommend` → scored results with explanation chips
- `.env` — add `GEMINI_API_KEY=...` (user must fill in)

### Unchanged
- `prisma/schema.prisma` — no DB changes
- `src/data/mockRestaurants.ts` — no changes
- All auth, review, admin, owner pages — untouched

---

## UI Behaviour

### Search flow
1. User types query, presses Enter or clicks "Find Vibe"
2. Button shows spinner, results section shows skeleton loaders
3. On response: results update, each card gains a `"Why recommended"` amber chip with explanation text
4. Mood chip quick-select still works as before (no API call, instant)

### Result card additions
- Amber `"Why recommended"` pill below the match score badge
- Explanation text (1 sentence) below restaurant description

### Edge cases
| Scenario | Behaviour |
|---|---|
| Vague query ("nice place") | Gemini returns balanced mid-range profile; top 6 shown |
| Conflicting request ("cheap luxury") | Gemini resolves toward luxury (formality/intimacy high), budget hint set to null |
| No results above threshold | Top 3 shown with label "Best alternatives for your search" |
| Gemini API failure | Keyword fallback in `geminiParser.ts`; results shown without explanation chip |
| Empty query submitted | No API call; show validation message |

---

## Dependencies

No new npm packages needed. `@google/genai` is already in `package.json`.

---

## Out of Scope

- Persisting search history
- User preference profiles
- Location-based filtering (coordinates exist but not used for ranking)
- Multiple language support
