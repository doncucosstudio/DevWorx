import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { truckSchema } from "@/lib/validation";

export async function GET() {
  const trucks = await prisma.truck.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { categories: true, orders: true } } },
  });
  return Response.json({ trucks });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const parsed = truckSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.truck.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return Response.json({ error: "A truck with that slug already exists" }, { status: 409 });
  }

  const truck = await prisma.truck.create({
    data: {
      ...data,
      logoUrl: data.logoUrl || null,
      coverUrl: data.coverUrl || null,
      socialLinks: JSON.stringify(data.socialLinks ?? []),
    },
  });

  return Response.json({ truck }, { status: 201 });
}
