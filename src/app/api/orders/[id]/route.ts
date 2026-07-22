import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatusSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      truck: { select: { name: true, slug: true, logoEmoji: true, currencySymbol: true, estimatedWaitMinutes: true } },
      items: { include: { modifiers: true } },
    },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ order });
}

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const order = await prisma.order.update({ where: { id }, data: { status: parsed.data.status } });
    return Response.json({ order });
  } catch {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
}
