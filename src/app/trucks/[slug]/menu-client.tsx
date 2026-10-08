"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { formatCents } from "@/lib/money";
import { themeCssVars } from "@/lib/theme";
import { useCartStore, type CartModifier } from "@/lib/cart-store";

type TruckWithMenu = Prisma.TruckGetPayload<{
  include: {
    categories: {
      include: {
        items: {
          include: {
            modifierGroups: { include: { options: true } };
          };
        };
      };
    };
  };
}>;

type MenuItem = TruckWithMenu["categories"][number]["items"][number];

export default function MenuClient({ truck }: { truck: TruckWithMenu }) {
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const lines = useCartStore((s) => s.lines);
  const truckSlugInCart = useCartStore((s) => s.truckSlug);

  const cartCount = truckSlugInCart === truck.slug ? lines.reduce((n, l) => n + l.quantity, 0) : 0;
  const cartTotal =
    truckSlugInCart === truck.slug
      ? lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0)
      : 0;

  const style = themeCssVars(truck);

  return (
    <div className="truck-scope flex flex-1 flex-col" style={style}>
      <header
        className="border-b border-stone-200"
        style={{ background: `linear-gradient(135deg, ${truck.primaryColor}22, transparent)` }}
      >
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link href="/" className="text-sm text-stone-500 hover:underline">
            ← All trucks
          </Link>
          <div className="mt-3 flex items-start gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center text-4xl"
              data-truck-radius
              style={{ background: `${truck.primaryColor}22` }}
            >
              {truck.logoEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold" style={{ color: truck.secondaryColor }}>
                  {truck.name}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    truck.isOpen ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {truck.isOpen ? "Open now" : "Closed"}
                </span>
              </div>
              {truck.tagline && <p className="mt-1 text-stone-600">{truck.tagline}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
                {truck.location && <span>📍 {truck.location}</span>}
                {truck.hoursText && <span>🕒 {truck.hoursText}</span>}
                <span>⏱️ ~{truck.estimatedWaitMinutes} min wait</span>
              </div>
            </div>
          </div>
          {truck.description && (
            <p className="mt-4 max-w-2xl text-sm text-stone-600">{truck.description}</p>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 pb-28">
        {!truck.isOpen && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This truck isn&apos;t accepting online orders right now, but feel free to browse the
            menu.
          </div>
        )}

        {truck.categories.length === 0 && (
          <p className="text-stone-500">This truck hasn&apos;t added a menu yet.</p>
        )}

        <div className="space-y-10">
          {truck.categories.map((category) => (
            <section key={category.id}>
              <h2 className="text-lg font-bold text-stone-900">{category.name}</h2>
              {category.description && (
                <p className="mt-1 text-sm text-stone-500">{category.description}</p>
              )}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    disabled={!item.isAvailable}
                    onClick={() => setActiveItem(item)}
                    data-truck-radius
                    className="flex items-start gap-3 border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="text-3xl">{item.imageEmoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-stone-900">{item.name}</h3>
                        {item.isFeatured && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                            style={{ background: truck.accentColor, color: truck.secondaryColor }}
                          >
                            Popular
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-stone-500">{item.description}</p>
                      )}
                      <p className="mt-2 font-medium" style={{ color: truck.primaryColor }}>
                        {formatCents(item.priceCents, truck.currencySymbol)}
                      </p>
                      {!item.isAvailable && (
                        <p className="mt-1 text-xs font-medium text-red-500">Sold out</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {cartCount > 0 && (
        <Link
          href={`/trucks/${truck.slug}/cart`}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur"
        >
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <span className="font-medium text-stone-900">
              {cartCount} item{cartCount !== 1 ? "s" : ""} in cart
            </span>
            <span
              className="rounded-full px-5 py-2 font-semibold text-white"
              style={{ background: truck.primaryColor }}
            >
              View cart · {formatCents(cartTotal, truck.currencySymbol)}
            </span>
          </div>
        </Link>
      )}

      {activeItem && (
        <ItemModal
          item={activeItem}
          truck={truck}
          onClose={() => setActiveItem(null)}
        />
      )}
    </div>
  );
}

function ItemModal({
  item,
  truck,
  onClose,
}: {
  item: MenuItem;
  truck: TruckWithMenu;
  onClose: () => void;
}) {
  const addLine = useCartStore((s) => s.addLine);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selections, setSelections] = useState<Record<string, Set<string>>>(() => {
    const initial: Record<string, Set<string>> = {};
    for (const group of item.modifierGroups) {
      const defaults = group.options.filter((o) => o.isDefault).map((o) => o.id);
      initial[group.id] = new Set(defaults.slice(0, group.maxSelect || undefined));
    }
    return initial;
  });

  const unitPriceCents = useMemo(() => {
    let total = item.priceCents;
    for (const group of item.modifierGroups) {
      const selected = selections[group.id] ?? new Set();
      for (const opt of group.options) {
        if (selected.has(opt.id)) total += opt.priceDeltaCents;
      }
    }
    return total;
  }, [item, selections]);

  function toggleOption(groupId: string, optionId: string, maxSelect: number) {
    setSelections((prev) => {
      const current = new Set(prev[groupId] ?? []);
      if (maxSelect <= 1) {
        if (current.has(optionId)) {
          current.clear();
        } else {
          current.clear();
          current.add(optionId);
        }
      } else {
        if (current.has(optionId)) {
          current.delete(optionId);
        } else if (current.size < maxSelect) {
          current.add(optionId);
        }
      }
      return { ...prev, [groupId]: current };
    });
  }

  function isValid(): boolean {
    for (const group of item.modifierGroups) {
      const size = (selections[group.id] ?? new Set()).size;
      if (size < group.minSelect || size > group.maxSelect) return false;
    }
    return true;
  }

  function handleAdd() {
    if (!isValid() || !truck.isOpen) return;
    const modifiers: CartModifier[] = [];
    for (const group of item.modifierGroups) {
      const selected = selections[group.id] ?? new Set();
      for (const opt of group.options) {
        if (selected.has(opt.id)) {
          modifiers.push({ optionId: opt.id, name: opt.name, priceDeltaCents: opt.priceDeltaCents });
        }
      }
    }
    addLine(truck.slug, truck.id, {
      menuItemId: item.id,
      name: item.name,
      basePriceCents: item.priceCents,
      unitPriceCents,
      quantity,
      notes,
      modifiers,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        data-truck-radius
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl sm:mb-0"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-stone-900">{item.name}</h3>
            {item.description && <p className="mt-1 text-sm text-stone-500">{item.description}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-stone-400 hover:bg-stone-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {item.modifierGroups.map((group) => (
            <fieldset key={group.id}>
              <legend className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                {group.name}
                {group.required && <span className="text-xs font-normal text-red-500">Required</span>}
                <span className="text-xs font-normal text-stone-400">
                  {group.maxSelect > 1 ? `pick up to ${group.maxSelect}` : "pick one"}
                </span>
              </legend>
              <div className="mt-2 space-y-1.5">
                {group.options.map((opt) => {
                  const checked = (selections[group.id] ?? new Set()).has(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type={group.maxSelect <= 1 ? "radio" : "checkbox"}
                          checked={checked}
                          onChange={() => toggleOption(group.id, opt.id, group.maxSelect)}
                          name={group.id}
                        />
                        {opt.name}
                      </span>
                      {opt.priceDeltaCents !== 0 && (
                        <span className="text-stone-500">
                          {opt.priceDeltaCents > 0 ? "+" : ""}
                          {formatCents(opt.priceDeltaCents, truck.currencySymbol)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div>
            <label className="text-sm font-semibold text-stone-900">Special instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="E.g. no onions"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100"
            >
              −
            </button>
            <span className="w-6 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="h-8 w-8 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={!isValid() || !truck.isOpen}
            className="rounded-full px-6 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: truck.primaryColor }}
          >
            Add · {formatCents(unitPriceCents * quantity, truck.currencySymbol)}
          </button>
        </div>
      </div>
    </div>
  );
}
