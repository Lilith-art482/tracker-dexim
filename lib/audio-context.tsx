"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

export const SOUND_TYPES = [
  { id: "ambient", label: "Мелодия", icon: "🎵" },
  { id: "rain", label: "Дождь", icon: "🌧" },
  { id: "fire", label: "Огонь", icon: "🔥" },
  { id: "wind", label: "Ветер", icon: "🌬" },
  { id: "focus", label: "Для работы", icon: "🎯" },
  { id: "relax", label: "Для отдыха", icon: "🧘" },
] as const;

export type SoundType = (typeof SOUND_TYPES)[number]["id"];

type AudioContextType = {
  isPlaying: boolean;
  toggle: () => void;
  soundType: SoundType;
  setSoundType: (type: SoundType) => void;
};

const AudioCtx = createContext<AudioContextType>({
  isPlaying: false,
  toggle: () => {},
  soundType: "ambient",
  setSoundType: () => {},
});

const ENABLED_KEY = "inmotion_ambient_enabled";
const TYPE_KEY = "inmotion_ambient_type";

function createNoiseBuffer(ctx: AudioContext, duration: number) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ENABLED_KEY) === "true";
    }
    return false;
  });
  const [soundType, setSoundTypeState] = useState<SoundType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(TYPE_KEY) as SoundType | null;
      return saved ?? "ambient";
    }
    return "ambient";
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceNodesRef = useRef<AudioNode[]>([]);

  const setSoundType = useCallback((type: SoundType) => {
    localStorage.setItem(TYPE_KEY, type);
    setSoundTypeState(type);
  }, []);

  const toggle = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      localStorage.setItem(ENABLED_KEY, next ? "true" : "false");
      return next;
    });
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startSound(soundType);
    } else {
      stopSound();
    }
    return () => stopSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, soundType]);

  function cleanupNodes() {
    sourceNodesRef.current.forEach((n) => {
      try {
        if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) {
          n.stop();
        }
      } catch {}
      try {
        n.disconnect();
      } catch {}
    });
    sourceNodesRef.current = [];
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function stopSound() {
    cleanupNodes();
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
  }

  function startSound(type: SoundType) {
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 0.06;
      master.connect(ctx.destination);

      const handlers: Record<SoundType, () => void> = {
        ambient: () => startAmbient(ctx, master),
        rain: () => startRain(ctx, master),
        fire: () => startFire(ctx, master),
        wind: () => startWind(ctx, master),
        focus: () => startFocus(ctx, master),
        relax: () => startRelax(ctx, master),
      };

      handlers[type]();

      const handleVisibility = () => {
        if (!ctxRef.current) return;
        if (document.hidden && ctxRef.current.state === "running") {
          ctxRef.current.suspend();
        } else if (!document.hidden && ctxRef.current.state === "suspended") {
          ctxRef.current.resume();
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
    } catch {
      /* audio not available */
    }
  }

  function pushNodes(...nodes: AudioNode[]) {
    sourceNodesRef.current.push(...nodes);
  }

  /* ───── AMBIENT ───── */
  function startAmbient(ctx: AudioContext, master: GainNode) {
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();
    pushNodes(lfo, lfoGain);

    const padNotes = [220, 277.18, 329.63, 440];
    padNotes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      o.detune.value = i * 2 - 3;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 3);
      o.connect(g);
      g.connect(master);
      o.start();
      pushNodes(o, g);
    });

    const melodyNotes = [262, 294, 330, 392, 440, 523, 392, 330];
    let melodyIdx = 0;

    function scheduleChime() {
      if (!ctxRef.current) return;
      const now = ctxRef.current.currentTime;
      const freq = melodyNotes[melodyIdx % melodyNotes.length];
      melodyIdx++;

      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      o.detune.value = 5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.035, now + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      o.connect(g);
      g.connect(master);
      o.start(now);
      o.stop(now + 2);

      const o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = freq * 2;
      o2.detune.value = 3;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0, now);
      g2.gain.linearRampToValueAtTime(0.012, now + 0.1);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      o2.connect(g2);
      g2.connect(master);
      o2.start(now);
      o2.stop(now + 1.5);

      timeoutRef.current = setTimeout(
        scheduleChime,
        3500 + Math.random() * 1000,
      );
    }

    timeoutRef.current = setTimeout(scheduleChime, 1500);
  }

  /* ───── RAIN ───── */
  function startRain(ctx: AudioContext, master: GainNode) {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.value = 1500;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.value = 8000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.25;

    const modLfo = ctx.createOscillator();
    modLfo.type = "sine";
    modLfo.frequency.value = 0.3;
    const modGain = ctx.createGain();
    modGain.gain.value = 0.08;
    modLfo.connect(modGain);
    modGain.connect(noiseGain.gain);
    modLfo.start();

    source.connect(hpFilter);
    hpFilter.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(master);
    source.start();

    pushNodes(source, hpFilter, lpFilter, noiseGain, modLfo, modGain);

    function scheduleDrop() {
      if (!ctxRef.current) return;
      const dropGain = ctx.createGain();
      const dropNoise = ctx.createBufferSource();
      const dropBuf = createNoiseBuffer(ctx, 0.15);
      dropNoise.buffer = dropBuf;

      const dropFilter = ctx.createBiquadFilter();
      dropFilter.type = "bandpass";
      dropFilter.frequency.value = 3000 + Math.random() * 2000;
      dropFilter.Q.value = 5;

      dropGain.gain.setValueAtTime(0, ctx.currentTime);
      dropGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.01);
      dropGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      dropNoise.connect(dropFilter);
      dropFilter.connect(dropGain);
      dropGain.connect(master);
      dropNoise.start();
      dropNoise.stop(ctx.currentTime + 0.15);

      timeoutRef.current = setTimeout(scheduleDrop, 200 + Math.random() * 800);
    }

    timeoutRef.current = setTimeout(scheduleDrop, 500);
  }

  /* ───── FIRE ───── */
  function startFire(ctx: AudioContext, master: GainNode) {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.value = 600;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.value = 80;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.15;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.6;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 80;
    lfo.connect(lfoG);
    lfoG.connect(lpFilter.frequency);
    lfo.start();

    source.connect(hpFilter);
    hpFilter.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(master);
    source.start();

    pushNodes(source, hpFilter, lpFilter, noiseGain, lfo, lfoG);

    function scheduleCrackle() {
      if (!ctxRef.current) return;
      const cGain = ctx.createGain();
      const cSource = ctx.createBufferSource();
      const buf = createNoiseBuffer(ctx, 0.04);
      cSource.buffer = buf;

      const cFilter = ctx.createBiquadFilter();
      cFilter.type = "bandpass";
      cFilter.frequency.value = 2000 + Math.random() * 3000;
      cFilter.Q.value = 2;

      cGain.gain.setValueAtTime(0, ctx.currentTime);
      cGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.005);
      cGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      cSource.connect(cFilter);
      cFilter.connect(cGain);
      cGain.connect(master);
      cSource.start();
      cSource.stop(ctx.currentTime + 0.06);

      timeoutRef.current = setTimeout(
        scheduleCrackle,
        150 + Math.random() * 400,
      );
    }

    timeoutRef.current = setTimeout(scheduleCrackle, 300);
  }

  /* ───── WIND ───── */
  function startWind(ctx: AudioContext, master: GainNode) {
    const bufferSize = ctx.sampleRate * 6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.value = 400;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.value = 3000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.18;

    const sweepLfo = ctx.createOscillator();
    sweepLfo.type = "sine";
    sweepLfo.frequency.value = 0.04;
    const sweepGain = ctx.createGain();
    sweepGain.gain.value = 2500;
    sweepLfo.connect(sweepGain);
    sweepGain.connect(lpFilter.frequency);
    sweepLfo.start();

    const gainLfo = ctx.createOscillator();
    gainLfo.type = "sine";
    gainLfo.frequency.value = 0.07;
    const gainLfoG = ctx.createGain();
    gainLfoG.gain.value = 0.06;
    gainLfo.connect(gainLfoG);
    gainLfoG.connect(noiseGain.gain);
    gainLfo.start();

    source.connect(hpFilter);
    hpFilter.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(master);
    source.start();

    pushNodes(
      source,
      hpFilter,
      lpFilter,
      noiseGain,
      sweepLfo,
      sweepGain,
      gainLfo,
      gainLfoG,
    );
  }

  /* ───── FOCUS ───── */
  function startFocus(ctx: AudioContext, master: GainNode) {
    const bufferSize = ctx.sampleRate * 6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      let val = Math.random() * 2 - 1;
      data[i] = val;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.value = 400;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.value = 50;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.12;

    source.connect(hpFilter);
    hpFilter.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(master);
    source.start();

    pushNodes(source, hpFilter, lpFilter, noiseGain);
  }

  /* ───── RELAX ───── */
  function startRelax(ctx: AudioContext, master: GainNode) {
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.01;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();
    pushNodes(lfo, lfoGain);

    const droneNotes = [110, 165, 220, 274];
    droneNotes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      o.detune.value = (i - 1) * 1.5;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 4);
      o.connect(g);
      g.connect(master);
      o.start();
      pushNodes(o, g);
    });

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 55;
    const subG = ctx.createGain();
    subG.gain.value = 0;
    subG.gain.setValueAtTime(0, ctx.currentTime);
    subG.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 5);
    sub.connect(subG);
    subG.connect(master);
    sub.start();
    pushNodes(sub, subG);
  }

  return (
    <AudioCtx.Provider value={{ isPlaying, toggle, soundType, setSoundType }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  return useContext(AudioCtx);
}
