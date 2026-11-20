"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Timeline } from "@/lib/compose";
import { startMusic, type MusicHandle } from "@/lib/music";
import { FORMATS, pickMimeType, recordTimeline, type Format } from "@/lib/recorder";
import { drawFrame, type ImageMap } from "@/lib/renderer";
import type { Category, Prompt } from "@/lib/templates";
import { BackLink } from "./PromptStep";

type RenderState =
  | { status: "idle" }
  | { status: "recording"; progress: number }
  | {
      status: "done";
      url: string;
      poster: string;
      blob: Blob;
      ext: string;
      source: Timeline;
      format: Format;
      music: boolean;
      photoVersion: number;
    }
  | { status: "error"; message: string };

/** The very first/last frames are a fade from/to black; show the title card instead. */
const posterTime = (tl: Timeline, t: number) => (t <= 0.01 || t >= tl.duration - 0.01 ? Math.min(2.2, tl.duration) : t);

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);

export default function CreateStep(props: {
  category: Category;
  prompt: Prompt;
  timeline: Timeline;
  images: ImageMap;
  photoVersion: number;
  to: string;
  from: string;
  message: string;
  messageEdited: boolean;
  format: Format;
  music: boolean;
  onTo: (v: string) => void;
  onFrom: (v: string) => void;
  onMessage: (v: string) => void;
  onResetMessage: () => void;
  onFormat: (f: Format) => void;
  onMusic: (v: boolean) => void;
  onBack: () => void;
}) {
  const { category, timeline, images, photoVersion, format, music } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [render, setRender] = useState<RenderState>({ status: "idle" });
  // Only ever rendered client-side (after user steps), so this is safe at render time.
  const [supported] = useState(() => pickMimeType() !== null);

  // Latest values for the animation loop without restarting it.
  const live = useRef({ timeline, images });
  useEffect(() => {
    live.current = { timeline, images };
  }, [timeline, images]);

  const loop = useRef<{ raf: number; music?: MusicHandle; ac?: AudioContext }>({ raf: 0 });
  const abort = useRef<AbortController | null>(null);

  const recording = render.status === "recording";
  const { width, height } = FORMATS[format];

  // Paint a still frame whenever something changes while paused.
  useEffect(() => {
    if (playing || recording) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawFrame(ctx, canvas.width, canvas.height, posterTime(timeline, time), timeline, images);
  }, [playing, recording, time, timeline, images, photoVersion, format]);

  const pause = useCallback(() => {
    cancelAnimationFrame(loop.current.raf);
    loop.current.music?.stop();
    loop.current.music = undefined;
    setPlaying(false);
  }, []);

  const play = useCallback(
    async (from: number) => {
      pause();
      const start = from >= timeline.duration - 0.05 ? 0 : from;
      let clock: () => number;
      if (music) {
        const ac = loop.current.ac ?? new AudioContext();
        loop.current.ac = ac;
        await ac.resume();
        const handle = startMusic(ac, [ac.destination], timeline.theme.music, timeline.duration, start);
        loop.current.music = handle;
        clock = () => ac.currentTime - handle.zeroTime;
      } else {
        const t0 = performance.now() - start * 1000;
        clock = () => (performance.now() - t0) / 1000;
      }
      setPlaying(true);
      const tick = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const { timeline: tl, images: imgs } = live.current;
        const t = Math.max(0, clock());
        if (canvas && ctx) drawFrame(ctx, canvas.width, canvas.height, Math.min(t, tl.duration), tl, imgs);
        setTime(Math.min(t, tl.duration));
        if (t >= tl.duration) {
          pause();
          return;
        }
        loop.current.raf = requestAnimationFrame(tick);
      };
      loop.current.raf = requestAnimationFrame(tick);
    },
    [music, pause, timeline.duration, timeline.theme.music],
  );

  // Stop audio and free resources on unmount.
  useEffect(() => {
    const l = loop.current;
    return () => {
      cancelAnimationFrame(l.raf);
      l.music?.stop();
      l.ac?.close().catch(() => {});
      abort.current?.abort();
    };
  }, []);

  // Revoke the previous video's object URL when it is replaced.
  const doneUrl = render.status === "done" ? render.url : null;
  useEffect(() => {
    return () => {
      if (doneUrl) URL.revokeObjectURL(doneUrl);
    };
  }, [doneUrl]);

  // Restart playback with/without music when the toggle changes mid-play.
  const toggleMusic = (v: boolean) => {
    props.onMusic(v);
    if (playing) pause();
  };

  const create = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pause();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setRender({ status: "recording", progress: 0 });
    try {
      const result = await recordTimeline({
        canvas,
        timeline,
        images,
        music,
        signal: ctrl.signal,
        onProgress: (p) => {
          setTime(p * timeline.duration);
          setRender((r) => (r.status === "recording" ? { status: "recording", progress: p } : r));
        },
      });
      const ctx = canvas.getContext("2d")!;
      drawFrame(ctx, canvas.width, canvas.height, posterTime(timeline, 0), timeline, images);
      const poster = canvas.toDataURL("image/jpeg", 0.85);
      setTime(0);
      setRender({
        status: "done",
        url: URL.createObjectURL(result.blob),
        poster,
        blob: result.blob,
        ext: result.ext,
        source: timeline,
        format,
        music,
        photoVersion,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") setRender({ status: "idle" });
      else setRender({ status: "error", message: e instanceof Error ? e.message : "Something went wrong while creating the video." });
    } finally {
      abort.current = null;
    }
  };

  const stale =
    render.status === "done" &&
    (render.source !== timeline || render.format !== format || render.music !== music || render.photoVersion !== photoVersion);
  const fileName = `keepsake-${category.id}${props.to.trim() ? "-" + slug(props.to) : ""}`;

  return (
    <section>
      <BackLink onClick={props.onBack} label="Edit people & pets" />
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold">Personalize &amp; create</h1>
      <p className="mt-2 text-muted">Fill in the details, watch the preview, then create your video.</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        {/* ── Form ── */}
        <div className="order-2 space-y-5 lg:order-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="to" label="To" value={props.to} onChange={props.onTo} placeholder="e.g. Mom, The Parkers" disabled={recording} />
            <TextField id="from" label="From" value={props.from} onChange={props.onFrom} placeholder="e.g. Sam & the kids" disabled={recording} />
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              {props.messageEdited && (
                <button type="button" className="text-xs text-muted underline" onClick={props.onResetMessage} disabled={recording}>
                  Use suggested message
                </button>
              )}
            </div>
            <textarea
              id="message"
              rows={5}
              maxLength={320}
              value={props.message}
              onChange={(e) => props.onMessage(e.target.value)}
              disabled={recording}
              className="w-full rounded-lg border border-line px-3 py-2 font-serif outline-none focus:border-brand"
            />
            <p className="mt-1 text-xs text-muted">
              Write your own words or keep ours. You can use {"{to}"}, {"{from}"} and {"{names}"}.
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Format</legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FORMATS) as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={format === f}
                  disabled={recording}
                  onClick={() => props.onFormat(f)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${format === f ? "border-brand ring-2 ring-brand" : "border-line"}`}
                >
                  <span className="block font-medium">{FORMATS[f].label}</span>
                  <span className="block text-xs text-muted">{FORMATS[f].hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={music}
              disabled={recording}
              onChange={(e) => toggleMusic(e.target.checked)}
              className="h-5 w-5 accent-[var(--brand)]"
            />
            <span>
              <span className="font-medium">Background music</span>{" "}
              <span className="text-muted">— an original {category.theme.music} tune for this occasion</span>
            </span>
          </label>
        </div>

        {/* ── Preview & output ── */}
        <div className="order-1 lg:order-2">
          <div className="rounded-2xl border border-line bg-black/90 p-2 shadow-lg">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              aria-label="Video preview"
              className="mx-auto block max-h-[70vh] w-auto max-w-full rounded-lg"
              style={{ aspectRatio: `${width} / ${height}` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => (playing ? pause() : play(time))}
              disabled={recording}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground text-background disabled:opacity-40"
              aria-label={playing ? "Pause preview" : "Play preview"}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <input
              type="range"
              min={0}
              max={timeline.duration}
              step={0.05}
              value={Math.min(time, timeline.duration)}
              disabled={recording}
              onChange={(e) => {
                const v = Number(e.target.value);
                setTime(v);
                if (playing) play(v);
              }}
              aria-label="Preview position"
              className="flex-1 accent-[var(--brand)]"
            />
            <span className="w-24 text-right text-sm tabular-nums text-muted">
              {fmtTime(time)} / {fmtTime(timeline.duration)}
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-card p-5 shadow-sm">
            {!supported ? (
              <p className="text-sm">
                This browser can&apos;t record video. Please open Keepsake in a recent version of Chrome, Edge, Firefox or Safari.
              </p>
            ) : render.status === "recording" ? (
              <div aria-live="polite">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Creating your video…</span>
                  <span className="tabular-nums">{Math.round(render.progress * 100)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-brand transition-[width]" style={{ width: `${render.progress * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  The video is recorded in real time, so this takes about {Math.ceil(timeline.duration)} seconds. Keep this tab open and
                  visible until it finishes.
                </p>
                <button type="button" onClick={() => abort.current?.abort()} className="mt-3 text-sm text-muted underline">
                  Cancel
                </button>
              </div>
            ) : render.status === "done" ? (
              <div>
                <p className="font-medium">Your video is ready 🎉</p>
                {stale && (
                  <p className="mt-1 text-sm text-muted">You&apos;ve made changes since — create it again to include them.</p>
                )}
                <video src={render.url} poster={render.poster} controls playsInline className="mt-3 w-full max-h-[50vh] rounded-lg bg-black" />
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={render.url}
                    download={`${fileName}.${render.ext}`}
                    className="rounded-full bg-brand px-5 py-2.5 font-semibold text-brand-ink shadow hover:opacity-90"
                  >
                    Download video (.{render.ext})
                  </a>
                  <ShareButton blob={render.blob} name={`${fileName}.${render.ext}`} title={`${category.name} — Keepsake`} />
                  <button type="button" onClick={create} className="rounded-full border border-line px-5 py-2.5 font-medium hover:border-brand">
                    {stale ? "Create updated video" : "Create again"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {render.status === "error" && <p className="mb-3 text-sm text-red-600">{render.message}</p>}
                <button
                  type="button"
                  onClick={create}
                  className="w-full rounded-full bg-brand px-6 py-3 text-lg font-semibold text-brand-ink shadow hover:opacity-90"
                >
                  Create video
                </button>
                <p className="mt-2 text-center text-xs text-muted">
                  About {Math.ceil(timeline.duration)} seconds · {FORMATS[format].label} · {music ? "with music" : "no music"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TextField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1 block text-sm font-medium">
        {props.label} <span className="font-normal text-muted">(optional)</span>
      </label>
      <input
        id={props.id}
        value={props.value}
        maxLength={50}
        disabled={props.disabled}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
      />
    </div>
  );
}

function ShareButton({ blob, name, title }: { blob: Blob; name: string; title: string }) {
  const file = useMemo(() => {
    const f = new File([blob], name, { type: blob.type });
    return typeof navigator !== "undefined" && navigator.canShare?.({ files: [f] }) ? f : null;
  }, [blob, name]);
  if (!file) return null;
  return (
    <button
      type="button"
      onClick={() => navigator.share({ files: [file], title }).catch(() => {})}
      className="rounded-full border border-line px-5 py-2.5 font-medium hover:border-brand"
    >
      Share…
    </button>
  );
}
