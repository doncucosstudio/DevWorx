import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { menuItemSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = menuItemSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: { ...parsed.data, imageUrl: parsed.data.imageUrl === "" ? null : parsed.data.imageUrl },
    });
    return Response.json({ item });
  } catch {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    await prisma.menuItem.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Item not found" }, { status: 404 });
  }
}
