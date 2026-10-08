import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const trucks = await prisma.truck.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex-1 bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="text-xl font-bold tracking-tight">🚚 Food Truck Orders</div>
          <Link
            href="/admin"
            className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            Truck owner login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          Order ahead from local food trucks
        </h1>
        <p className="mt-2 text-stone-600">
          Pick a truck, customize your order, and skip the line.
        </p>

        {trucks.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
            No food trucks yet.{" "}
            <Link href="/admin" className="font-medium text-orange-600 underline">
              Add your first truck
            </Link>{" "}
            from the admin dashboard.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trucks.map((truck) => (
              <Link
                key={truck.id}
                href={`/trucks/${truck.slug}`}
                className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div
                  className="flex h-28 items-center justify-center text-5xl"
                  style={{ background: `${truck.primaryColor}1a` }}
                >
                  {truck.logoEmoji}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-stone-900">{truck.name}</h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        truck.isOpen
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {truck.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  {truck.tagline && (
                    <p className="mt-1 text-sm text-stone-600">{truck.tagline}</p>
                  )}
                  {truck.location && (
                    <p className="mt-3 flex items-center gap-1 text-xs text-stone-500">
                      📍 {truck.location}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
