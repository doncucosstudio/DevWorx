import type { ParticleKind } from "./templates";

/**
 * Ambient particle layers. Every particle's state is a pure function of
 * (index, time), so the preview, scrubbing and the final render all match
 * frame-for-frame without any simulation state.
 */

type Ctx = CanvasRenderingContext2D;

/** Small deterministic hash → [0, 1). */
export function rand(i: number, salt = 0): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

const wrap = (v: number, max: number) => ((v % max) + max) % max;

function counts(kind: ParticleKind, w: number, h: number): number {
  const area = (w * h) / (1280 * 720);
  const base: Record<ParticleKind, number> = {
    snow: 90,
    confetti: 70,
    hearts: 22,
    leaves: 26,
    fireworks: 0,
    stars: 80,
    petals: 34,
    lanterns: 14,
    fireflies: 40,
    bats: 7,
    sparkles: 26,
  };
  return Math.round(base[kind] * Math.max(0.6, Math.min(1.6, area)));
}

export function drawParticles(ctx: Ctx, kind: ParticleKind, w: number, h: number, t: number, palette: string[]) {
  const n = counts(kind, w, h);
  const s = Math.min(w, h) / 720; // scale factor
  ctx.save();
  switch (kind) {
    case "snow":
      for (let i = 0; i < n; i++) {
        const depth = 0.4 + rand(i, 1) * 0.6;
        const r = (1.5 + depth * 3.5) * s;
        const speed = (25 + depth * 55) * s;
        const y = wrap(rand(i, 2) * (h + 40) + t * speed, h + 40) - 20;
        const x = wrap(rand(i, 3) * w + Math.sin(t * 0.8 + i) * 18 * s * depth, w);
        ctx.globalAlpha = 0.35 + depth * 0.55;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case "confetti":
      for (let i = 0; i < n; i++) {
        const speed = (60 + rand(i, 1) * 80) * s;
        const y = wrap(rand(i, 2) * (h + 60) + t * speed, h + 60) - 30;
        const x = wrap(rand(i, 3) * w + Math.sin(t * 1.5 + i * 2) * 25 * s, w);
        const rot = t * (2 + rand(i, 4) * 4) + i;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(1, Math.cos(t * 5 + i));
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = palette[i % palette.length];
        ctx.fillRect(-5 * s, -3 * s, 10 * s, 6 * s);
        ctx.restore();
      }
      break;

    case "hearts":
      for (let i = 0; i < n; i++) {
        const speed = (30 + rand(i, 1) * 40) * s;
        const size = (8 + rand(i, 5) * 14) * s;
        const y = h + 30 - wrap(rand(i, 2) * (h + 60) + t * speed, h + 60);
        const x = wrap(rand(i, 3) * w + Math.sin(t + i) * 20 * s, w);
        ctx.globalAlpha = 0.25 + rand(i, 6) * 0.5;
        ctx.fillStyle = palette[i % palette.length];
        heart(ctx, x, y, size);
      }
      break;

    case "leaves":
      for (let i = 0; i < n; i++) {
        const speed = (35 + rand(i, 1) * 45) * s;
        const y = wrap(rand(i, 2) * (h + 60) + t * speed, h + 60) - 30;
        const x = wrap(rand(i, 3) * w + Math.sin(t * 0.9 + i) * 50 * s + t * 12 * s, w);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 1.4 + i) * 1.2 + i);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = palette[i % palette.length];
        const L = (10 + rand(i, 5) * 10) * s;
        ctx.beginPath();
        ctx.moveTo(0, -L);
        ctx.quadraticCurveTo(L * 0.8, 0, 0, L);
        ctx.quadraticCurveTo(-L * 0.8, 0, 0, -L);
        ctx.fill();
        ctx.restore();
      }
      break;

    case "petals":
      for (let i = 0; i < n; i++) {
        const speed = (25 + rand(i, 1) * 30) * s;
        const y = wrap(rand(i, 2) * (h + 60) + t * speed, h + 60) - 30;
        const x = wrap(rand(i, 3) * w + t * 20 * s + Math.sin(t + i) * 30 * s, w);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * (0.5 + rand(i, 4)) + i);
        ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(t * 2 + i)));
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = palette[i % palette.length];
        ctx.beginPath();
        ctx.ellipse(0, 0, 8 * s, 5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;

    case "stars":
      for (let i = 0; i < n; i++) {
        const x = rand(i, 1) * w;
        const y = rand(i, 2) * h * 0.85;
        const tw = 0.5 + 0.5 * Math.sin(t * (1 + rand(i, 3) * 2) + i * 3);
        ctx.globalAlpha = 0.15 + tw * 0.6;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, (0.6 + rand(i, 4) * 1.6) * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case "sparkles":
      for (let i = 0; i < n; i++) {
        const cycle = 2.5 + rand(i, 1) * 2.5;
        const phase = wrap(t + rand(i, 2) * cycle, cycle) / cycle;
        const k = Math.floor((t + rand(i, 2) * cycle) / cycle);
        const x = rand(i * 7 + k, 3) * w;
        const y = rand(i * 7 + k, 4) * h;
        const a = Math.sin(phase * Math.PI);
        ctx.globalAlpha = a * 0.85;
        ctx.fillStyle = palette[i % palette.length] ?? "#fff";
        sparkle(ctx, x, y, (4 + rand(i, 5) * 7) * s * a);
      }
      break;

    case "fireflies":
      for (let i = 0; i < n; i++) {
        const speed = (8 + rand(i, 1) * 16) * s;
        const y = h + 20 - wrap(rand(i, 2) * (h + 40) + t * speed, h + 40);
        const x = wrap(rand(i, 3) * w + Math.sin(t * 0.6 + i) * 30 * s, w);
        const glow = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.7 + rand(i, 4)) + i));
        const r = (2 + rand(i, 5) * 3) * s;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
        const c = palette[i % palette.length] ?? "#ffe7b3";
        g.addColorStop(0, c);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = glow * 0.7;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = glow;
        ctx.fillStyle = "#fffbe8";
        ctx.beginPath();
        ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case "lanterns":
      for (let i = 0; i < n; i++) {
        const speed = (14 + rand(i, 1) * 18) * s;
        const size = (14 + rand(i, 5) * 16) * s;
        const y = h + 60 - wrap(rand(i, 2) * (h + 120) + t * speed, h + 120);
        const x = wrap(rand(i, 3) * w + Math.sin(t * 0.5 + i) * 15 * s, w);
        const c = palette[i % palette.length];
        const g = ctx.createRadialGradient(x, y, 0, x, y, size * 2.2);
        g.addColorStop(0, "rgba(255,200,90,0.45)");
        g.addColorStop(1, "rgba(255,200,90,0)");
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, size * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c;
        roundRect(ctx, x - size * 0.6, y - size * 0.8, size * 1.2, size * 1.6, size * 0.5);
        ctx.fill();
        ctx.fillStyle = "rgba(255,240,180,0.6)";
        ctx.fillRect(x - size * 0.6, y - size * 0.85, size * 1.2, size * 0.15);
        ctx.fillRect(x - size * 0.6, y + size * 0.7, size * 1.2, size * 0.15);
      }
      break;

    case "bats":
      for (let i = 0; i < n; i++) {
        const speed = (50 + rand(i, 1) * 60) * s;
        const dir = rand(i, 6) > 0.5 ? 1 : -1;
        const x = dir > 0 ? wrap(rand(i, 3) * (w + 100) + t * speed, w + 100) - 50 : w + 50 - wrap(rand(i, 3) * (w + 100) + t * speed, w + 100);
        const y = rand(i, 2) * h * 0.6 + Math.sin(t * 2 + i) * 20 * s;
        const flap = Math.sin(t * 14 + i * 3);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "#0a0410";
        bat(ctx, x, y, (12 + rand(i, 5) * 10) * s, flap);
      }
      break;

    case "fireworks": {
      const bursts = 4;
      for (let b = 0; b < bursts; b++) {
        const cycle = 2.6 + rand(b, 1) * 1.2;
        const local = t + b * 0.9;
        const k = Math.floor(local / cycle);
        const p = wrap(local, cycle) / cycle;
        const cx = (0.15 + rand(b * 13 + k, 2) * 0.7) * w;
        const cy = (0.12 + rand(b * 13 + k, 3) * 0.35) * h;
        const color = palette[(b + k) % palette.length];
        const sparks = 34;
        const radius = (110 + rand(b * 13 + k, 4) * 90) * s;
        const ease = 1 - Math.pow(1 - Math.min(1, p * 1.6), 3);
        const fade = p < 0.15 ? p / 0.15 : Math.max(0, 1 - (p - 0.15) / 0.75);
        for (let j = 0; j < sparks; j++) {
          const ang = (j / sparks) * Math.PI * 2 + rand(j, b);
          const r = radius * ease * (0.85 + rand(j, k) * 0.3);
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r + p * p * 60 * s;
          ctx.globalAlpha = fade;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, 2.4 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = fade * 0.35;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ang) * r * 0.85, cy + Math.sin(ang) * r * 0.85 + p * p * 50 * s, 1.6 * s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
  }
  ctx.restore();
}

export function heart(ctx: Ctx, x: number, y: number, size: number) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.8, y - s * 0.2, x - s * 0.8, y - s * 1.6, x, y - s * 0.5);
  ctx.bezierCurveTo(x + s * 0.8, y - s * 1.6, x + s * 1.8, y - s * 0.2, x, y + s * 0.9);
  ctx.fill();
}

export function sparkle(ctx: Ctx, x: number, y: number, r: number) {
  if (r <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function bat(ctx: Ctx, x: number, y: number, size: number, flap: number) {
  const wing = size * (0.35 + 0.35 * flap);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - size * 0.5, y - wing, x - size, y - wing * 0.6);
  ctx.quadraticCurveTo(x - size * 0.7, y + size * 0.05, x - size * 0.45, y + size * 0.1);
  ctx.quadraticCurveTo(x - size * 0.25, y, x, y + size * 0.25);
  ctx.quadraticCurveTo(x + size * 0.25, y, x + size * 0.45, y + size * 0.1);
  ctx.quadraticCurveTo(x + size * 0.7, y + size * 0.05, x + size, y - wing * 0.6);
  ctx.quadraticCurveTo(x + size * 0.5, y - wing, x, y);
  ctx.fill();
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
