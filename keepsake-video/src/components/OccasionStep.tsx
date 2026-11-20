"use client";

import { MAX_PEOPLE } from "@/lib/compose";
import { CATEGORIES, GROUPS } from "@/lib/templates";

export default function OccasionStep({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <div className="max-w-2xl">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">Make a video that says it for you.</h1>
        <p className="mt-3 text-lg text-muted">
          Pick an occasion, choose a message, add photos of up to {MAX_PEOPLE} people or pets — and Keepsake turns it
          into a shareable video with music.
        </p>
      </div>

      {GROUPS.map((group) => (
        <div key={group.id} className="mt-10">
          <h2 className="text-xl font-semibold">{group.name}</h2>
          <p className="text-sm text-muted">{group.description}</p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.filter((c) => c.group === group.id).map((c) => {
              const active = c.id === selected;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-pressed={active}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-brand ${
                    active ? "border-brand ring-2 ring-brand" : "border-line"
                  }`}
                  style={{ background: `linear-gradient(160deg, ${c.theme.bg[0]}, ${c.theme.bg[1]})`, color: c.theme.text }}
                >
                  <span className="text-3xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <span className="mt-2 block font-serif text-lg font-semibold leading-tight">{c.name}</span>
                  <span className="mt-1 block text-xs opacity-80" style={{ color: c.theme.subtext }}>
                    {c.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
