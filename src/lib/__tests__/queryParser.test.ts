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
