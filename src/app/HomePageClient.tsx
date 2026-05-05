"use client";

import { useState, useMemo } from "react";
import { MapPin, Sparkles, Star, Loader2 } from "lucide-react";
import { moodProfiles, calculateMatchScore } from "@/data/mockRestaurants";
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
    if (!profile)
      return allRestaurants.map((r) => ({ ...r, matchScore: 0, explanation: "" }));
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
          <span className="text-xs text-sage">({restaurant.reviewCount} reviews)</span>
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
