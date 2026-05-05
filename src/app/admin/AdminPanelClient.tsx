"use client";

import { useState } from "react";
import { approveRestaurant, blacklistRestaurant, reactivateRestaurant, toggleFeatured } from "@/app/actions/restaurant";
import { Restaurant } from "@prisma/client";
import { Check, XCircle, Star, RotateCcw, Award } from "lucide-react";

type Tab = "PENDING" | "LIVE" | "BLACKLISTED";

export default function AdminPanelClient({ restaurants }: { restaurants: Restaurant[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("PENDING");
  const [selectedRes, setSelectedRes] = useState<Restaurant | null>(null);

  const filteredRestaurants = restaurants.filter(r => r.status === activeTab);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-rust/10 pb-4">
        {(["PENDING", "LIVE", "BLACKLISTED"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${
              activeTab === tab
                ? "bg-ink text-cream"
                : "bg-white text-sage hover:bg-cream border border-rust/10"
            }`}
          >
            {tab} ({restaurants.filter(r => r.status === tab).length})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredRestaurants.length === 0 && (
          <p className="text-sage col-span-full py-12 text-center">No {activeTab.toLowerCase()} restaurants.</p>
        )}
        {filteredRestaurants.map(res => (
          <div 
            key={res.id} 
            onClick={() => setSelectedRes(res)}
            className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-rust/10 hover:shadow-md hover:border-rust/30 transition-all"
          >
            <div className="relative h-40 bg-gray-100">
              {res.imageUrl && (
                <img src={res.imageUrl} alt={res.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              )}
              {res.isFeatured && (
                <div className="absolute top-2 left-2 bg-gold text-white text-xs px-2 py-1 rounded flex items-center gap-1 font-bold">
                  <Award className="w-3 h-3" /> Pick
                </div>
              )}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-ink text-xs px-2 py-1 rounded flex items-center gap-1 font-bold shadow">
                <Star className="w-3 h-3 text-gold fill-gold" /> {(res.averageRating || 0).toFixed(1)}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-cormorant text-xl font-bold text-ink truncate">{res.name}</h3>
              <p className="text-xs text-sage truncate">{res.locationArea} • {res.cuisine}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedRes && (
        <AdminModal 
          restaurant={selectedRes} 
          onClose={() => setSelectedRes(null)} 
        />
      )}
    </div>
  );
}

function AdminModal({ restaurant, onClose }: { restaurant: Restaurant, onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState({
    intimacy: restaurant.vibeIntimacy,
    energy: restaurant.vibeEnergy,
    formality: restaurant.vibeFormality,
    noise: restaurant.vibeNoise,
    outdoorsy: restaurant.vibeOutdoorsy
  });

  async function handleApprove() {
    setIsSubmitting(true);
    await approveRestaurant(restaurant.id, scores);
    setIsSubmitting(false);
    onClose();
  }

  async function handleBlacklist() {
    setIsSubmitting(true);
    await blacklistRestaurant(restaurant.id);
    setIsSubmitting(false);
    onClose();
  }

  async function handleReactivate() {
    setIsSubmitting(true);
    await reactivateRestaurant(restaurant.id);
    setIsSubmitting(false);
    onClose();
  }

  async function handleToggleFeatured() {
    setIsSubmitting(true);
    await toggleFeatured(restaurant.id, restaurant.isFeatured);
    setIsSubmitting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white/90 backdrop-blur p-6 border-b border-rust/10 flex justify-between items-center z-10">
          <h2 className="font-cormorant text-3xl font-semibold text-ink">Restaurant Data</h2>
          <button onClick={onClose} className="p-2 hover:bg-cream rounded-full transition-colors"><XCircle className="w-6 h-6 text-sage" /></button>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Data Column */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-dm-mono text-sage uppercase tracking-widest mb-1">Name</p>
              <p className="font-semibold text-ink text-lg">{restaurant.name}</p>
            </div>
            <div>
              <p className="text-xs font-dm-mono text-sage uppercase tracking-widest mb-1">Details</p>
              <p className="text-ink">{restaurant.cuisine} • {restaurant.priceLevel}</p>
              <p className="text-ink">{restaurant.address} ({restaurant.locationArea})</p>
            </div>
            <div>
              <p className="text-xs font-dm-mono text-sage uppercase tracking-widest mb-1">Description</p>
              <p className="text-sm text-ink leading-relaxed">{restaurant.description}</p>
            </div>
            <div>
              <p className="text-xs font-dm-mono text-sage uppercase tracking-widest mb-1">Performance</p>
              <p className="text-ink font-medium"><Star className="w-4 h-4 inline text-gold fill-gold mr-1"/> {restaurant.averageRating || 0} average ({restaurant.reviewCount || 0} reviews)</p>
            </div>
            
            {restaurant.status === "LIVE" && (
              <div className="pt-4 border-t border-rust/10 flex gap-4 flex-wrap">
                <button 
                  onClick={handleToggleFeatured} disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg font-medium text-sm border transition-all ${restaurant.isFeatured ? 'bg-gold/10 border-gold text-gold hover:bg-gold/20' : 'bg-white border-rust/20 text-sage hover:bg-cream'}`}
                >
                  <Award className="w-4 h-4 inline mr-2" />
                  {restaurant.isFeatured ? "Remove Editor's Pick" : "Make Editor's Pick"}
                </button>
                <button 
                  onClick={handleBlacklist} disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200"
                >
                  <XCircle className="w-4 h-4 inline mr-2" />
                  Blacklist
                </button>
              </div>
            )}

            {restaurant.status === "BLACKLISTED" && (
              <div className="pt-4 border-t border-rust/10">
                <button 
                  onClick={handleReactivate} disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-green-50 text-green-700 hover:bg-green-100 transition-all border border-green-200"
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" />
                  Reactivate Listing
                </button>
              </div>
            )}
          </div>

          {/* Vibe Editor Column */}
          <div className="bg-cream p-6 rounded-2xl border border-rust/10 h-fit">
            <h3 className="font-cormorant text-2xl font-semibold text-ink mb-2">Vibe Dimensions</h3>
            <p className="text-xs text-sage mb-8 font-dm-mono">Adjust values before approving or updating.</p>

            <div className="space-y-6 mb-8">
              <VibeSlider label="Intimacy" value={scores.intimacy} onChange={(val) => setScores(s => ({ ...s, intimacy: val }))} />
              <VibeSlider label="Energy" value={scores.energy} onChange={(val) => setScores(s => ({ ...s, energy: val }))} />
              <VibeSlider label="Formality" value={scores.formality} onChange={(val) => setScores(s => ({ ...s, formality: val }))} />
              <VibeSlider label="Noise" value={scores.noise} onChange={(val) => setScores(s => ({ ...s, noise: val }))} />
              <VibeSlider label="Outdoorsy" value={scores.outdoorsy} onChange={(val) => setScores(s => ({ ...s, outdoorsy: val }))} />
            </div>

            {(restaurant.status === "PENDING" || restaurant.status === "LIVE") && (
               <button 
                onClick={handleApprove}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-rust text-cream py-3 rounded-xl font-semibold hover:bg-rust/90 transition-all disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                {restaurant.status === "PENDING" ? "Approve & Publish" : "Update Vibe Scores"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VibeSlider({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-semibold text-ink font-dm-mono uppercase">
        <span>{label}</span>
        <span className="text-rust">{value}/10</span>
      </div>
      <input 
        type="range" 
        min="1" 
        max="10" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-rust h-1.5 bg-white border border-rust/10 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
