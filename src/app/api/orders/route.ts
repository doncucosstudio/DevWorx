import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validation";
import { generateOrderNumber } from "@/lib/order-number";
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const truck = await prisma.truck.findUnique({ where: { id: data.truckId } });
  if (!truck) return Response.json({ error: "Truck not found" }, { status: 404 });
  if (!truck.isOpen) {
    return Response.json({ error: "This truck is not currently accepting orders" }, { status: 400 });
  }

  const menuItemIds = [...new Set(data.items.map((i) => i.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    include: { category: true, modifierGroups: { include: { options: true } } },
  });
  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  type BuiltItem = {
    menuItemId: string;
    nameSnapshot: string;
    unitPriceCents: number;
    quantity: number;
    notes: string;
    modifiers: { modifierOptionId: string; nameSnapshot: string; priceDeltaCents: number }[];
  };
  const builtItems: BuiltItem[] = [];

  for (const line of data.items) {
    const menuItem = menuItemMap.get(line.menuItemId);
    if (!menuItem || menuItem.category.truckId !== data.truckId) {
      return Response.json({ error: `Menu item not found: ${line.menuItemId}` }, { status: 400 });
    }
    if (!menuItem.isAvailable) {
      return Response.json({ error: `${menuItem.name} is currently unavailable` }, { status: 400 });
    }

    const selectedIds = new Set(line.modifierOptionIds);
    const modifiers: BuiltItem["modifiers"] = [];
    let unitPriceCents = menuItem.priceCents;

    for (const group of menuItem.modifierGroups) {
      const groupOptionIds = new Set(group.options.map((o) => o.id));
      const selectedInGroup = group.options.filter((o) => selectedIds.has(o.id));

      if (selectedInGroup.length < group.minSelect || selectedInGroup.length > group.maxSelect) {
        return Response.json(
          { error: `"${group.name}" for ${menuItem.name} requires between ${group.minSelect} and ${group.maxSelect} selections` },
          { status: 400 }
        );
      }
      for (const optId of line.modifierOptionIds) {
        if (groupOptionIds.has(optId)) {
          const opt = group.options.find((o) => o.id === optId)!;
          modifiers.push({ modifierOptionId: opt.id, nameSnapshot: opt.name, priceDeltaCents: opt.priceDeltaCents });
          unitPriceCents += opt.priceDeltaCents;
        }
      }
    }

    builtItems.push({
      menuItemId: menuItem.id,
      nameSnapshot: menuItem.name,
      unitPriceCents,
      quantity: line.quantity,
      notes: line.notes ?? "",
      modifiers,
    });
  }

  const subtotalCents = builtItems.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  const taxCents = Math.round((subtotalCents * truck.taxRatePercent) / 100);
  const totalCents = subtotalCents + taxCents;

  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = generateOrderNumber(truck.orderPrefix);
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber,
          truckId: truck.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          pickupNote: data.pickupNote ?? "",
          notes: data.notes ?? "",
          subtotalCents,
          taxCents,
          totalCents,
          items: {
            create: builtItems.map((item) => ({
              menuItemId: item.menuItemId,
              nameSnapshot: item.nameSnapshot,
              unitPriceCents: item.unitPriceCents,
              quantity: item.quantity,
              notes: item.notes,
              modifiers: { create: item.modifiers },
            })),
          },
        },
        include: { items: { include: { modifiers: true } } },
      });
      return Response.json({ order }, { status: 201 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }

  return Response.json({ error: "Could not generate a unique order number, please try again" }, { status: 500 });
}
