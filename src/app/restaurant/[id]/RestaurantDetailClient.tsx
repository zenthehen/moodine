"use client";

import { useState } from "react";
import { Restaurant } from "@prisma/client";
import {
  MapPin, Clock, Users, Star, Utensils, Heart,
  ParkingCircle, Leaf, ArrowLeft, CheckCircle2, Phone,
  TrendingUp, Bike, CarFront
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const RestaurantMap = dynamic(() => import("@/components/RestaurantMap"), { ssr: false });

type ReviewWithUser = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user: { name: string };
};

export default function RestaurantDetailClient({ 
  restaurant, 
  currentUserId 
}: { 
  restaurant: Restaurant & { reviews?: ReviewWithUser[] };
  currentUserId?: string;
}) {
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [booked, setBooked] = useState(false);
  
  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState<ReviewWithUser[]>(restaurant.reviews || []);

  function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setBooked(true);
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) return;
    
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      
      const data = await res.json();
      if (res.ok && data.review) {
        setReviews([data.review, ...reviews]);
        setReviewComment("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const vibeDimensions = [
    { label: "Intimacy", value: restaurant.vibeIntimacy },
    { label: "Energy", value: restaurant.vibeEnergy },
    { label: "Formality", value: restaurant.vibeFormality },
    { label: "Noise Level", value: restaurant.vibeNoise },
    { label: "Outdoorsy", value: restaurant.vibeOutdoorsy },
  ];

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      {/* Hero Image */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        <img
          src={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200"}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 bg-white/20 backdrop-blur-md text-cream px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        {restaurant.isFeatured && (
          <div className="absolute top-6 right-6 bg-gold text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold shadow">
            ★ Editor's Pick
          </div>
        )}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full font-bold font-dm-mono ${restaurant.isVeg ? "bg-sage text-cream" : "bg-rust text-cream"}`}>
              {restaurant.isVeg ? "🌿 Full Vegetarian" : "🍖 Mixed Menu"}
            </span>
          </div>
          <h1 className="font-cormorant text-4xl sm:text-5xl font-bold text-cream drop-shadow-sm leading-tight">{restaurant.name}</h1>
          <p className="text-cream/80 mt-1 font-light text-lg">{restaurant.cuisine} · {restaurant.locationArea}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT: Details */}
        <div className="lg:col-span-2 space-y-10">
          {/* Rating + Quick Stats */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-rust/5">
            <div className="flex flex-wrap gap-6 items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center">
                  <Star className="w-7 h-7 text-gold fill-gold" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-ink">{(restaurant.averageRating ?? 0).toFixed(1)}</p>
                  <p className="text-sage text-sm">{restaurant.reviewCount ?? 0} reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-rust/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-rust" />
                </div>
                <div>
                  <p className="text-xl font-bold text-ink">{restaurant.capacity ?? "—"}</p>
                  <p className="text-sage text-sm">Seating capacity</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-sage/10 rounded-2xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-sage" />
                </div>
                <div>
                  <p className="text-xl font-bold text-ink">{restaurant.openingTime ?? "10:00"} – {restaurant.closingTime ?? "22:00"}</p>
                  <p className="text-sage text-sm">Opening hours</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3 text-ink">
                <MapPin className="w-4 h-4 text-rust mt-0.5 shrink-0" />
                <span>{restaurant.address}</span>
              </div>
              {restaurant.minPrice && restaurant.maxPrice && (
                <div className="flex items-start gap-3 text-ink">
                  <TrendingUp className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                  <span>Menu price range: <strong>Rs. {restaurant.minPrice.toLocaleString()} – Rs. {restaurant.maxPrice.toLocaleString()}</strong> per person</span>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-rust/5">
            <h2 className="font-cormorant text-2xl font-semibold text-ink mb-4">About</h2>
            <p className="text-ink/75 leading-relaxed text-base">{restaurant.description}</p>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-rust/5">
            <h2 className="font-cormorant text-2xl font-semibold text-ink mb-6">Amenities & Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <AmenityChip icon={<Bike className="w-5 h-5" />} label="2-Wheeler Parking" active={restaurant.parkingTwoWheeler} />
              <AmenityChip icon={<CarFront className="w-5 h-5" />} label="4-Wheeler Parking" active={restaurant.parkingFourWheeler ?? false} />
              <AmenityChip icon={<Leaf className="w-5 h-5" />} label="Full Vegetarian" active={restaurant.isVeg} />
              <AmenityChip icon={<Utensils className="w-5 h-5" />} label="Mixed Menu" active={!restaurant.isVeg} />
              <AmenityChip icon={<Users className="w-5 h-5" />} label={`Seats ${restaurant.capacity ?? "N/A"}`} active={true} />
              <AmenityChip icon={<Clock className="w-5 h-5" />} label="Reservations" active={true} />
            </div>
          </div>

          {/* Vibe Profile */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-rust/5">
            <h2 className="font-cormorant text-2xl font-semibold text-ink mb-6">Vibe Profile</h2>
            <div className="space-y-5">
              {vibeDimensions.map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-sm font-medium text-ink mb-2">
                    <span>{d.label}</span>
                    <span className="text-sage">{d.value}/10</span>
                  </div>
                  <div className="h-2 bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gold to-rust rounded-full" style={{ width: `${d.value * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Map Section */}
          <div className="pt-4 border-t border-rust/10 mt-6 mb-6">
            <h3 className="font-cormorant text-xl font-semibold text-ink mb-4">Location</h3>
            <RestaurantMap 
              name={restaurant.name} 
              address={restaurant.address} 
              lat={restaurant.latitude ?? (27.7172 + (Math.random() * 0.01))} 
              lng={restaurant.longitude ?? (85.3240 + (Math.random() * 0.01))} 
            />
          </div>


          {/* Reviews Section */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-rust/5">
            <h2 className="font-cormorant text-2xl font-semibold text-ink mb-6">Reviews</h2>
            
            {/* Review Form */}
            {currentUserId ? (
              <form onSubmit={handleReviewSubmit} className="mb-8 p-6 bg-cream/50 rounded-2xl border border-rust/10">
                <h4 className="font-medium text-ink mb-4">Leave a Review</h4>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      type="button" 
                      key={star} 
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star className={`w-6 h-6 ${reviewRating >= star ? "text-gold fill-gold" : "text-sage/30"}`} />
                    </button>
                  ))}
                </div>
                <textarea 
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..." 
                  className="w-full bg-white border border-rust/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[100px] mb-4"
                />
                <button 
                  type="submit" 
                  disabled={isSubmittingReview}
                  className="bg-rust text-cream px-6 py-2 rounded-xl text-sm font-medium hover:bg-rust/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="mb-8 p-6 bg-cream/50 rounded-2xl border border-rust/10 flex items-center justify-between">
                <span className="text-sage text-sm">Sign in to leave a review.</span>
                <Link href="/login" className="bg-ink text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">Sign In</Link>
              </div>
            )}

            {/* Review List */}
            <div className="space-y-6">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="border-b border-rust/10 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-ink">{review.user.name}</span>
                    <span className="text-xs text-sage">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-gold fill-gold" : "text-sage/30"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-ink/80 leading-relaxed">{review.comment}</p>
                </div>
              )) : (
                <p className="text-sage text-sm text-center py-8">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Booking */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <div className="bg-white rounded-3xl shadow-md border border-rust/10 overflow-hidden">
              <div className="bg-ink px-8 py-6">
                <h3 className="font-cormorant text-2xl text-cream font-semibold">Reserve a Table</h3>
                <p className="text-cream/60 text-sm mt-1">{restaurant.name}</p>
              </div>

              {booked ? (
                <div className="p-8 text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-sage mx-auto" />
                  <h4 className="font-cormorant text-2xl font-semibold text-ink">Reservation Confirmed!</h4>
                  <p className="text-sage text-sm">
                    Your table for <strong>{partySize}</strong> on <strong>{date}</strong> at <strong>{time}</strong> has been noted. The restaurant will contact you at <strong>{phone}</strong> to confirm.
                  </p>
                  <button onClick={() => setBooked(false)} className="text-rust text-sm underline">Make another reservation</button>
                </div>
              ) : (
                <form onSubmit={handleBook} className="p-8 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-dm-mono uppercase tracking-widest text-sage font-semibold">Your Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Full name" className="w-full border border-rust/20 bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-dm-mono uppercase tracking-widest text-sage font-semibold">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-sage/50" />
                      <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+977 98XXXXXXXX" className="w-full pl-9 border border-rust/20 bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-dm-mono uppercase tracking-widest text-sage font-semibold">Date</label>
                    <input required value={date} onChange={e => setDate(e.target.value)} type="date" min={new Date().toISOString().split("T")[0]} className="w-full border border-rust/20 bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-dm-mono uppercase tracking-widest text-sage font-semibold">Time</label>
                    <div className="relative">
                      <select 
                        required 
                        value={time} 
                        onChange={e => setTime(e.target.value)}
                        className="w-full border border-rust/20 bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 appearance-none cursor-pointer"
                      >
                        <option value="">Select a time</option>
                        {generateTimeSlots(restaurant.openingTime, restaurant.closingTime).map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    <p className="text-xs text-sage/70">Open {restaurant.openingTime} – {restaurant.closingTime}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-dm-mono uppercase tracking-widest text-sage font-semibold">Party Size</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-10 h-10 rounded-full border border-rust/20 bg-cream flex items-center justify-center text-lg hover:bg-rust hover:text-cream transition-colors">−</button>
                      <span className="text-2xl font-cormorant font-semibold text-ink w-8 text-center">{partySize}</span>
                      <button type="button" onClick={() => setPartySize(Math.min(restaurant.capacity || 20, partySize + 1))} className="w-10 h-10 rounded-full border border-rust/20 bg-cream flex items-center justify-center text-lg hover:bg-rust hover:text-cream transition-colors">+</button>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-rust text-cream py-4 rounded-xl font-semibold text-base hover:bg-rust/90 transition-all mt-2">
                    Confirm Reservation
                  </button>
                  <p className="text-center text-xs text-sage/70">No payment required to reserve</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function AmenityChip({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all ${active ? "bg-cream border-rust/20 text-ink" : "bg-gray-50 border-gray-100 text-sage/50 line-through"}`}>
      <span className={active ? "text-rust" : "text-sage/30"}>{icon}</span>
      {label}
    </div>
  );
}

function generateTimeSlots(start: string, end: string) {
  const slots = [];
  let current = new Date(`2000-01-01T${start}:00`);
  const stop = new Date(`2000-01-01T${end}:00`);

  // Handle cases where closing time is past midnight
  if (stop <= current) {
    stop.setDate(stop.getDate() + 1);
  }

  while (current <= stop) {
    slots.push(current.toTimeString().substring(0, 5));
    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
}
