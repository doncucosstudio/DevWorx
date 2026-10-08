import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuClient from "./menu-client";

export const dynamic = "force-dynamic";

async function getTruck(slug: string) {
  return prisma.truck.findUnique({
    where: { slug },
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

export default async function TruckMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const truck = await getTruck(slug);
  if (!truck) notFound();

  return <MenuClient truck={truck} />;
}
