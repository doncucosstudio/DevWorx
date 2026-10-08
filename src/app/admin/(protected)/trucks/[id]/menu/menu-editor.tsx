"use client";

import { useState } from "react";
import { formatCents, dollarsToCents } from "@/lib/money";
import type { TruckWithFullMenu } from "./page";

type Category = TruckWithFullMenu["categories"][number];
type Item = Category["items"][number];
type Group = Item["modifierGroups"][number];
type Option = Group["options"][number];

const inputClass =
  "rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm outline-none focus:border-stone-400";

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return res.json();
}

export default function MenuEditor({ initialTruck }: { initialTruck: TruckWithFullMenu }) {
  const [truck, setTruck] = useState(initialTruck);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await api(`/api/trucks/${truck.id}`, "GET");
    setTruck(data.truck);
  }

  async function guarded(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {truck.categories.map((category) => (
        <CategoryBlock
          key={category.id}
          category={category}
          currencySymbol={truck.currencySymbol}
          onChange={refresh}
          onError={(msg) => setError(msg)}
        />
      ))}

      <AddCategoryForm
        onAdd={(values) =>
          guarded(async () => {
            await api(`/api/trucks/${truck.id}/categories`, "POST", values);
            await refresh();
          })
        }
      />
    </div>
  );
}

function AddCategoryForm({ onAdd }: { onAdd: (values: { name: string; description: string }) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({ name, description });
        setName("");
        setDescription("");
      }}
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-stone-300 bg-white p-4"
    >
      <div>
        <label className="block text-xs font-medium text-stone-500">New category name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Tacos" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500">Description (optional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-stone-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-stone-700"
      >
        + Add category
      </button>
    </form>
  );
}

function CategoryBlock({
  category,
  currencySymbol,
  onChange,
  onError,
}: {
  category: Category;
  currencySymbol: string;
  onChange: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);

  async function guarded(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => guarded(async () => {
            await api(`/api/categories/${category.id}`, "PATCH", { name });
            await onChange();
          })}
          className={`${inputClass} font-semibold`}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => guarded(async () => {
            await api(`/api/categories/${category.id}`, "PATCH", { description });
            await onChange();
          })}
          placeholder="Category description"
          className={`${inputClass} flex-1 min-w-[160px]`}
        />
        <button
          onClick={() =>
            guarded(async () => {
              if (!confirm(`Delete category "${category.name}" and all its items?`)) return;
              await api(`/api/categories/${category.id}`, "DELETE");
              await onChange();
            })
          }
          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Delete category
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {category.items.map((item) => (
          <ItemBlock
            key={item.id}
            item={item}
            currencySymbol={currencySymbol}
            onChange={onChange}
            onError={onError}
          />
        ))}
      </div>

      <AddItemForm
        onAdd={(values) =>
          guarded(async () => {
            await api(`/api/categories/${category.id}/items`, "POST", values);
            await onChange();
          })
        }
      />
    </div>
  );
}

function AddItemForm({
  onAdd,
}: {
  onAdd: (values: { name: string; description: string; priceCents: number; imageEmoji: string }) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [emoji, setEmoji] = useState("🍽️");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !price) return;
        onAdd({ name, description: "", priceCents: dollarsToCents(Number(price)), imageEmoji: emoji });
        setName("");
        setPrice("");
      }}
      className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-stone-300 p-3"
    >
      <div>
        <label className="block text-xs font-medium text-stone-500">Emoji</label>
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className={`${inputClass} w-14`} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500">New item name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Carnitas taco" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500">Price</label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={`${inputClass} w-24`}
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-stone-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-stone-700"
      >
        + Add item
      </button>
    </form>
  );
}

function ItemBlock({
  item,
  currencySymbol,
  onChange,
  onError,
}: {
  item: Item;
  currencySymbol: string;
  onChange: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState((item.priceCents / 100).toString());
  const [emoji, setEmoji] = useState(item.imageEmoji);

  async function guarded(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function patch(data: Record<string, unknown>) {
    return guarded(async () => {
      await api(`/api/items/${item.id}`, "PATCH", data);
      await onChange();
    });
  }

  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} onBlur={() => patch({ imageEmoji: emoji })} className={`${inputClass} w-14`} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => patch({ name })}
          className={`${inputClass} font-medium`}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => patch({ description })}
          placeholder="Description"
          className={`${inputClass} flex-1 min-w-[140px]`}
        />
        <input
          type="number"
          min={0}
          step={0.01}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => patch({ priceCents: dollarsToCents(Number(price)) })}
          className={`${inputClass} w-24`}
        />
        <label className="flex items-center gap-1 text-xs text-stone-600">
          <input type="checkbox" checked={item.isAvailable} onChange={(e) => patch({ isAvailable: e.target.checked })} />
          Available
        </label>
        <label className="flex items-center gap-1 text-xs text-stone-600">
          <input type="checkbox" checked={item.isFeatured} onChange={(e) => patch({ isFeatured: e.target.checked })} />
          Popular
        </label>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
        >
          {expanded ? "Hide options" : `Options (${item.modifierGroups.length})`}
        </button>
        <button
          type="button"
          onClick={() =>
            guarded(async () => {
              if (!confirm(`Delete "${item.name}"?`)) return;
              await api(`/api/items/${item.id}`, "DELETE");
              await onChange();
            })
          }
          className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
        <span className="ml-auto text-xs text-stone-400">
          {formatCents(item.priceCents, currencySymbol)}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-stone-200 pt-3">
          {item.modifierGroups.map((group) => (
            <ModifierGroupBlock key={group.id} group={group} onChange={onChange} onError={onError} />
          ))}
          <AddModifierGroupForm
            onAdd={(values) =>
              guarded(async () => {
                await api(`/api/items/${item.id}/modifier-groups`, "POST", values);
                await onChange();
              })
            }
          />
        </div>
      )}
    </div>
  );
}

