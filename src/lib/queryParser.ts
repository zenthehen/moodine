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
  ["romantic",    { intimacy: 9, energy: 2, formality: 7, noise: 2, occasion: "date night" }],
  ["date",        { intimacy: 8, energy: 3, formality: 7, noise: 3, occasion: "date night", groupContext: "couple" }],
  ["birthday",    { intimacy: 6, energy: 7, formality: 6, noise: 5, occasion: "birthday celebration" }],
  ["celebration", { intimacy: 6, energy: 7, formality: 7, noise: 5, occasion: "celebration" }],
  ["anniversary", { intimacy: 9, energy: 3, formality: 8, noise: 2, occasion: "anniversary dinner", groupContext: "couple" }],
  ["business",    { intimacy: 4, formality: 9, energy: 2, noise: 2, occasion: "business meeting", groupContext: "colleagues" }],
  ["meeting",     { intimacy: 4, formality: 8, energy: 2, noise: 2, occasion: "business meeting", groupContext: "colleagues" }],
  ["family",      { intimacy: 3, energy: 7, formality: 2, noise: 7, groupContext: "family", occasion: "family outing" }],
  ["kids",        { energy: 7, formality: 1, noise: 7, groupContext: "family" }],
  ["friends",     { intimacy: 2, energy: 8, formality: 2, noise: 7, groupContext: "friends", occasion: "group hangout" }],
  ["group",       { intimacy: 2, energy: 8, formality: 2, noise: 7, occasion: "group hangout" }],
  ["party",       { intimacy: 1, energy: 9, formality: 2, noise: 9, occasion: "party" }],
  ["study",       { energy: 2, formality: 2, noise: 1, occasion: "study session" }],
  ["work",        { energy: 2, formality: 4, noise: 2, occasion: "work session" }],
  ["café",        { intimacy: 6, energy: 2, formality: 2, noise: 2, occasion: "café visit" }],
  ["cafe",        { intimacy: 6, energy: 2, formality: 2, noise: 2, occasion: "café visit" }],
  ["coffee",      { intimacy: 5, energy: 2, formality: 2, noise: 2 }],
  ["solo",        { intimacy: 6, energy: 2, groupContext: "solo", occasion: "solo dining" }],
  ["couple",      { intimacy: 8, formality: 6, groupContext: "couple" }],
  ["quiet",       { noise: 2, energy: 2 }],
  ["peaceful",    { noise: 2, energy: 2 }],
  ["loud",        { noise: 8, energy: 8 }],
  ["lively",      { energy: 8, noise: 7 }],
  ["outdoor",     { outdoorsy: 8 }],
  ["rooftop",     { outdoorsy: 7, energy: 6 }],
  ["luxury",      { formality: 9, intimacy: 7, budgetHint: "$$$$" }],
  ["fine dining", { formality: 9, intimacy: 8, budgetHint: "$$$$", occasion: "fine dining" }],
  ["fancy",       { formality: 8, intimacy: 7, budgetHint: "$$$" }],
  ["cheap",       { budgetHint: "$" }],
  ["budget",      { budgetHint: "$" }],
  ["affordable",  { budgetHint: "$$" }],
  ["casual",      { formality: 2, energy: 5 }],
  ["cozy",        { intimacy: 7, energy: 2, noise: 2 }],
  ["aesthetic",   { intimacy: 6, formality: 5 }],
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
      if (overrides.occasion)     occasion     = overrides.occasion;
      if (overrides.budgetHint)   budgetHint   = overrides.budgetHint;
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
