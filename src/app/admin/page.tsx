import prisma from "@/lib/prisma";
import AdminPanelClient from "./AdminPanelClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="flex-1 bg-[#FAF7F2] py-16 px-6 sm:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="font-cormorant text-4xl sm:text-5xl font-semibold text-ink mb-4">
            Editor's <span className="italic text-rust">Dashboard</span>
          </h1>
          <p className="text-sage text-lg">
            Manage your platform's restaurants, vibe dimensions, and blacklists.
          </p>
        </div>

        <AdminPanelClient restaurants={restaurants} />
      </div>
    </main>
  );
}
