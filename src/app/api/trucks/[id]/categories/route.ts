import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const category = await prisma.menuCategory.create({
    data: { ...parsed.data, truckId: id },
  });
  return Response.json({ category }, { status: 201 });
}
