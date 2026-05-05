"use client";

import { useState } from "react";
import { submitRestaurant } from "@/app/actions/restaurant";
import { Utensils, MapPin, Image as ImageIcon, CheckCircle, Users, Clock } from "lucide-react";
import Link from "next/link";

export default function OwnerSubmitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await submitRestaurant(formData);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Failed to submit. Please fill all required fields.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <main className="flex-1 flex items-center justify-center bg-cream px-6 py-24">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-sm border border-rust/10 text-center">
          <CheckCircle className="w-16 h-16 text-sage mx-auto mb-6" />
          <h1 className="font-cormorant text-3xl font-semibold text-ink mb-4">Submission Received!</h1>
          <p className="text-sage mb-8">Our editorial team will review your listing, set the Vibe Dimensions, and publish it shortly.</p>
          <Link href="/" className="inline-block bg-rust text-cream px-8 py-3 rounded-full font-medium hover:bg-rust/90 transition-colors">Return Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-cream py-16 px-6 sm:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="font-cormorant text-4xl sm:text-5xl font-semibold text-ink mb-4">
            List your restaurant on <span className="italic text-rust">Moodine</span>
          </h1>
          <p className="text-sage text-lg">Join Kathmandu's premium mood-based dining discovery platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-rust/10 space-y-10">
          {/* Section 1 — Basic Info */}
          <div>
            <h2 className="font-cormorant text-2xl font-semibold text-ink mb-6 pb-3 border-b border-rust/10">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput icon={<Utensils />} label="Restaurant Name" name="name" placeholder="e.g. Chez Lumière" required />
              <FormInput label="Cuisine Type" name="cuisine" placeholder="e.g. French Continental" required />
              <FormInput icon={<MapPin />} label="Street Address" name="address" placeholder="Full address" required className="md:col-span-2" />
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink font-dm-mono uppercase tracking-wide">Location Area</label>
                <select required name="locationArea" className="w-full px-4 py-3 rounded-xl border border-rust/20 bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all">
                  <option value="">Select area…</option>
                  {["Thamel","Lazimpat","Patan","Boudha","Durbar Marg","Baneshwor","Pokhara"].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink font-dm-mono uppercase tracking-wide">Price Level</label>
                <select required name="priceLevel" className="w-full px-4 py-3 rounded-xl border border-rust/20 bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all">
                  <option value="$">$ — Budget</option>
                  <option value="$$">$$ — Mid-range</option>
                  <option value="$$$">$$$ — Upscale</option>
                  <option value="$$$$">$$$$ — Fine Dining</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2 — Capacity & Pricing */}
          <div>
            <h2 className="font-cormorant text-2xl font-semibold text-ink mb-6 pb-3 border-b border-rust/10">Capacity & Menu Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput icon={<Users />} label="Seating Capacity" name="capacity" type="number" placeholder="e.g. 80" />
              <FormInput label="Min Menu Price (NPR)" name="minPrice" type="number" placeholder="e.g. 400" />
              <FormInput label="Max Menu Price (NPR)" name="maxPrice" type="number" placeholder="e.g. 2500" />
            </div>
          </div>

          {/* Section 3 — Hours */}
          <div>
            <h2 className="font-cormorant text-2xl font-semibold text-ink mb-6 pb-3 border-b border-rust/10">Opening Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput icon={<Clock />} label="Opening Time" name="openingTime" type="time" defaultValue="10:00" />
              <FormInput icon={<Clock />} label="Closing Time" name="closingTime" type="time" defaultValue="22:00" />
            </div>
          </div>

          {/* Section 4 — Amenities */}
          <div>
            <h2 className="font-cormorant text-2xl font-semibold text-ink mb-6 pb-3 border-b border-rust/10">Amenities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink font-dm-mono uppercase tracking-wide">Menu Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isVeg" value="mixed" defaultChecked className="accent-rust" /> Mixed (Veg + Non-Veg)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isVeg" value="veg" className="accent-rust" /> Full Vegetarian
                  </label>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold text-ink font-dm-mono uppercase tracking-wide">Parking Availability</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="parkingTwoWheeler" className="w-4 h-4 accent-rust rounded" />
                  <span>2-Wheeler Parking</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="parkingFourWheeler" className="w-4 h-4 accent-rust rounded" />
                  <span>4-Wheeler / Car Parking</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 5 — Media & Description */}
          <div>
            <h2 className="font-cormorant text-2xl font-semibold text-ink mb-6 pb-3 border-b border-rust/10">Photos & Description</h2>
            <div className="space-y-6">
              <FormInput icon={<ImageIcon />} label="Cover Photo URL (Unsplash or direct link)" name="imageUrl" type="url" placeholder="https://images.unsplash.com/..." />
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink font-dm-mono uppercase tracking-wide">Description & Vibe</label>
                <textarea required name="description" rows={4} className="w-full px-4 py-3 rounded-xl border border-rust/20 bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all" placeholder="Describe the atmosphere, the crowd, and what makes your place special…" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-ink text-cream py-4 rounded-xl font-semibold text-lg hover:bg-ink/90 transition-all disabled:opacity-50">
            {isSubmitting ? "Submitting…" : "Submit for Editorial Review"}
          </button>
        </form>
      </div>
    </main>
  );
}

function FormInput({ label, name, type = "text", placeholder, required, icon, className, defaultValue }: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; icon?: React.ReactNode; className?: string; defaultValue?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <label className="text-xs font-semibold text-ink font-dm-mono uppercase tracking-wide">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-3.5 w-4 h-4 text-sage/50 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
        <input required={required} name={name} type={type} placeholder={placeholder} defaultValue={defaultValue}
          className={`w-full ${icon ? "pl-10" : "px-4"} pr-4 py-3 rounded-xl border border-rust/20 bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all`} />
      </div>
    </div>
  );
}
