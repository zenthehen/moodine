"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitRestaurant(formData: FormData) {
  const name = formData.get("name") as string;
  const cuisine = formData.get("cuisine") as string;
  const address = formData.get("address") as string;
  const locationArea = formData.get("locationArea") as string;
  const description = formData.get("description") as string;
  const priceLevel = formData.get("priceLevel") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const capacity = parseInt(formData.get("capacity") as string) || null;
  const minPrice = parseInt(formData.get("minPrice") as string) || null;
  const maxPrice = parseInt(formData.get("maxPrice") as string) || null;
  const openingTime = formData.get("openingTime") as string || "10:00";
  const closingTime = formData.get("closingTime") as string || "22:00";
  const parkingTwoWheeler = formData.get("parkingTwoWheeler") === "on";
  const parkingFourWheeler = formData.get("parkingFourWheeler") === "on";
  const isVeg = formData.get("isVeg") === "veg";
  const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
  const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;

  if (!name || !cuisine || !address || !locationArea || !description || !priceLevel) {
    throw new Error("Missing required fields");
  }

  await prisma.restaurant.create({
    data: {
      name, cuisine, address, locationArea, description, priceLevel,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
      capacity, minPrice, maxPrice, openingTime, closingTime,
      parkingTwoWheeler, parkingFourWheeler, isVeg,
      latitude, longitude,
      status: "PENDING",
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function approveRestaurant(id: string, vibeScores: {
  intimacy: number; energy: number; formality: number; noise: number; outdoorsy: number;
}) {
  await prisma.restaurant.update({
    where: { id },
    data: {
      status: "LIVE",
      approvedAt: new Date(),
      vibeIntimacy: vibeScores.intimacy,
      vibeEnergy: vibeScores.energy,
      vibeFormality: vibeScores.formality,
      vibeNoise: vibeScores.noise,
      vibeOutdoorsy: vibeScores.outdoorsy,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function blacklistRestaurant(id: string) {
  await prisma.restaurant.update({ where: { id }, data: { status: "BLACKLISTED" } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function reactivateRestaurant(id: string) {
  await prisma.restaurant.update({ where: { id }, data: { status: "LIVE" } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleFeatured(id: string, currentStatus: boolean) {
  await prisma.restaurant.update({ where: { id }, data: { isFeatured: !currentStatus } });
  revalidatePath("/admin");
  revalidatePath("/");
}
