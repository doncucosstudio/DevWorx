import type { MusicMood } from "./templates";

/**
 * A tiny procedural soundtrack: chord progression + arpeggio + pad + bass,
 * generated with Web Audio so there are no music files or licensing to
 * worry about. Every note is scheduled up front against the AudioContext
 * clock, which also keeps it in sync with the recorder.
 */

type Voice = "bell" | "pluck" | "soft" | "tremolo";

type MoodSpec = {
  bpm: number;
  root: number; // MIDI note of the key
  chords: number[][]; // semitone offsets from root, one chord per bar
  /** Indexes into the current chord (≥3 wraps up an octave), one per step. */
  pattern: number[];
  stepsPerBeat: 1 | 2;
  voice: Voice;
  pad: boolean;
  bass: "whole" | "half" | "march" | "none";
  level: number;
};

const MOODS: Record<MusicMood, MoodSpec> = {
  festive: {
    bpm: 112, root: 62, voice: "bell", pad: true, bass: "half", level: 0.5, stepsPerBeat: 2,
    chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]],
    pattern: [0, 1, 2, 3, 2, 1, 0, 2],
  },
  joyful: {
    bpm: 118, root: 60, voice: "pluck", pad: true, bass: "march", level: 0.5, stepsPerBeat: 2,
    chords: [[0, 4, 7], [7, 11, 14], [-3, 0, 4], [5, 9, 12]],
    pattern: [0, 2, 1, 3, 2, 4, 3, 2],
  },
  romantic: {
    bpm: 72, root: 63, voice: "soft", pad: true, bass: "whole", level: 0.55, stepsPerBeat: 2,
    chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 17]],
    pattern: [0, 1, 2, 3, 4, 3, 2, 1],
  },
  gentle: {
    bpm: 62, root: 60, voice: "soft", pad: true, bass: "whole", level: 0.55, stepsPerBeat: 1,
    chords: [[0, 4, 7], [-5, -1, 2, 7], [-3, 0, 4], [-7, -3, 0, 5]],
    pattern: [0, 2, 1, 3],
  },
  spooky: {
    bpm: 92, root: 57, voice: "tremolo", pad: true, bass: "half", level: 0.45, stepsPerBeat: 2,
    chords: [[0, 3, 7], [-4, 0, 3], [5, 8, 12], [7, 11, 14]],
    pattern: [0, 1, 2, 1, 3, 2, 1, 2],
  },
  warm: {
    bpm: 84, root: 60, voice: "pluck", pad: true, bass: "half", level: 0.5, stepsPerBeat: 2,
    chords: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]],
    pattern: [0, 1, 2, 3, 2, 1, 2, 3],
  },
  anthem: {
    bpm: 104, root: 58, voice: "bell", pad: true, bass: "march", level: 0.5, stepsPerBeat: 2,
    chords: [[0, 4, 7], [5, 9, 12], [0, 4, 7], [7, 11, 14]],
    pattern: [0, 1, 2, 3, 2, 3, 4, 3],
  },
};

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export type MusicHandle = { stop: () => void };

/**
 * Schedules the soundtrack for `duration` seconds into `destinations`,
 * starting at song-time `offset` (for previewing mid-video).
 * Returns the AudioContext time that corresponds to song-time 0.
 */
