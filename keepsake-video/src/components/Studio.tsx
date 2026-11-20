"use client";

import { useMemo, useState } from "react";
import { composeTimeline, MAX_PEOPLE, type Member, type MemberKind } from "@/lib/compose";
import type { Format } from "@/lib/recorder";
import { getCategory, getPrompt } from "@/lib/templates";
import CreateStep from "./CreateStep";
import OccasionStep from "./OccasionStep";
import PeopleStep from "./PeopleStep";
import PromptStep from "./PromptStep";

export type MemberDraft = Member & { thumbUrl?: string };

const STEPS = ["Occasion", "Message", "Loved ones", "Create"] as const;

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function Studio() {
  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>("landscape");
  const [music, setMusic] = useState(true);
  // Photos live outside React state (canvases); bump `photoVersion` on change.
  const [photos] = useState(() => new Map<string, HTMLCanvasElement>());
  const [photoVersion, setPhotoVersion] = useState(0);

  const category = getCategory(categoryId);
  const prompt = getPrompt(category, promptId);

  const timeline = useMemo(() => {
    if (!category || !prompt) return null;
    return composeTimeline(category, prompt, members, { to, from, customMessage: message ?? undefined });
  }, [category, prompt, members, to, from, message]);

  const canVisit = (i: number) => i === 0 || (i === 1 && !!category) || (i >= 2 && !!prompt);

  const addMember = (kind: MemberKind) => {
    if (members.length >= MAX_PEOPLE) return;
    setMembers((ms) => [...ms, { id: newId(), name: "", kind }]);
  };
  const updateMember = (id: string, patch: Partial<MemberDraft>) =>
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMember = (id: string) => {
    photos.delete(id);
    setMembers((ms) => ms.filter((m) => m.id !== id));
  };
  const moveMember = (id: string, dir: -1 | 1) =>
    setMembers((ms) => {
      const i = ms.findIndex((m) => m.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ms.length) return ms;
      const next = [...ms];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const setPhoto = (id: string, photo: { canvas: HTMLCanvasElement; thumbUrl: string } | null) => {
    if (photo) photos.set(id, photo.canvas);
    else photos.delete(id);
    updateMember(id, { photoId: photo ? id : undefined, thumbUrl: photo?.thumbUrl });
    setPhotoVersion((v) => v + 1);
  };

  return (
    <div className="flex-1">
      <header className="border-b border-line bg-card/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(0)}
            className="flex items-baseline gap-2 text-left"
            aria-label="Keepsake — start over at occasion"
          >
            <span className="font-serif text-2xl font-bold tracking-tight">Keepsake</span>
            <span className="hidden sm:inline text-sm text-muted">video greetings &amp; tributes</span>
          </button>
          <nav aria-label="Steps">
            <ol className="flex items-center gap-1 sm:gap-2 text-sm">
              {STEPS.map((label, i) => {
                const active = i === step;
                const enabled = canVisit(i);
                return (
                  <li key={label} className="flex items-center gap-1 sm:gap-2">
                    {i > 0 && <span className="text-line" aria-hidden>—</span>}
                    <button
                      type="button"
                      disabled={!enabled}
                      onClick={() => setStep(i)}
                      aria-current={active ? "step" : undefined}
                      className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition ${
                        active ? "bg-brand text-brand-ink" : enabled ? "hover:bg-line/60" : "opacity-40"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full text-xs font-semibold ${
                          active ? "bg-brand-ink/20" : "bg-line"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="hidden md:inline">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {step === 0 && (
          <OccasionStep
            selected={categoryId}
            onSelect={(id) => {
              if (id !== categoryId) {
                setPromptId(null);
                setMessage(null);
              }
              setCategoryId(id);
              setStep(1);
            }}
          />
        )}
        {step === 1 && category && (
          <PromptStep
            category={category}
            selected={promptId}
            onBack={() => setStep(0)}
            onSelect={(id) => {
              if (id !== promptId) setMessage(null);
              setPromptId(id);
              setStep(2);
            }}
          />
        )}
        {step === 2 && category && prompt && (
          <PeopleStep
            category={category}
            members={members}
            onAdd={addMember}
            onUpdate={updateMember}
            onRemove={removeMember}
            onMove={moveMember}
            onPhoto={setPhoto}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && category && prompt && timeline && (
          <CreateStep
            category={category}
            prompt={prompt}
            timeline={timeline}
            images={photos}
            photoVersion={photoVersion}
            to={to}
            from={from}
            message={message ?? prompt.script.message}
            messageEdited={message !== null}
            format={format}
            music={music}
            onTo={setTo}
            onFrom={setFrom}
            onMessage={setMessage}
            onResetMessage={() => setMessage(null)}
            onFormat={setFormat}
            onMusic={setMusic}
            onBack={() => setStep(2)}
          />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-muted">
        Your photos never leave your device — videos are created right here in your browser.
      </footer>
    </div>
  );
}
