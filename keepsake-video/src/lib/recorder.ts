import type { Timeline } from "./compose";
import { startMusic } from "./music";
import { drawFrame, type ImageMap } from "./renderer";

export type Format = "landscape" | "portrait" | "square";

export const FORMATS: Record<Format, { label: string; hint: string; width: number; height: number }> = {
  landscape: { label: "Landscape", hint: "16:9 · TV, YouTube, email", width: 1280, height: 720 },
  portrait: { label: "Portrait", hint: "9:16 · Stories, Reels, TikTok", width: 720, height: 1280 },
  square: { label: "Square", hint: "1:1 · Facebook, Instagram feed", width: 1080, height: 1080 },
};

const CANDIDATES: { mimeType: string; ext: string }[] = [
  { mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", ext: "mp4" },
  { mimeType: "video/mp4;codecs=avc1,mp4a", ext: "mp4" },
  { mimeType: "video/mp4", ext: "mp4" },
  { mimeType: "video/webm;codecs=vp9,opus", ext: "webm" },
  { mimeType: "video/webm;codecs=vp8,opus", ext: "webm" },
  { mimeType: "video/webm", ext: "webm" },
];

export function pickMimeType(): { mimeType: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  return CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c.mimeType)) ?? null;
}

export type RecordResult = { blob: Blob; mimeType: string; ext: string };

/**
 * Plays the timeline onto `canvas` in real time while MediaRecorder captures
 * the canvas and the soundtrack. Resolves with the finished video file.
 */
export async function recordTimeline(opts: {
  canvas: HTMLCanvasElement;
  timeline: Timeline;
  images: ImageMap;
  music: boolean;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}): Promise<RecordResult> {
  const { canvas, timeline, images, music, onProgress, signal } = opts;
  const format = pickMimeType();
  if (!format) throw new Error("This browser can't record video. Please try a recent Chrome, Edge, Firefox or Safari.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  const stream = canvas.captureStream(30);
  let ac: AudioContext | null = null;
  let stopMusic = () => {};
  let clock = (() => {
    const t0 = performance.now();
    return () => (performance.now() - t0) / 1000;
  })();

  if (music) {
    ac = new AudioContext();
    await ac.resume();
    const dest = ac.createMediaStreamDestination();
    const handle = startMusic(ac, [dest, ac.destination], timeline.theme.music, timeline.duration);
    stopMusic = handle.stop;
    for (const track of dest.stream.getAudioTracks()) stream.addTrack(track);
    const audio = ac;
    clock = () => audio.currentTime - handle.zeroTime;
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: format.mimeType,
    videoBitsPerSecond: 4_000_000,
    audioBitsPerSecond: 128_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  drawFrame(ctx, canvas.width, canvas.height, 0, timeline, images);

  const done = new Promise<RecordResult>((resolve, reject) => {
    recorder.onstop = () => {
      const type = format.mimeType.split(";")[0];
      resolve({ blob: new Blob(chunks, { type }), mimeType: type, ext: format.ext });
    };
    recorder.onerror = (e) => reject((e as unknown as { error?: Error }).error ?? new Error("Recording failed."));
  });

  recorder.start(250);

  let raf = 0;
  let finished = false;
  const cleanup = () => {
    cancelAnimationFrame(raf);
    stopMusic();
    stream.getTracks().forEach((t) => t.stop());
    setTimeout(() => ac?.close().catch(() => {}), 400);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    // Let the last frames flush before stopping.
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
      cleanup();
    }, 250);
  };

  signal?.addEventListener("abort", () => {
    finished = true;
    if (recorder.state !== "inactive") recorder.stop();
    cleanup();
  });

  const tick = () => {
    if (finished) return;
    const t = Math.max(0, clock());
    drawFrame(ctx, canvas.width, canvas.height, Math.min(t, timeline.duration), timeline, images);
    onProgress?.(Math.min(1, t / timeline.duration));
    if (t >= timeline.duration) finish();
    else raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const result = await done;
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  return result;
}
