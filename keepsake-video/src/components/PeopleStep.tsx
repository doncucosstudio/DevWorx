"use client";

import { useId, useState } from "react";
import { MAX_PEOPLE, type MemberKind } from "@/lib/compose";
import { loadPhoto } from "@/lib/photos";
import type { Category } from "@/lib/templates";
import { BackLink } from "./PromptStep";
import type { MemberDraft } from "./Studio";

export default function PeopleStep({
  category,
  members,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  onPhoto,
  onBack,
  onNext,
}: {
  category: Category;
  members: MemberDraft[];
  onAdd: (kind: MemberKind) => void;
  onUpdate: (id: string, patch: Partial<MemberDraft>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onPhoto: (id: string, photo: { canvas: HTMLCanvasElement; thumbUrl: string } | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const full = members.length >= MAX_PEOPLE;
  const missingNames = members.some((m) => !m.name.trim());
  const remembering = category.group === "comfort" && category.id !== "thinking-of-you";

  return (
    <section>
      <BackLink onClick={onBack} label="Choose a different message" />
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold">
        {remembering ? "Who are you remembering?" : "Who's in the video?"}
      </h1>
      <p className="mt-2 text-muted">
        {`Add up to ${MAX_PEOPLE} people or pets. Each one gets their own moment in the spotlight, then everyone appears together. Photos are optional — without one, we'll make a lovely monogram (or paw print).`}
      </p>

      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {members.map((m, i) => (
          <li key={m.id}>
            <MemberCard
              member={m}
              index={i}
              count={members.length}
              onUpdate={(patch) => onUpdate(m.id, patch)}
              onRemove={() => onRemove(m.id)}
              onMove={(dir) => onMove(m.id, dir)}
              onPhoto={(p) => onPhoto(m.id, p)}
            />
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onAdd("person")}
          disabled={full}
          className="rounded-full border border-line bg-card px-4 py-2 font-medium shadow-sm hover:border-brand disabled:opacity-40"
        >
          + Add a person
        </button>
        <button
          type="button"
          onClick={() => onAdd("pet")}
          disabled={full}
          className="rounded-full border border-line bg-card px-4 py-2 font-medium shadow-sm hover:border-brand disabled:opacity-40"
        >
          + Add a pet
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {members.length} of {MAX_PEOPLE} added{full ? " — that's the maximum" : ""}
        </span>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onNext}
          disabled={missingNames}
          className="rounded-full bg-brand px-6 py-3 font-semibold text-brand-ink shadow hover:opacity-90 disabled:opacity-40"
        >
          {members.length ? "Continue to preview" : "Skip — no one to add"}
        </button>
        {missingNames && <span className="text-sm text-muted">Give everyone a name to continue.</span>}
      </div>
    </section>
  );
}

function MemberCard({
  member: m,
  index,
  count,
  onUpdate,
  onRemove,
  onMove,
  onPhoto,
}: {
  member: MemberDraft;
  index: number;
  count: number;
  onUpdate: (patch: Partial<MemberDraft>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onPhoto: (photo: { canvas: HTMLCanvasElement; thumbUrl: string } | null) => void;
}) {
  const uid = useId();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pet = m.kind === "pet";

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      onPhoto(await loadPhoto(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load that photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 rounded-2xl border border-line bg-card p-4 shadow-sm">
      <div className="flex w-28 shrink-0 flex-col items-center gap-2">
        <label
          htmlFor={`${uid}-photo`}
          className="relative grid h-28 w-28 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-background text-center text-xs text-muted hover:border-brand"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files[0]);
          }}
        >
          {m.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URL thumbnail
            <img src={m.thumbUrl} alt={`Photo of ${m.name || "this " + m.kind}`} className="h-full w-full object-cover" />
          ) : (
            <span className="px-2">
              <span className="block text-2xl" aria-hidden>
                {pet ? "🐾" : "📷"}
              </span>
              {loading ? "Loading…" : "Add photo"}
            </span>
          )}
        </label>
        <input
          id={`${uid}-photo`}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {m.thumbUrl && (
          <button type="button" className="text-xs text-muted underline" onClick={() => onPhoto(null)}>
            Remove photo
          </button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex rounded-full border border-line p-0.5 text-sm" role="group" aria-label="Person or pet">
            {(["person", "pet"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={m.kind === k}
                onClick={() => onUpdate({ kind: k })}
                className={`rounded-full px-3 py-1 capitalize ${m.kind === k ? "bg-brand text-brand-ink" : "text-muted"}`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-muted">
            <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
              ↑
            </IconButton>
            <IconButton label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
              ↓
            </IconButton>
            <IconButton label={`Remove ${m.name || m.kind}`} onClick={onRemove}>
              ✕
            </IconButton>
          </div>
        </div>

        <Field id={`${uid}-name`} label="Name">
          <input
            id={`${uid}-name`}
            value={m.name}
            maxLength={40}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={pet ? "e.g. Biscuit" : "e.g. Grandma Rose"}
            className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
          />
        </Field>
        <Field id={`${uid}-rel`} label="Relationship or nickname" optional>
          <input
            id={`${uid}-rel`}
            value={m.relation ?? ""}
            maxLength={40}
            onChange={(e) => onUpdate({ relation: e.target.value })}
            placeholder={pet ? "e.g. Our very good boy" : "e.g. Grandma, Best friend"}
            className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
          />
        </Field>
        <Field id={`${uid}-mem`} label="A favorite memory or note" optional>
          <textarea
            id={`${uid}-mem`}
            value={m.memory ?? ""}
            maxLength={120}
            rows={2}
            onChange={(e) => onUpdate({ memory: e.target.value })}
            placeholder={pet ? "e.g. Stole a whole turkey leg in 2019" : "e.g. Sunday pancakes and terrible puns"}
            className="w-full resize-none rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ id, label, optional, children }: { id: string; label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-full hover:bg-line/60 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
