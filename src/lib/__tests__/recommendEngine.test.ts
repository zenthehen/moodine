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

// Mid-scoring restaurant — close enough to score in the 70s so bonuses are visible
const midMatchRestaurant: RestaurantInput = {
  id: "3",
  name: "Olive Garden Terrace",
  cuisine: "Mediterranean",
  location: "Durbar Marg",
  description: "Rooftop garden with fairy lights.",
  priceLevel: "$$$$",
  imageUrl: "",
  vibe: { intimacy: 8, energy: 3, formality: 7, noise: 3, outdoorsy: 9 },
  averageRating: 4.3,
  reviewCount: 98,
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
    const withBudget = scoreRestaurant(midMatchRestaurant, romanticIntent);
    const noBudgetIntent: ParsedIntent = { ...romanticIntent, budgetHint: null };
    const withoutBudget = scoreRestaurant(midMatchRestaurant, noBudgetIntent);
    expect(withBudget).toBeGreaterThan(withoutBudget);
  });

  it("caps score at 100", () => {
    const score = scoreRestaurant(highMatchRestaurant, romanticIntent);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("adds featured bonus for featured restaurants", () => {
    const featured = { ...midMatchRestaurant, isFeatured: true };
    const featuredScore = scoreRestaurant(featured, romanticIntent);
    const unfeaturedScore = scoreRestaurant(midMatchRestaurant, romanticIntent);
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
