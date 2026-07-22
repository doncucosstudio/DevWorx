import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { truckSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const truck = await prisma.truck.findUnique({
    where: { id },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { modifierGroups: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } } },
          },
        },
      },
    },
  });
  if (!truck) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ truck });
}

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = truckSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.slug) {
    const existing = await prisma.truck.findUnique({ where: { slug: data.slug } });
    if (existing && existing.id !== id) {
      return Response.json({ error: "A truck with that slug already exists" }, { status: 409 });
    }
  }

  try {
    const truck = await prisma.truck.update({
      where: { id },
      data: {
        ...data,
        logoUrl: data.logoUrl === "" ? null : data.logoUrl,
        coverUrl: data.coverUrl === "" ? null : data.coverUrl,
        socialLinks: data.socialLinks ? JSON.stringify(data.socialLinks) : undefined,
      },
    });
    return Response.json({ truck });
  } catch {
    return Response.json({ error: "Truck not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    await prisma.truck.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Truck not found" }, { status: 404 });
  }
}
