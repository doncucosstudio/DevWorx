import { petLinesFor, type Category, type Prompt, type Theme } from "./templates";

export const MAX_PEOPLE = 5;

export type MemberKind = "person" | "pet";

export type Member = {
  id: string;
  name: string;
  kind: MemberKind;
  /** e.g. "Grandma", "Our good boy" — shown above the name. */
  relation?: string;
  /** A short personal memory or note shown in their spotlight. */
  memory?: string;
  /** Key into the image map handed to the renderer. */
  photoId?: string;
};

export type Details = {
  to: string;
  from: string;
  /** Replaces the prompt's main message when non-empty. */
  customMessage?: string;
};

export type SceneMember = Pick<Member, "id" | "name" | "kind" | "relation" | "memory" | "photoId">;

export type Scene =
  | { kind: "intro"; start: number; duration: number; title: string; subtitle?: string }
  | { kind: "spotlight"; start: number; duration: number; member: SceneMember; line?: string; index: number }
  | { kind: "group"; start: number; duration: number; members: SceneMember[]; line?: string }
  | { kind: "message"; start: number; duration: number; text: string }
  | { kind: "closing"; start: number; duration: number; title: string; subtitle?: string };

export type Timeline = {
  theme: Theme;
  duration: number;
  scenes: Scene[];
};

export const DURATIONS = {
  intro: 4.5,
  spotlight: 4.5,
  group: 5,
  closing: 5,
  /** Message time grows with length so it can actually be read. */
  messageBase: 4,
  messagePerWord: 0.28,
  messageMax: 12,
};

/** "Ava", "Ava & Leo", "Ava, Leo & Biscuit" */
export function joinNames(names: string[]): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} & ${clean[clean.length - 1]}`;
}

export function greetingYear(categoryId: string | undefined, now = new Date()): number {
  // New Year greetings sent in late fall/December are for the coming year.
  if (categoryId === "new-year" && now.getMonth() >= 9) return now.getFullYear() + 1;
  return now.getFullYear();
}

/**
 * Replace {tokens} in a line. If a token has no value, a trailing
 * ", {token}" clause is trimmed ("Happy Birthday, {to}!" → "Happy Birthday!");
 * if the token is still present the whole line is dropped (returns ""), so
 * templates degrade gracefully.
 */
export function fillTokens(template: string, values: Record<string, string | number | undefined>): string {
  let out = template;
  for (const [key, raw] of Object.entries(values)) {
    const value = raw === undefined ? "" : String(raw).trim();
    const token = `{${key}}`;
    if (!out.includes(token)) continue;
    if (value) {
      out = out.split(token).join(value);
      continue;
    }
    out = out.replace(new RegExp(`,\\s*\\{${key}\\}`, "g"), "");
    if (out.includes(token)) return "";
  }
  return out.replace(/\s+([!?.,])/g, "$1").replace(/\s{2,}/g, " ").trim();
}

function messageDuration(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.min(DURATIONS.messageMax, DURATIONS.messageBase + words * DURATIONS.messagePerWord);
}

export function composeTimeline(
  category: Category,
  prompt: Prompt,
  members: Member[],
  details: Details,
  now = new Date(),
): Timeline {
  const people = members
    .slice(0, MAX_PEOPLE)
    .map((m) => ({ ...m, name: m.name.trim() }))
    .filter((m) => m.name);
  const script = prompt.script;
  const base = {
    to: details.to,
    from: details.from,
    names: joinNames(people.map((p) => p.name)),
    year: greetingYear(category.id, now),
  };

  const scenes: Scene[] = [];
  let t = 0;
  const push = (scene: Scene) => {
    scenes.push(scene);
    t += scene.duration;
  };

  const introTitle = fillTokens(script.intro.title, base) || category.name;
  push({
    kind: "intro",
    start: t,
    duration: DURATIONS.intro,
    title: introTitle,
    subtitle: script.intro.subtitle ? fillTokens(script.intro.subtitle, base) || undefined : undefined,
  });

  const petLines = petLinesFor(category, prompt);
  let personIdx = 0;
  let petIdx = 0;
  people.forEach((m, index) => {
    const lines = m.kind === "pet" ? petLines : script.spotlight;
    const i = m.kind === "pet" ? petIdx++ : personIdx++;
    const line = lines.length ? fillTokens(lines[i % lines.length], { ...base, name: m.name }) : "";
    push({
      kind: "spotlight",
      start: t,
      duration: DURATIONS.spotlight,
      member: pickMember(m),
      line: line || undefined,
      index,
    });
  });

  if (people.length >= 2) {
    const line = script.group ? fillTokens(script.group, base) : "";
    push({
      kind: "group",
      start: t,
      duration: DURATIONS.group,
      members: people.map(pickMember),
      line: line || undefined,
    });
  }

  const custom = details.customMessage?.trim();
  const text = custom ? fillTokens(custom, base) || custom : fillTokens(script.message, base);
  if (text) push({ kind: "message", start: t, duration: messageDuration(text), text });

  push({
    kind: "closing",
    start: t,
    duration: DURATIONS.closing,
    title: fillTokens(script.closing.title, base) || category.name,
    subtitle: script.closing.subtitle ? fillTokens(script.closing.subtitle, base) || undefined : undefined,
  });

  return { theme: category.theme, duration: t, scenes };
}

function pickMember(m: Member): SceneMember {
  return {
    id: m.id,
    name: m.name,
    kind: m.kind,
    relation: m.relation?.trim() || undefined,
    memory: m.memory?.trim() || undefined,
    photoId: m.photoId,
  };
}

export function sceneAt(timeline: Timeline, t: number): Scene {
  const { scenes } = timeline;
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (t >= scenes[i].start) return scenes[i];
  }
  return scenes[0];
}