export function startMusic(
  ac: AudioContext,
  destinations: AudioNode[],
  mood: MusicMood,
  duration: number,
  offset = 0,
): MusicHandle & { zeroTime: number } {
  const spec = MOODS[mood];
  const now = ac.currentTime + 0.08;
  const zero = now - offset;

  const master = ac.createGain();
  const comp = ac.createDynamicsCompressor();
  master.connect(comp);
  for (const d of destinations) comp.connect(d);

  // Song-level fade in/out.
  const L = spec.level;
  master.gain.setValueAtTime(0, now);
  const fadeInEnd = zero + 1.5;
  if (fadeInEnd > now) master.gain.linearRampToValueAtTime(L, fadeInEnd);
  else master.gain.setValueAtTime(L, now);
  const fadeOutStart = Math.max(now, zero + duration - 2.5);
  master.gain.setValueAtTime(L, fadeOutStart);
  master.gain.linearRampToValueAtTime(0, Math.max(fadeOutStart + 0.1, zero + duration));

  // Simple echo "room".
  const delay = ac.createDelay(1);
  delay.delayTime.value = 60 / spec.bpm * 0.75;
  const fb = ac.createGain();
  fb.gain.value = 0.28;
  const wet = ac.createGain();
  wet.gain.value = 0.22;
  delay.connect(fb).connect(delay);
  delay.connect(wet).connect(master);

  const dry = ac.createGain();
  dry.gain.value = 1;
  dry.connect(master);
  dry.connect(delay);

  const beat = 60 / spec.bpm;
  const bar = beat * 4;
  const step = beat / spec.stepsPerBeat;
  const bars = Math.ceil(duration / bar);

  const at = (songTime: number) => zero + songTime;
  const audible = (songTime: number, len: number) => songTime + len > offset && songTime < duration;

  for (let b = 0; b < bars; b++) {
    const chord = spec.chords[b % spec.chords.length];
    const barStart = b * bar;

    if (spec.pad && audible(barStart, bar) && barStart >= offset - 0.01) {
      for (const n of chord.slice(0, 3)) pad(ac, dry, at(barStart), bar, hz(spec.root + n), 0.045);
    }

    if (spec.bass !== "none") {
      const hits = spec.bass === "whole" ? [0] : spec.bass === "half" ? [0, 2] : [0, 1, 2, 3];
      hits.forEach((beatIdx, k) => {
        const time = barStart + beatIdx * beat;
        const note = spec.bass === "march" && k % 2 === 1 ? chord[2] - 12 : chord[0];
        const len = spec.bass === "whole" ? bar : spec.bass === "half" ? beat * 2 : beat;
        if (time >= offset && audible(time, len)) bass(ac, dry, at(time), len * 0.95, hz(spec.root - 12 + note));
      });
    }

    const stepsPerBar = 4 * spec.stepsPerBeat;
    for (let i = 0; i < stepsPerBar; i++) {
      const time = barStart + i * step;
      if (time < offset || !audible(time, step)) continue;
      const idx = spec.pattern[i % spec.pattern.length];
      const note = chord[idx % chord.length] + 12 * Math.floor(idx / chord.length) + 12;
      // A little humanized dynamics.
      const vel = 0.75 + 0.25 * (i % spec.stepsPerBeat === 0 ? 1 : 0.4);
      lead(ac, dry, spec.voice, at(time), step, hz(spec.root + note), vel);
    }
  }

  // Close the song on the home chord.
  const endTime = Math.max(0, duration - 3);
  if (endTime >= offset) {
    for (const n of spec.chords[0]) lead(ac, dry, spec.voice, at(endTime), 2.5, hz(spec.root + 12 + n), 0.7);
  }

  let stopped = false;
  return {
    zeroTime: zero,
    stop() {
      if (stopped) return;
      stopped = true;
      const t = ac.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 0.15);
      setTimeout(() => {
        try {
          comp.disconnect();
        } catch {
          /* already disconnected */
        }
      }, 250);
    },
  };
}

function env(ac: AudioContext, out: AudioNode, time: number, peak: number, attack: number, hold: number, release: number) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(peak, time + attack);
  g.gain.setValueAtTime(peak, time + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, time + attack + hold + release);
  g.connect(out);
  return { node: g, end: time + attack + hold + release + 0.05 };
}

function osc(ac: AudioContext, type: OscillatorType, freq: number, out: AudioNode, start: number, end: number, detune = 0) {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  o.connect(out);
  o.start(start);
  o.stop(end);
  return o;
}

function lead(ac: AudioContext, out: AudioNode, voice: Voice, time: number, len: number, freq: number, vel: number) {
  switch (voice) {
    case "bell": {
      const e = env(ac, out, time, 0.16 * vel, 0.005, 0, 1.2);
      osc(ac, "sine", freq, e.node, time, e.end);
      const e2 = env(ac, out, time, 0.05 * vel, 0.005, 0, 0.5);
      osc(ac, "sine", freq * 2.76, e2.node, time, e2.end);
      break;
    }
    case "pluck": {
      const e = env(ac, out, time, 0.14 * vel, 0.008, 0, Math.max(0.35, len * 1.6));
      osc(ac, "triangle", freq, e.node, time, e.end);
      const e2 = env(ac, out, time, 0.04 * vel, 0.004, 0, 0.25);
      osc(ac, "sine", freq * 2, e2.node, time, e2.end);
      break;
    }
    case "soft": {
      const e = env(ac, out, time, 0.13 * vel, 0.04, len * 0.4, Math.max(1, len * 2.5));
      osc(ac, "sine", freq, e.node, time, e.end);
      const e2 = env(ac, out, time, 0.03 * vel, 0.04, 0, 0.8);
      osc(ac, "triangle", freq * 2, e2.node, time, e2.end);
      break;
    }
    case "tremolo": {
      const e = env(ac, out, time, 0.12 * vel, 0.02, len * 0.5, 0.6);
      const trem = ac.createGain();
      trem.gain.value = 0.6;
      trem.connect(e.node);
      const lfo = ac.createOscillator();
      lfo.frequency.value = 7;
      const depth = ac.createGain();
      depth.gain.value = 0.4;
      lfo.connect(depth).connect(trem.gain);
      lfo.start(time);
      lfo.stop(e.end);
      osc(ac, "triangle", freq, trem, time, e.end, -8);
      break;
    }
  }
}

function pad(ac: AudioContext, out: AudioNode, time: number, len: number, freq: number, level: number) {
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1100;
  const e = env(ac, out, time, level, Math.min(0.8, len * 0.3), len * 0.4, len * 0.6);
  filter.connect(e.node);
  osc(ac, "triangle", freq, filter, time, e.end, -6);
  osc(ac, "triangle", freq, filter, time, e.end, 6);
}

function bass(ac: AudioContext, out: AudioNode, time: number, len: number, freq: number) {
  const e = env(ac, out, time, 0.16, 0.01, len * 0.3, len * 0.7);
  osc(ac, "sine", freq, e.node, time, e.end);
}
