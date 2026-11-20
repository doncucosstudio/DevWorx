import assert from "node:assert/strict";
import { test } from "node:test";
import { composeTimeline, fillTokens, greetingYear, joinNames, MAX_PEOPLE, type Member } from "./compose";
import { CATEGORIES, getCategory, getPrompt } from "./templates";

const person = (name: string, extra: Partial<Member> = {}): Member => ({ id: name, name, kind: "person", ...extra });

test("joinNames reads naturally", () => {
  assert.equal(joinNames([]), "");
  assert.equal(joinNames(["Ava"]), "Ava");
  assert.equal(joinNames(["Ava", "Leo"]), "Ava & Leo");
  assert.equal(joinNames(["Ava", " ", "Leo", "Biscuit"]), "Ava, Leo & Biscuit");
});

test("fillTokens substitutes and degrades gracefully", () => {
  assert.equal(fillTokens("Happy Birthday, {to}!", { to: "Mom" }), "Happy Birthday, Mom!");
  assert.equal(fillTokens("Happy Birthday, {to}!", { to: "" }), "Happy Birthday!");
  assert.equal(fillTokens("Dear {to},", { to: "" }), "");
  assert.equal(fillTokens("With love, {from}", { from: "  " }), "With love");
  assert.equal(fillTokens("{names} — together", { names: "" }), "");
  assert.equal(fillTokens("No tokens here.", { to: "x" }), "No tokens here.");
  assert.equal(fillTokens("Cheers to {year}!", { year: 2027 }), "Cheers to 2027!");
});

test("New Year greetings in late fall point at the coming year", () => {
  assert.equal(greetingYear("new-year", new Date(2026, 10, 20)), 2027);
  assert.equal(greetingYear("new-year", new Date(2027, 0, 1)), 2027);
  assert.equal(greetingYear("christmas", new Date(2026, 11, 1)), 2026);
});

test("timeline has intro, one spotlight per member, group, message and closing", () => {
  const cat = getCategory("christmas")!;
  const prompt = getPrompt(cat, "christmas-cozy")!;
  const members = [person("Ava"), person("Leo"), { id: "b", name: "Biscuit", kind: "pet" as const }];
  const tl = composeTimeline(cat, prompt, members, { to: "Grandma", from: "The Parkers" });
  assert.deepEqual(
    tl.scenes.map((s) => s.kind),
    ["intro", "spotlight", "spotlight", "spotlight", "group", "message", "closing"],
  );
  const intro = tl.scenes[0];
  assert.equal(intro.kind === "intro" && intro.title, "Merry Christmas, Grandma");
  const pet = tl.scenes[3];
  assert.ok(pet.kind === "spotlight" && prompt.script.petSpotlight!.includes(pet.line!));
  const group = tl.scenes[4];
  assert.equal(group.kind === "group" && group.line, "Ava, Leo & Biscuit — together for the holidays");
  const closing = tl.scenes.at(-1)!;
  assert.equal(closing.kind === "closing" && closing.subtitle, "With love, The Parkers");
  // Scenes are contiguous and the duration adds up.
  let t = 0;
  for (const s of tl.scenes) {
    assert.equal(s.start, t);
    t += s.duration;
  }
  assert.equal(tl.duration, t);
});

test("caps at MAX_PEOPLE, skips blank names, no group scene for a single member", () => {
  const cat = getCategory("birthday")!;
  const prompt = cat.prompts[0];
  const many = Array.from({ length: 8 }, (_, i) => person(`P${i}`));
  const tl = composeTimeline(cat, prompt, many, { to: "", from: "" });
  assert.equal(tl.scenes.filter((s) => s.kind === "spotlight").length, MAX_PEOPLE);

  const one = composeTimeline(cat, prompt, [person("Solo"), person("   ")], { to: "", from: "" });
  assert.equal(one.scenes.filter((s) => s.kind === "spotlight").length, 1);
  assert.equal(one.scenes.some((s) => s.kind === "group"), false);
});

test("custom message replaces the suggested one and supports tokens", () => {
  const cat = getCategory("in-memory")!;
  const prompt = getPrompt(cat, "memory-letter")!;
  const tl = composeTimeline(cat, prompt, [person("Dad")], { to: "Sam", from: "", customMessage: "Miss you every day, {to}." });
  const msg = tl.scenes.find((s) => s.kind === "message");
  assert.equal(msg?.kind === "message" && msg.text, "Miss you every day, Sam.");
});

test("works with nobody added and blank details for every prompt", () => {
  for (const cat of CATEGORIES) {
    for (const prompt of cat.prompts) {
      const tl = composeTimeline(cat, prompt, [], { to: "", from: "" });
      assert.ok(tl.duration > 5, `${prompt.id} too short`);
      for (const s of tl.scenes) {
        const texts = [
          "title" in s ? s.title : "",
          "subtitle" in s ? s.subtitle ?? "" : "",
          "text" in s ? s.text : "",
        ];
        for (const text of texts) assert.ok(!/[{}]/.test(text), `${prompt.id} leaked a token: ${text}`);
      }
    }
  }
});

test("catalog covers holidays, celebrations and remembrance with unique ids", () => {
  const ids = CATEGORIES.flatMap((c) => [c.id, ...c.prompts.map((p) => p.id)]);
  assert.equal(new Set(ids).size, ids.length);
  for (const g of ["holidays", "celebrations", "comfort"]) assert.ok(CATEGORIES.some((c) => c.group === g));
  assert.ok(CATEGORIES.filter((c) => c.group === "holidays").length >= 10);
});
