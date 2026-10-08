import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { modifierOptionSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = modifierOptionSchema.omit({ groupId: true }).safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const option = await prisma.modifierOption.create({
    data: { ...parsed.data, groupId: id },
  });
  return Response.json({ option }, { status: 201 });
}
