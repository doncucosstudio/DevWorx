# Keepsake — personalized video greetings & tributes

Keepsake turns a few choices into a heartfelt, shareable video with music:

1. **Pick an occasion** — 14 major holidays (Christmas, Hanukkah, Kwanzaa, New
   Year, Lunar New Year, Valentine's Day, Easter, Eid, Mother's Day, Father's
   Day, Fourth of July, Diwali, Halloween, Thanksgiving), celebrations
   (birthday, anniversary, graduation) and **comfort & remembrance**
   (in loving memory, pet memorial / rainbow bridge, sympathy, get well).
2. **Choose a preselected message** — each occasion has one or more scripted
   prompts, e.g. *"Forever in our hearts"*, or *"A letter from them"*: comforting
   words written as if from the loved one who passed.
3. **Add up to 5 people or pets** — name, optional photo, relationship/nickname
   and a favorite memory. Each gets a spotlight scene, then everyone appears
   together. No photo? They get a monogram (or a paw print for pets).
4. **Personalize & create** — set To/From, edit the message, choose landscape
   (16:9), portrait (9:16) or square (1:1), toggle music, preview, and create.
   Download the video (MP4 where the browser supports it, otherwise WebM) or
   share it straight from your phone.

## Privacy

Everything happens in the browser. Photos are decoded and drawn locally; the
video is rendered on a `<canvas>`, the soundtrack is synthesized with Web
Audio, and `MediaRecorder` captures both. Nothing is uploaded, so there are no
API keys, servers or storage to manage.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests for the script composer
npm run build
```

## How it's built

| File | Role |
| --- | --- |
| `src/lib/templates.ts` | Occasion catalog: themes (colors, particles, font, music mood) and prompt scripts |
| `src/lib/compose.ts` | Fills `{to}`, `{from}`, `{names}`, `{name}`, `{year}` and builds the timed scene list |
| `src/lib/renderer.ts` | Draws any frame at time `t` — pure, so preview, scrubbing and the export match |
| `src/lib/particles.ts` | Snow, confetti, hearts, leaves, petals, fireworks, lanterns, fireflies, bats… |
| `src/lib/music.ts` | Procedural soundtrack per mood (festive, joyful, romantic, gentle, spooky, warm, anthem) |
| `src/lib/recorder.ts` | Plays the timeline in real time and records canvas + audio with `MediaRecorder` |
| `src/components/*` | The four-step wizard UI |

### Adding an occasion or message

Add a `Category` (or a `Prompt` to an existing one) in `src/lib/templates.ts`.
Lines with an empty token are dropped automatically (and `", {to}"` is trimmed),
so prompts read well even when To/From are left blank — `npm test` checks every
prompt for leaked tokens.

### Notes

- Recording happens in real time (a ~35 s video takes ~35 s). Keep the tab
  visible while it renders; browsers pause animation in background tabs.
- Supported: recent Chrome, Edge, Firefox and Safari (desktop and mobile).
