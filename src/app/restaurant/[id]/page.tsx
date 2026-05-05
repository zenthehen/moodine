import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import RestaurantDetailClient from "./RestaurantDetailClient";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, status: "LIVE" },
    include: {
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }
    }
  });

  if (!restaurant) {
    notFound();
  }

  return <RestaurantDetailClient restaurant={restaurant as any} currentUserId={session?.userId} />;
}
