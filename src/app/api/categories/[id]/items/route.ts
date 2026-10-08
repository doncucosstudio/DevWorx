import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { menuItemSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const parsed = menuItemSchema.omit({ categoryId: true }).safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.menuItem.create({
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || null,
      categoryId: id,
    },
  });
  return Response.json({ item }, { status: 201 });
}
