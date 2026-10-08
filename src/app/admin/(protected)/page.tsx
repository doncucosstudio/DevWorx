import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TruckRowActions from "./truck-row-actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const trucks = await prisma.truck.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { orders: true, categories: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Your food trucks</h1>
        <Link
          href="/admin/trucks/new"
          className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          + New truck
        </Link>
      </div>

      {trucks.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          No trucks yet. Create your first one to get started.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {trucks.map((truck) => (
            <div
              key={truck.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5"
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `${truck.primaryColor}22` }}
                >
                  {truck.logoEmoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-stone-900">{truck.name}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        truck.isOpen ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {truck.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500">
                    {truck._count.categories} categories · {truck._count.orders} orders total
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                  href={`/trucks/${truck.slug}`}
                  target="_blank"
                  className="rounded-full border border-stone-300 px-3 py-1.5 font-medium text-stone-600 hover:bg-stone-50"
                >
                  View
                </Link>
                <Link
                  href={`/admin/trucks/${truck.id}`}
                  className="rounded-full border border-stone-300 px-3 py-1.5 font-medium text-stone-600 hover:bg-stone-50"
                >
                  Settings
                </Link>
                <Link
                  href={`/admin/trucks/${truck.id}/menu`}
                  className="rounded-full border border-stone-300 px-3 py-1.5 font-medium text-stone-600 hover:bg-stone-50"
                >
                  Menu
                </Link>
                <Link
                  href={`/admin/trucks/${truck.id}/orders`}
                  className="rounded-full border border-stone-300 px-3 py-1.5 font-medium text-stone-600 hover:bg-stone-50"
                >
                  Orders
                </Link>
                <TruckRowActions truckId={truck.id} isOpen={truck.isOpen} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
