import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: { truckId: id, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { modifiers: true } } },
  });
  return Response.json({ orders });
}
