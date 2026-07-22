"use client";

import { useEffect, useState } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { formatCents } from "@/lib/money";

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: { include: { modifiers: true } } };
}>;

const NEXT_STATUS: Record<string, string | null> = {
  PENDING: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "New",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PREPARING: "bg-blue-100 text-blue-700",
  READY: "bg-green-100 text-green-700",
  COMPLETED: "bg-stone-100 text-stone-500",
  CANCELLED: "bg-red-100 text-red-600",
};

const FILTERS = ["ACTIVE", "COMPLETED", "CANCELLED", "ALL"] as const;

export default function OrdersQueue({
  truckId,
  currencySymbol,
  initialOrders,
}: {
  truckId: string;
  currencySymbol: string;
  initialOrders: OrderWithItems[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ACTIVE");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/trucks/${truckId}/orders`);
        if (!res.ok) return;
        const data = await res.json();
        setOrders(data.orders);
      } catch {
        // ignore transient errors
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [truckId]);

  async function updateStatus(orderId: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const filtered = orders.filter((o) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return ["PENDING", "PREPARING", "READY"].includes(o.status);
    return o.status === filter;
  });

  return (
    <div>
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === f ? "bg-stone-900 text-white" : "border border-stone-300 text-stone-600 hover:bg-stone-100"
            }`}
          >
            {f === "ACTIVE" ? "Active" : f === "COMPLETED" ? "Completed" : f === "CANCELLED" ? "Cancelled" : "All"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-stone-500">No orders here.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900">{order.orderNumber}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500">
                    {order.customerName} · {order.customerPhone}
                  </p>
                  {order.pickupNote && <p className="text-xs italic text-stone-400">{order.pickupNote}</p>}
                </div>
                <div className="flex gap-2">
                  {NEXT_STATUS[order.status] && (
                    <button
                      onClick={() => updateStatus(order.id, NEXT_STATUS[order.status]!)}
                      className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-700"
                    >
                      Mark {STATUS_LABEL[NEXT_STATUS[order.status]!]}
                    </button>
                  )}
                  {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                    <button
                      onClick={() => updateStatus(order.id, "CANCELLED")}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <ul className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span className="text-stone-900">
                      {item.quantity}× {item.nameSnapshot}
                    </span>
                    {item.modifiers.length > 0 && (
                      <span className="text-stone-500"> — {item.modifiers.map((m) => m.nameSnapshot).join(", ")}</span>
                    )}
                    {item.notes && <span className="text-stone-400 italic"> ({item.notes})</span>}
                  </li>
                ))}
              </ul>
              {order.notes && <p className="mt-2 text-xs italic text-stone-400">Note: {order.notes}</p>}

              <p className="mt-3 text-right font-semibold text-stone-900">
                {formatCents(order.totalCents, currencySymbol)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