function AddModifierGroupForm({
  onAdd,
}: {
  onAdd: (values: { name: string; minSelect: number; maxSelect: number; required: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [maxSelect, setMaxSelect] = useState(1);
  const [required, setRequired] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({ name, minSelect: required ? 1 : 0, maxSelect, required });
        setName("");
        setMaxSelect(1);
        setRequired(false);
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-stone-300 bg-white p-2.5"
    >
      <div>
        <label className="block text-xs font-medium text-stone-500">New option group</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Add-ons" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500">Max selections</label>
        <input
          type="number"
          min={1}
          max={20}
          value={maxSelect}
          onChange={(e) => setMaxSelect(Number(e.target.value))}
          className={`${inputClass} w-20`}
        />
      </div>
      <label className="flex items-center gap-1 text-xs text-stone-600">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
        Required
      </label>
      <button
        type="submit"
        className="rounded-full bg-stone-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-600"
      >
        + Add group
      </button>
    </form>
  );
}

function ModifierGroupBlock({
  group,
  onChange,
  onError,
}: {
  group: Group;
  onChange: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(group.name);
  const [maxSelect, setMaxSelect] = useState(group.maxSelect);

  async function guarded(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function patch(data: Record<string, unknown>) {
    return guarded(async () => {
      await api(`/api/modifier-groups/${group.id}`, "PATCH", data);
      await onChange();
    });
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => patch({ name })} className={`${inputClass} font-medium`} />
        <label className="flex items-center gap-1 text-xs text-stone-600">
          Max
          <input
            type="number"
            min={1}
            max={20}
            value={maxSelect}
            onChange={(e) => setMaxSelect(Number(e.target.value))}
            onBlur={() => patch({ maxSelect })}
            className={`${inputClass} w-16`}
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={group.required}
            onChange={(e) => patch({ required: e.target.checked, minSelect: e.target.checked ? 1 : 0 })}
          />
          Required
        </label>
        <button
          type="button"
          onClick={() =>
            guarded(async () => {
              if (!confirm(`Delete option group "${group.name}"?`)) return;
              await api(`/api/modifier-groups/${group.id}`, "DELETE");
              await onChange();
            })
          }
          className="ml-auto rounded-full border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Delete group
        </button>
      </div>

      <div className="mt-2 space-y-1.5 pl-2">
        {group.options.map((option) => (
          <OptionRow key={option.id} option={option} onChange={onChange} onError={onError} />
        ))}
        <AddOptionForm
          onAdd={(values) =>
            guarded(async () => {
              await api(`/api/modifier-groups/${group.id}/options`, "POST", values);
              await onChange();
            })
          }
        />
      </div>
    </div>
  );
}

function AddOptionForm({
  onAdd,
}: {
  onAdd: (values: { name: string; priceDeltaCents: number }) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({ name, priceDeltaCents: dollarsToCents(Number(price)) });
        setName("");
        setPrice("0");
      }}
      className="flex items-end gap-2"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Extra cheese"
        className={`${inputClass} text-xs`}
      />
      <input
        type="number"
        step={0.01}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className={`${inputClass} w-20 text-xs`}
      />
      <button
        type="submit"
        className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
      >
        + Add option
      </button>
    </form>
  );
}

function OptionRow({
  option,
  onChange,
  onError,
}: {
  option: Option;
  onChange: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(option.name);
  const [price, setPrice] = useState((option.priceDeltaCents / 100).toString());

  async function guarded(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function patch(data: Record<string, unknown>) {
    return guarded(async () => {
      await api(`/api/modifier-options/${option.id}`, "PATCH", data);
      await onChange();
    });
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => patch({ name })} className={`${inputClass} text-xs`} />
      <input
        type="number"
        step={0.01}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={() => patch({ priceDeltaCents: dollarsToCents(Number(price)) })}
        className={`${inputClass} w-20 text-xs`}
      />
      <label className="flex items-center gap-1 text-stone-600">
        <input type="checkbox" checked={option.isDefault} onChange={(e) => patch({ isDefault: e.target.checked })} />
        Default
      </label>
      <button
        type="button"
        onClick={() =>
          guarded(async () => {
            await api(`/api/modifier-options/${option.id}`, "DELETE");
            await onChange();
          })
        }
        className="text-red-500 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
