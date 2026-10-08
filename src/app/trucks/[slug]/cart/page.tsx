import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CartClient from "./cart-client";

export const dynamic = "force-dynamic";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const truck = await prisma.truck.findUnique({ where: { slug } });
  if (!truck) notFound();

  return <CartClient truck={truck} />;
}
