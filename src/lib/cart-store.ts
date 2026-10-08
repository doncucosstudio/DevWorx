import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartModifier = {
  optionId: string;
  name: string;
  priceDeltaCents: number;
};

export type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  basePriceCents: number;
  unitPriceCents: number;
  quantity: number;
  notes: string;
  modifiers: CartModifier[];
};

type CartState = {
  truckSlug: string | null;
  truckId: string | null;
  lines: CartLine[];
  addLine: (truckSlug: string, truckId: string, line: Omit<CartLine, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
};

function lineKey(menuItemId: string, modifiers: CartModifier[], notes: string): string {
  const modKey = [...modifiers]
    .map((m) => m.optionId)
    .sort()
    .join(",");
  return `${menuItemId}::${modKey}::${notes.trim()}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      truckSlug: null,
      truckId: null,
      lines: [],

      addLine: (truckSlug, truckId, line) => {
        const state = get();
        const key = lineKey(line.menuItemId, line.modifiers, line.notes);

        if (state.truckSlug && state.truckSlug !== truckSlug) {
          set({ truckSlug, truckId, lines: [{ ...line, key }] });
          return;
        }

        const existingIndex = state.lines.findIndex((l) => l.key === key);
        if (existingIndex >= 0) {
          const lines = [...state.lines];
          lines[existingIndex] = {
            ...lines[existingIndex],
            quantity: lines[existingIndex].quantity + line.quantity,
          };
          set({ truckSlug, truckId, lines });
        } else {
          set({ truckSlug, truckId, lines: [...state.lines, { ...line, key }] });
        }
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          set({ lines: get().lines.filter((l) => l.key !== key) });
          return;
        }
        set({ lines: get().lines.map((l) => (l.key === key ? { ...l, quantity } : l)) });
      },

      removeLine: (key) => {
        set({ lines: get().lines.filter((l) => l.key !== key) });
      },

      clearCart: () => set({ truckSlug: null, truckId: null, lines: [] }),
    }),
    { name: "foodtruck-cart" }
  )
);
