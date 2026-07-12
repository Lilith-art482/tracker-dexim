"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

type AudioContextType = {
  isPlaying: boolean;
  toggle: () => void;
};

const AudioCtx = createContext<AudioContextType>({
  isPlaying: false,
  toggle: () => {},
});

const STORAGE_KEY = "inmotion_ambient_enabled";

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      return next;
    });
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startAmbient();
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [isPlaying]);

  function startAmbient() {
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 0.05;
      master.connect(ctx.destination);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);
      lfo.start();

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
      });

      const melodyNotes = [262, 294, 330, 392, 440, 523, 392, 330];
      let melodyIdx = 0;

      function scheduleChime() {
        if (!ctxRef.current) return;
        const now = ctxRef.current.currentTime;
        const freq = melodyNotes[melodyIdx % melodyNotes.length];
        melodyIdx++;

        const o = ctxRef.current.createOscillator();
        o.type = "sine";
        o.frequency.value = freq;
        o.detune.value = 5;
        const g = ctxRef.current.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.035, now + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        o.connect(g);
        g.connect(master);
        o.start(now);
        o.stop(now + 2);

        const o2 = ctxRef.current.createOscillator();
        o2.type = "sine";
        o2.frequency.value = freq * 2;
        o2.detune.value = 3;
        const g2 = ctxRef.current.createGain();
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

  function stopAmbient() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
  }

  return (
    <AudioCtx.Provider value={{ isPlaying, toggle }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  return useContext(AudioCtx);
}
