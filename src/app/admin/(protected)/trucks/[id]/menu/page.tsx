import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuEditor from "./menu-editor";

export const dynamic = "force-dynamic";

async function getTruck(id: string) {
  return prisma.truck.findUnique({
    where: { id },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              modifierGroups: {
                orderBy: { sortOrder: "asc" },
                include: { options: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
}

export type TruckWithFullMenu = NonNullable<Awaited<ReturnType<typeof getTruck>>>;

export default async function TruckMenuAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const truck = await getTruck(id);
  if (!truck) notFound();

  return (
    <div>
      <Link href="/admin" className="text-sm text-stone-500 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{truck.name} menu</h1>
      <p className="mt-1 text-stone-500">
        Organize categories, items, and customization options for your menu.
      </p>

      <div className="mt-6">
        <MenuEditor initialTruck={truck} />
      </div>
    </div>
  );
}
