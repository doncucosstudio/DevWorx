import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrdersQueue from "./orders-queue";

export const dynamic = "force-dynamic";

export default async function TruckOrdersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const truck = await prisma.truck.findUnique({ where: { id } });
  if (!truck) notFound();

  const orders = await prisma.order.findMany({
    where: { truckId: id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { modifiers: true } } },
  });

  return (
    <div>
      <Link href="/admin" className="text-sm text-stone-500 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{truck.name} orders</h1>

      <div className="mt-6">
        <OrdersQueue truckId={truck.id} currencySymbol={truck.currencySymbol} initialOrders={orders} />
      </div>
    </div>
  );
}
