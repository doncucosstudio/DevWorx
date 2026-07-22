"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Truck } from "@/generated/prisma/client";
import { formatCents } from "@/lib/money";
import { themeCssVars } from "@/lib/theme";
import { useCartStore } from "@/lib/cart-store";

export default function CartClient({ truck }: { truck: Truck }) {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const truckSlugInCart = useCartStore((s) => s.truckSlug);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clearCart = useCartStore((s) => s.clearCart);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const style = themeCssVars(truck);
  const cartLines = truckSlugInCart === truck.slug ? lines : [];
  const subtotalCents = cartLines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const taxCents = Math.round((subtotalCents * truck.taxRatePercent) / 100);
  const totalCents = subtotalCents + taxCents;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (cartLines.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          truckId: truck.id,
          customerName: name,
          customerPhone: phone,
          pickupNote,
          notes,
          items: cartLines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            notes: l.notes,
            modifierOptionIds: l.modifiers.map((m) => m.optionId),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not place order. Please try again.");
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/orders/${data.order.id}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="truck-scope flex-1 bg-stone-50" style={style}>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <Link href={`/trucks/${truck.slug}`} className="text-sm text-stone-500 hover:underline">
            ← Back to menu
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Your order</h1>
          <p className="text-sm text-stone-500">{truck.name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {cartLines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
            Your cart is empty.
            <div className="mt-4">
              <Link
                href={`/trucks/${truck.slug}`}
                className="rounded-full px-5 py-2 font-semibold text-white"
                style={{ background: truck.primaryColor }}
              >
                Browse menu
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {cartLines.map((line) => (
                <li
                  key={line.key}
                  className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">{line.name}</p>
                    {line.modifiers.length > 0 && (
                      <p className="mt-0.5 text-sm text-stone-500">
                        {line.modifiers.map((m) => m.name).join(", ")}
                      </p>
                    )}
                    {line.notes && <p className="mt-0.5 text-xs italic text-stone-400">“{line.notes}”</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(line.key, line.quantity - 1)}
                        className="h-7 w-7 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(line.key, line.quantity + 1)}
                        className="h-7 w-7 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeLine(line.key)}
                        className="ml-2 text-xs font-medium text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 font-medium text-stone-900">
                    {formatCents(line.unitPriceCents * line.quantity, truck.currencySymbol)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-1.5 rounded-xl border border-stone-200 bg-white p-4 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatCents(subtotalCents, truck.currencySymbol)}</span>
              </div>
              {truck.taxRatePercent > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Tax ({truck.taxRatePercent}%)</span>
                  <span>{formatCents(taxCents, truck.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200 pt-1.5 font-semibold text-stone-900">
                <span>Total</span>
                <span>{formatCents(totalCents, truck.currencySymbol)}</span>
              </div>
            </div>

            {!truck.isOpen && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This truck is currently closed and not accepting orders.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-900">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-900">Phone number</label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
                  placeholder="For order updates"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-900">Pickup note (optional)</label>
                <input
                  value={pickupNote}
                  onChange={(e) => setPickupNote(e.target.value)}
                  maxLength={200}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
                  placeholder="E.g. I'll be at the blue car"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-900">Order notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !truck.isOpen}
                className="w-full rounded-full px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: truck.primaryColor }}
              >
                {submitting ? "Placing order…" : `Place order · ${formatCents(totalCents, truck.currencySymbol)}`}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
