import type { Scene, SceneMember, Timeline } from "./compose";
import { drawParticles, heart, rand, roundRect, sparkle } from "./particles";
import type { Theme } from "./templates";

export type Img = HTMLCanvasElement | HTMLImageElement | ImageBitmap;
export type ImageMap = Map<string, Img>;

type Ctx = CanvasRenderingContext2D;

const FONTS = {
  serif: 'Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif',
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

/** Draw the frame at time `t` (seconds). Pure: same inputs → same pixels. */
export function drawFrame(ctx: Ctx, w: number, h: number, t: number, tl: Timeline, images: ImageMap) {
  const { theme } = tl;
  const s = Math.min(w, h) / 720;

  drawBackground(ctx, w, h, t, theme);
  for (const kind of theme.particles) drawParticles(ctx, kind, w, h, t, theme.palette);

  // Each scene fades its foreground in/out; background + particles run continuously.
  tl.scenes.forEach((scene, i) => {
    const local = t - scene.start;
    if (local < 0 || local > scene.duration) return;
    const last = i === tl.scenes.length - 1;
    const alpha = smooth(local / 0.7) * (last ? 1 : smooth((scene.duration - local) / 0.6));
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawScene(ctx, w, h, s, local, scene, tl, images);
    ctx.restore();
  });

  drawVignette(ctx, w, h);

  // Gentle fade in from / out to the theme's deepest color.
  const edge = Math.max(clamp01(1 - t / 0.6), clamp01((t - (tl.duration - 1.2)) / 1.2));
  if (edge > 0) {
    ctx.save();
    ctx.globalAlpha = edge;
    ctx.fillStyle = theme.bg[1];
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function drawBackground(ctx: Ctx, w: number, h: number, t: number, theme: Theme) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, theme.bg[0]);
  g.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const R = Math.max(w, h) * 0.55;
  const orbs = [
    { x: 0.3 + 0.12 * Math.sin(t * 0.13), y: 0.35 + 0.08 * Math.cos(t * 0.17) },
    { x: 0.72 + 0.1 * Math.cos(t * 0.11), y: 0.62 + 0.1 * Math.sin(t * 0.15) },
  ];
  for (const o of orbs) {
    const rg = ctx.createRadialGradient(o.x * w, o.y * h, 0, o.x * w, o.y * h, R);
    rg.addColorStop(0, theme.glow);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawVignette(ctx: Ctx, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawScene(ctx: Ctx, w: number, h: number, s: number, local: number, scene: Scene, tl: Timeline, images: ImageMap) {
  const theme = tl.theme;
  const wide = w / h > 1.2;
  const rise = (delay: number) => (1 - easeOut((local - delay) / 0.9)) * 24 * s;
  const appear = (delay: number) => smooth((local - delay) / 0.8);

  switch (scene.kind) {
    case "intro": {
      const maxW = w * (wide ? 0.72 : 0.84);
      const titleSize = 74 * s;
      const titleLines = layoutText(ctx, scene.title, theme, titleSize, maxW, { weight: 700 });
      const subSize = 30 * s;
      const total = titleLines.height + (scene.subtitle ? subSize * 2.2 : 0) + 60 * s;
      let y = h / 2 - total / 2;
      withAlpha(ctx, appear(0.1), () => ornament(ctx, w / 2, y + rise(0.1), 140 * s, theme.accent, s));
      y += 60 * s;
      withAlpha(ctx, appear(0.25), () => paintText(ctx, titleLines, w / 2, y + rise(0.25), theme.text, theme));
      y += titleLines.height + subSize * 0.9;
      if (scene.subtitle) {
        const sub = layoutText(ctx, scene.subtitle, theme, subSize, maxW, { italic: theme.font === "serif" });
        withAlpha(ctx, appear(0.8), () => paintText(ctx, sub, w / 2, y + rise(0.8), theme.subtext, theme));
      }
      break;
    }

    case "spotlight": {
      const m = scene.member;
      const tilt = (scene.index % 2 === 0 ? -1 : 1) * 0.035;
      const zoom = 1.06 + 0.12 * (local / scene.duration);
      const pan = scene.index % 2 === 0 ? -1 + (2 * local) / scene.duration : 1 - (2 * local) / scene.duration;
      const enter = easeOut(local / 1.1);

      if (wide) {
        const ph = h * 0.66;
        const pw = ph * 0.8;
        const cx = w * 0.31;
        const cy = h * 0.5;
        photoCard(ctx, m, images, cx, cy + (1 - enter) * 30 * s, pw, ph, tilt * enter, zoom, pan, theme, s);
        const tx = w * 0.69;
        textStack(ctx, m, scene.line, theme, tx, h * 0.5, w * 0.4, s, local);
      } else {
        const pw = Math.min(w * 0.64, h * 0.4);
        const ph = pw * 1.2;
        const cy = h * 0.08 + ph / 2 + 20 * s;
        photoCard(ctx, m, images, w / 2, cy + (1 - enter) * 30 * s, pw, ph, tilt * enter, zoom, pan, theme, s);
        const top = cy + ph / 2 + 40 * s;
        textStack(ctx, m, scene.line, theme, w / 2, top + (h - top) / 2 - 10 * s, w * 0.84, s, local);
      }
      break;
    }

    case "group": {
      const members = scene.members;
      const n = members.length;
      const rows = !wide && n > 3 ? [members.slice(0, Math.ceil(n / 2)), members.slice(Math.ceil(n / 2))] : [members];
      const perRow = Math.max(...rows.map((r) => r.length));
      const gap = 28 * s;
      const size = Math.min((w * 0.88 - gap * (perRow - 1)) / perRow, (wide ? h * 0.36 : h * 0.22));
      const nameSize = Math.max(18 * s, Math.min(30 * s, size * 0.16));
      const rowH = size + nameSize * 2.4;
      const lineLayout = scene.line ? layoutText(ctx, scene.line, theme, 40 * s, w * 0.84, { weight: 600 }) : null;
      const total = rows.length * rowH + (lineLayout ? lineLayout.height + 40 * s : 0);
      let y = h / 2 - total / 2;
      let k = 0;
      for (const row of rows) {
        const rowW = row.length * size + (row.length - 1) * gap;
        row.forEach((m, j) => {
          const delay = 0.15 + k * 0.18;
          const a = appear(delay);
          const bob = Math.sin(local * 1.6 + k) * 5 * s;
          const cx = w / 2 - rowW / 2 + size / 2 + j * (size + gap);
          const cy = y + size / 2 + bob + rise(delay);
          withAlpha(ctx, a, () => {
            circlePhoto(ctx, m, images, cx, cy, size / 2, theme, s, 1.04 + 0.06 * Math.sin(local * 0.5 + k));
            const label = layoutText(ctx, m.name, theme, nameSize, size + gap, { weight: 600 });
            paintText(ctx, label, cx, cy + size / 2 + nameSize * 0.6, theme.text, theme);
          });
          k++;
        });
        y += rowH;
      }
      if (lineLayout) {
        withAlpha(ctx, appear(0.4 + n * 0.18), () => paintText(ctx, lineLayout, w / 2, y + 20 * s + rise(0.4 + n * 0.18), theme.subtext, theme));
      }
      break;
    }

    case "message": {
      const size = (wide ? 46 : 44) * s;
      const layout = layoutText(ctx, scene.text, theme, size, w * (wide ? 0.74 : 0.84), { italic: theme.font === "serif" });
      let y = h / 2 - layout.height / 2;
      withAlpha(ctx, appear(0), () => {
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha *= 0.55;
        ctx.font = `700 ${120 * s}px ${FONTS.serif}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("“", w / 2, y - 6 * s);
      });
      // Reveal line by line so it reads like a letter.
      const step = Math.min(0.9, (scene.duration - 2.5) / Math.max(1, layout.lines.length));
      layout.lines.forEach((line, i) => {
        const delay = 0.3 + i * step;
        withAlpha(ctx, appear(delay), () => {
          paintText(ctx, { ...layout, lines: [line], height: layout.lineHeight }, w / 2, y + rise(delay) * 0.6, theme.text, theme);
        });
        y += layout.lineHeight;
      });
      break;
    }

    case "closing": {
      const members = membersOf(tl);
      const avatar = members.length ? Math.min(84 * s, (w * 0.8) / members.length - 12 * s) : 0;
      const titleL = layoutText(ctx, scene.title, theme, 80 * s, w * 0.84, { weight: 700 });
      const subL = scene.subtitle ? layoutText(ctx, scene.subtitle, theme, 32 * s, w * 0.8, { italic: theme.font === "serif" }) : null;
      const total = (avatar ? avatar + 50 * s : 0) + titleL.height + 50 * s + (subL ? subL.height + 20 * s : 0);
      let y = h / 2 - total / 2;
      if (avatar) {
        const rowW = members.length * avatar + (members.length - 1) * 12 * s;
        members.forEach((m, i) => {
          withAlpha(ctx, appear(0.1 + i * 0.12), () =>
            circlePhoto(ctx, m, images, w / 2 - rowW / 2 + avatar / 2 + i * (avatar + 12 * s), y + avatar / 2 + rise(0.1 + i * 0.12), avatar / 2, theme, s, 1.05),
          );
        });
        y += avatar + 50 * s;
      }
      const pulse = 1 + 0.03 * Math.sin(local * 2);
      withAlpha(ctx, appear(0.4), () => {
        ctx.save();
        ctx.translate(w / 2, y + titleL.height / 2);
        ctx.scale(pulse, pulse);
        paintText(ctx, titleL, 0, -titleL.height / 2, theme.text, theme);
        ctx.restore();
      });
      y += titleL.height + 20 * s;
      withAlpha(ctx, appear(0.7), () => {
        ctx.fillStyle = theme.accent;
        heart(ctx, w / 2, y + 8 * s, 22 * s);
        sparkle(ctx, w / 2 - 50 * s, y + 6 * s, 8 * s);
        sparkle(ctx, w / 2 + 50 * s, y + 6 * s, 8 * s);
      });
      y += 40 * s;
      if (subL) withAlpha(ctx, appear(1), () => paintText(ctx, subL, w / 2, y + rise(1), theme.subtext, theme));
      break;
    }
  }
}

function membersOf(tl: Timeline): SceneMember[] {
  return tl.scenes.flatMap((sc) => (sc.kind === "spotlight" ? [sc.member] : []));
}

// ───────────────────────────── text ─────────────────────────────

type TextLayout = {
  lines: string[];
  font: string;
  size: number;
  lineHeight: number;
  height: number;
};

function layoutText(
  ctx: Ctx,
  text: string,
  theme: Theme,
  size: number,
  maxWidth: number,
  opts: { weight?: number; italic?: boolean; maxLines?: number } = {},
): TextLayout {
  const maxLines = opts.maxLines ?? 6;
  let px = size;
  for (let attempt = 0; attempt < 8; attempt++) {
    const font = `${opts.italic ? "italic " : ""}${opts.weight ?? 400} ${px}px ${FONTS[theme.font]}`;
    ctx.font = font;
    const lines = wrap(ctx, text, maxWidth);
    const fits = lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth);
    if (fits || attempt === 7) {
      const lineHeight = px * 1.25;
      return { lines, font, size: px, lineHeight, height: lines.length * lineHeight };
    }
    px *= 0.88;
  }
  throw new Error("unreachable");
}

function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

/** Paints a layout with its top edge at `top`, centered on `cx`. */
function paintText(ctx: Ctx, layout: TextLayout, cx: number, top: number, color: string, theme: Theme) {
  ctx.save();
  ctx.font = layout.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  const light = isLight(theme.bg[0]);
  ctx.shadowColor = light ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)";
  ctx.shadowBlur = layout.size * 0.25;
  ctx.shadowOffsetY = light ? 0 : layout.size * 0.04;
  layout.lines.forEach((line, i) => ctx.fillText(line, cx, top + layout.lineHeight * (i + 0.5)));
  ctx.restore();
}

function textStack(ctx: Ctx, m: SceneMember, line: string | undefined, theme: Theme, cx: number, cy: number, maxW: number, s: number, local: number) {
  const parts: { layout: TextLayout; color: string; gap: number }[] = [];
  if (m.relation) {
    parts.push({ layout: layoutText(ctx, m.relation.toUpperCase(), theme, 22 * s, maxW, { weight: 600 }), color: theme.accent, gap: 10 * s });
  }
  parts.push({ layout: layoutText(ctx, m.name, theme, 72 * s, maxW, { weight: 700, maxLines: 2 }), color: theme.text, gap: 18 * s });
  if (line) parts.push({ layout: layoutText(ctx, line, theme, 32 * s, maxW, { maxLines: 4 }), color: theme.subtext, gap: 18 * s });
  if (m.memory) {
    parts.push({
      layout: layoutText(ctx, `“${m.memory}”`, theme, 27 * s, maxW, { italic: true, maxLines: 4 }),
      color: theme.text,
      gap: 0,
    });
  }
  const total = parts.reduce((acc, p) => acc + p.layout.height + p.gap, 0);
  let y = cy - total / 2;
  parts.forEach((p, i) => {
    const delay = 0.35 + i * 0.35;
    const a = smooth((local - delay) / 0.8);
    const r = (1 - easeOut((local - delay) / 0.9)) * 20 * s;
    withAlpha(ctx, a, () => paintText(ctx, p.layout, cx, y + r, p.color, theme));
    y += p.layout.height + p.gap;
  });
}

// ───────────────────────────── photos ─────────────────────────────

function photoCard(
  ctx: Ctx,
  m: SceneMember,
  images: ImageMap,
  cx: number,
  cy: number,
  pw: number,
  ph: number,
  rot: number,
  zoom: number,
  pan: number,
  theme: Theme,
  s: number,
) {
  const border = 12 * s;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 40 * s;
  ctx.shadowOffsetY = 16 * s;
  ctx.fillStyle = "#fffdf8";
  roundRect(ctx, -pw / 2 - border, -ph / 2 - border, pw + border * 2, ph + border * 2, 14 * s);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.save();
  roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 8 * s);
  ctx.clip();
  const img = m.photoId ? images.get(m.photoId) : undefined;
  if (img) drawCover(ctx, img, -pw / 2, -ph / 2, pw, ph, zoom, pan * 0.6, 0);
  else placeholder(ctx, m, -pw / 2, -ph / 2, pw, ph, theme);
  ctx.restore();
  ctx.restore();
}

function circlePhoto(ctx: Ctx, m: SceneMember, images: ImageMap, cx: number, cy: number, r: number, theme: Theme, s: number, zoom: number) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 24 * s;
  ctx.shadowOffsetY = 8 * s;
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  const inner = r - Math.max(3, 5 * s);
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.clip();
  const img = m.photoId ? images.get(m.photoId) : undefined;
  if (img) drawCover(ctx, img, cx - inner, cy - inner, inner * 2, inner * 2, zoom, 0, 0);
  else placeholder(ctx, m, cx - inner, cy - inner, inner * 2, inner * 2, theme);
  ctx.restore();
}

/** object-fit: cover with zoom and pan (-1..1). Biased upward, where faces usually are. */
function drawCover(ctx: Ctx, img: Img, x: number, y: number, w: number, h: number, zoom: number, panX: number, panY: number) {
  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const fx = clamp01(0.5 + panX * 0.5);
  const fy = clamp01(0.38 + panY * 0.38);
  ctx.drawImage(img, x - (dw - w) * fx, y - (dh - h) * fy, dw, dh);
}

function placeholder(ctx: Ctx, m: SceneMember, x: number, y: number, w: number, h: number, theme: Theme) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  // Accent → deepest background color keeps the white monogram/paw readable on every theme.
  g.addColorStop(0, theme.accent);
  g.addColorStop(1, isLight(theme.bg[1]) ? theme.text : theme.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(x + rand(i, 9) * w, y + rand(i, 8) * h, Math.min(w, h) * (0.1 + rand(i, 7) * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }
  const cx = x + w / 2;
  const cy = y + h / 2;
  const size = Math.min(w, h);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = size * 0.04;
  if (m.kind === "pet") {
    paw(ctx, cx, cy, size * 0.42);
  } else {
    ctx.font = `700 ${size * 0.42}px ${FONTS[theme.font]}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(m.name), cx, cy + size * 0.02);
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 1)).toUpperCase();
}

function paw(ctx: Ctx, cx: number, cy: number, size: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.18, size * 0.3, size * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  const toes: [number, number, number][] = [
    [-0.36, -0.12, -0.3],
    [-0.13, -0.32, -0.1],
    [0.13, -0.32, 0.1],
    [0.36, -0.12, 0.3],
  ];
  for (const [dx, dy, rot] of toes) {
    ctx.beginPath();
    ctx.ellipse(cx + dx * size, cy + dy * size, size * 0.11, size * 0.14, rot, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ───────────────────────────── misc ─────────────────────────────

function ornament(ctx: Ctx, cx: number, cy: number, width: number, color: string, s: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, cy);
  ctx.lineTo(cx - 14 * s, cy);
  ctx.moveTo(cx + 14 * s, cy);
  ctx.lineTo(cx + width / 2, cy);
  ctx.stroke();
  sparkle(ctx, cx, cy, 10 * s);
  ctx.restore();
}

function withAlpha(ctx: Ctx, a: number, fn: () => void) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= a;
  fn();
  ctx.restore();
}

function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
