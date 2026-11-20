"use client";

import { fillTokens, greetingYear } from "@/lib/compose";
import type { Category } from "@/lib/templates";

export default function PromptStep({
  category,
  selected,
  onSelect,
  onBack,
}: {
  category: Category;
  selected: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const sample = { to: "", from: "", names: "", year: greetingYear(category.id) };
  return (
    <section>
      <BackLink onClick={onBack} label="All occasions" />
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold">
        <span aria-hidden>{category.emoji}</span> {category.name}
      </h1>
      <p className="mt-2 text-muted">Choose a message. You can personalize the wording before you create the video.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {category.prompts.map((p) => {
          const active = p.id === selected;
          const title = fillTokens(p.title, sample) || p.title;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={active}
              className={`flex flex-col rounded-2xl border bg-card text-left shadow-sm transition hover:shadow-lg focus-visible:outline-2 focus-visible:outline-brand ${
                active ? "border-brand ring-2 ring-brand" : "border-line"
              }`}
            >
              <div
                className="rounded-t-2xl px-5 py-6"
                style={{ background: `linear-gradient(160deg, ${category.theme.bg[0]}, ${category.theme.bg[1]})` }}
              >
                <p className="font-serif text-2xl font-bold" style={{ color: category.theme.text }}>
                  {fillTokens(p.script.intro.title, sample) || category.name}
                </p>
                {p.script.intro.subtitle && (
                  <p className="mt-1 italic" style={{ color: category.theme.subtext }}>
                    {fillTokens(p.script.intro.subtitle, sample)}
                  </p>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-muted">{p.blurb}</p>
                <blockquote className="mt-3 border-l-2 border-brand/50 pl-3 font-serif italic">
                  {fillTokens(p.script.message, sample)}
                </blockquote>
                <span className="mt-4 self-start rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-brand-ink">
                  {active ? "Selected — continue" : "Use this message"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="text-sm text-muted hover:text-foreground">
      ← {label}
    </button>
  );
}
