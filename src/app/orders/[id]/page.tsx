import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderStatusClient from "./order-status-client";

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      truck: { select: { name: true, slug: true, logoEmoji: true, currencySymbol: true, primaryColor: true, estimatedWaitMinutes: true } },
      items: { include: { modifiers: true } },
    },
  });
  if (!order) notFound();

  return <OrderStatusClient initialOrder={order} />;
}
