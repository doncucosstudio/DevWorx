import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { modifierGroupSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = modifierGroupSchema.omit({ menuItemId: true }).safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const group = await prisma.modifierGroup.create({
    data: { ...parsed.data, menuItemId: id },
  });
  return Response.json({ group }, { status: 201 });
}
