import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { modifierGroupSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = modifierGroupSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const group = await prisma.modifierGroup.update({ where: { id }, data: parsed.data });
    return Response.json({ group });
  } catch {
    return Response.json({ error: "Group not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    await prisma.modifierGroup.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Group not found" }, { status: 404 });
  }
}
