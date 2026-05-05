import prisma from "@/lib/prisma";
import HomePageClient from "./HomePageClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dbRestaurants = await prisma.restaurant.findMany({
    where: { status: "LIVE" },
  });

  return <HomePageClient dbRestaurants={dbRestaurants} />;
}
