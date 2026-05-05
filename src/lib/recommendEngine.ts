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
