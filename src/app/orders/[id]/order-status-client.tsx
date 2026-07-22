"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { formatCents } from "@/lib/money";

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    truck: {
      select: {
        name: true;
        slug: true;
        logoEmoji: true;
        currencySymbol: true;
        primaryColor: true;
        estimatedWaitMinutes: true;
      };
    };
    items: { include: { modifiers: true } };
  };
}>;

const STEPS = [
  { key: "PENDING", label: "Order received" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready for pickup" },
  { key: "COMPLETED", label: "Picked up" },
] as const;

export default function OrderStatusClient({ initialOrder }: { initialOrder: OrderWithDetails }) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    if (order.status === "COMPLETED" || order.status === "CANCELLED") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${initialOrder.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setOrder(data.order);
      } catch {
        // ignore transient network errors, will retry on next tick
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [initialOrder.id, order.status]);

  const stepIndex = STEPS.findIndex((s) => s.key === order.status);
  const currencySymbol = order.truck.currencySymbol;

  return (
    <div className="flex-1 bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <Link href={`/trucks/${order.truck.slug}`} className="text-sm text-stone-500 hover:underline">
            ← {order.truck.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Order {order.orderNumber}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {order.status === "CANCELLED" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            This order was cancelled. Please contact the truck if you have questions.
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, i) => (
                <li key={step.key} className="flex flex-1 flex-col items-center text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      i <= stepIndex ? "text-white" : "bg-stone-100 text-stone-400"
                    }`}
                    style={i <= stepIndex ? { background: order.truck.primaryColor } : undefined}
                  >
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      i <= stepIndex ? "text-stone-900" : "text-stone-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
            {order.status !== "COMPLETED" && (
              <p className="mt-4 text-center text-sm text-stone-500">
                Estimated wait: ~{order.truck.estimatedWaitMinutes} minutes
              </p>
            )}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold text-stone-900">Order summary</h2>
          <ul className="mt-3 space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <div>
                  <p className="text-stone-900">
                    {item.quantity}× {item.nameSnapshot}
                  </p>
                  {item.modifiers.length > 0 && (
                    <p className="text-stone-500">{item.modifiers.map((m) => m.nameSnapshot).join(", ")}</p>
                  )}
                  {item.notes && <p className="text-xs italic text-stone-400">“{item.notes}”</p>}
                </div>
                <span className="shrink-0 text-stone-900">
                  {formatCents(item.unitPriceCents * item.quantity, currencySymbol)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-stone-200 pt-3 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatCents(order.subtotalCents, currencySymbol)}</span>
            </div>
            {order.taxCents > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Tax</span>
                <span>{formatCents(order.taxCents, currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatCents(order.totalCents, currencySymbol)}</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          This page updates automatically — feel free to keep it open.
        </p>
      </main>
    </div>
  );
}
