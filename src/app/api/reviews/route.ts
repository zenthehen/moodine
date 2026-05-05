import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId, rating, comment } = await req.json();

    if (!restaurantId || !rating || !comment) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        userId: session.userId,
        restaurantId,
      },
      include: {
        user: { select: { name: true } }
      }
    });

    // Optionally update average rating on Restaurant
    const aggregations = await prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        averageRating: aggregations._avg.rating || 0,
        reviewCount: aggregations._count.rating || 0,
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Review posting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
