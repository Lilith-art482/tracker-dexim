"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  Check, Palette, RotateCcw, Circle, Hash, Sun, Moon,
  Paintbrush,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PALETTE_GROUPS,
  BG_LIGHT_PRESETS,
  BG_DARK_PRESETS,
  DEFAULT_THEME,
  type PaletteColor,
  type BgPreset,
  type ThemeSettings,
} from "@/lib/palette-colors";
import { cn } from "@/lib/utils";

const THEME_KEY = "inmotion_theme";

/* ─── Hex / HSL helpers (shared) ─── */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function generateAccentVariants(hex: string): PaletteColor {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const darkRgb = hslToRgb(hsl.h, Math.min(hsl.s + 10, 100), Math.min(hsl.l + 15, 85));
  return {
    value: "custom", label: "Свой цвет", light: hex,
    dark: rgbToHex(darkRgb.r, darkRgb.g, darkRgb.b),
    accent: hex, accentFg: hex,
  };
}

/* ─── Derive CSS vars from theme ─── */

export function applyTheme(settings: ThemeSettings) {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  // Accent
  let accentHex = settings.accent.custom;
  if (settings.accent.preset !== "custom") {
    const c = PALETTE_GROUPS.flatMap((g) => g.colors).find(
      (c) => c.value === settings.accent.preset,
    );
    if (c) accentHex = isDark ? c.dark : c.light;
  }
  root.style.setProperty("--primary", accentHex);
  root.style.setProperty("--ring", accentHex);
  root.style.setProperty("--chart-1", accentHex);
  root.style.setProperty("--sidebar-primary", accentHex);
  root.style.setProperty("--sidebar-ring", accentHex);

  // Background
  const bgPresetKey = isDark ? settings.darkBg : settings.lightBg;
  const customBg = isDark ? settings.darkBgCustom : settings.lightBgCustom;
  const presets = isDark ? BG_DARK_PRESETS : BG_LIGHT_PRESETS;
  let bgData: BgPreset;
  if (customBg) {
    const rgb = hexToRgb(customBg);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cardRgb = hslToRgb(hsl.h, Math.min(hsl.s, 15), Math.min(hsl.l + 4, 96));
    const mutedRgb = hslToRgb(hsl.h, Math.min(hsl.s, 12), isDark ? Math.min(hsl.l + 8, 25) : Math.min(hsl.l - 3, 95));
    const borderRgb = hslToRgb(hsl.h, Math.min(hsl.s, 15), isDark ? Math.min(hsl.l + 12, 30) : Math.min(hsl.l - 8, 88));
    const fgRgb = isDark
      ? hslToRgb(hsl.h, Math.min(hsl.s + 5, 20), 90)
      : hslToRgb(hsl.h, Math.min(hsl.s + 5, 20), 12);
    bgData = {
      value: "custom", label: "Custom",
      bg: customBg,
      card: rgbToHex(cardRgb.r, cardRgb.g, cardRgb.b),
      muted: rgbToHex(mutedRgb.r, mutedRgb.g, mutedRgb.b),
      border: rgbToHex(borderRgb.r, borderRgb.g, borderRgb.b),
      foreground: rgbToHex(fgRgb.r, fgRgb.g, fgRgb.b),
    };
  } else {
    bgData = presets.find((p) => p.value === bgPresetKey) || presets[0];
  }

  root.style.setProperty("--background", bgData.bg);
  root.style.setProperty("--card", bgData.card);
  root.style.setProperty("--popover", bgData.card);
  root.style.setProperty("--muted", bgData.muted);
  root.style.setProperty("--border", bgData.border);
  root.style.setProperty("--foreground", bgData.foreground);
  root.style.setProperty("--sidebar", bgData.bg);
  root.style.setProperty("--sidebar-foreground", bgData.foreground);
  root.style.setProperty("--sidebar-accent", bgData.muted);
  root.style.setProperty("--sidebar-border", bgData.border);

  // Brightness / contrast via filter
  const bc = isDark ? settings.brightness.dark : settings.brightness.light;
  const cc = isDark ? settings.contrast.dark : settings.contrast.light;
  const filters: string[] = [];
  if (bc !== 100) filters.push(`brightness(${bc / 100})`);
  if (cc !== 100) filters.push(`contrast(${cc / 100})`);
  root.style.filter = filters.length ? filters.join(" ") : "";
}

/* ─── Color Wheel (zero-rerender drag) ─── */

function ColorWheel({
  color,
  onDragMove,
  onDragEnd,
}: {
  color: string;
  onDragMove: (hex: string) => void;
  onDragEnd: (hex: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const SIZE = 200;
  const RADIUS = SIZE / 2 - 6;
  const hueRef = useRef(0);
  const satRef = useRef(0);
  const lightRef = useRef(50);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);
  const initRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = SIZE / 2, cy = SIZE / 2;
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let a = 0; a < 360; a += 0.5) {
      const s = ((a - 0.5) * Math.PI) / 180;
      const e = ((a + 0.5) * Math.PI) / 180;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, RADIUS);
      const p = hslToRgb(a, 100, 50);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.45, `rgb(${p.r},${p.g},${p.b})`);
      g.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, RADIUS, s, e); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
    }
    const sa = (hueRef.current * Math.PI) / 180;
    const sd = (satRef.current / 100) * RADIUS;
    const sx = cx + Math.cos(sa) * sd, sy = cy + Math.sin(sa) * sd;
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(0,0,0,0.1)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    const c = hslToRgb(hueRef.current, satRef.current, lightRef.current);
    ctx.fillStyle = rgbToHex(c.r, c.g, c.b); ctx.fill();
  }, []);

  const coords = useCallback((cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const x = ((cx - r.left) * (SIZE / r.width)) - SIZE / 2;
    const y = ((cy - r.top) * (SIZE / r.height)) - SIZE / 2;
    const d = Math.min(Math.sqrt(x * x + y * y), RADIUS);
    return { h: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360, s: (d / RADIUS) * 100 };
  }, []);

  const emit = useCallback((h: number, s: number, commit: boolean) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      draw();
      const rgb = hslToRgb(h, s, lightRef.current);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      if (commit) onDragEnd(hex); else onDragMove(hex);
    });
  }, [draw, onDragMove, onDragEnd]);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      const rgb = hexToRgb(color);
      const h = rgbToHsl(rgb.r, rgb.g, rgb.b);
      hueRef.current = h.h; satRef.current = h.s; lightRef.current = h.l;
      draw();
    }
  }, [color, draw]);

  useEffect(() => {
    if (!initRef.current) return;
    if (!draggingRef.current) {
      const rgb = hexToRgb(color);
      const h = rgbToHsl(rgb.r, rgb.g, rgb.b);
      hueRef.current = h.h; satRef.current = h.s; lightRef.current = h.l;
      draw();
    }
  }, [color, draw]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      const c = coords(cx, cy);
      if (c) { hueRef.current = c.h; satRef.current = c.s; emit(c.h, c.s, false); }
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      emit(hueRef.current, satRef.current, true);
    };
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [coords, emit]);

  const start = (cx: number, cy: number) => {
    draggingRef.current = true;
    const c = coords(cx, cy);
    if (c) { hueRef.current = c.h; satRef.current = c.s; emit(c.h, c.s, false); }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative rounded-full shadow-2xl" style={{ width: SIZE, height: SIZE }}>
        <canvas
          ref={canvasRef} width={SIZE} height={SIZE}
          className="rounded-full cursor-crosshair touch-none"
          style={{ width: SIZE, height: SIZE }}
          onMouseDown={(e) => start(e.clientX, e.clientY)}
          onTouchStart={(e) => start(e.touches[0].clientX, e.touches[0].clientY)}
        />
      </div>
      <div className="w-full max-w-[200px]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-12 font-medium">Яркость</span>
          <input
            type="range" min={5} max={95}
            defaultValue={lightRef.current}
            onChange={(e) => { lightRef.current = Number(e.target.value); emit(hueRef.current, satRef.current, false); }}
            onMouseUp={() => emit(hueRef.current, satRef.current, true)}
            onTouchEnd={() => emit(hueRef.current, satRef.current, true)}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Color Code Input ─── */

function ColorCodeInput({
  color,
  onChange,
}: {
  color: string;
  onChange: (hex: string) => void;
}) {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const [hexInput, setHexInput] = useState(color);
  const [rInput, setRInput] = useState(rgb.r.toString());
  const [gInput, setGInput] = useState(rgb.g.toString());
  const [bInput, setBInput] = useState(rgb.b.toString());

  useEffect(() => {
    setHexInput(color);
    const c = hexToRgb(color);
    setRInput(c.r.toString()); setGInput(c.g.toString()); setBInput(c.b.toString());
  }, [color]);

  const handleHex = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) onChange(val);
  };
  const handleRgb = (r: string, g: string, b: string) => {
    setRInput(r); setGInput(g); setBInput(b);
    const rn = parseInt(r) || 0, gn = parseInt(g) || 0, bn = parseInt(b) || 0;
    if (rn >= 0 && rn <= 255 && gn >= 0 && gn <= 255 && bn >= 0 && bn <= 255)
      onChange(rgbToHex(rn, gn, bn));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
        <div className="w-14 h-14 rounded-xl shadow-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">HEX</label>
          <div className="relative">
            <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={hexInput} onChange={(e) => handleHex(e.target.value)} className="pl-8 font-mono text-sm h-9 bg-background border-border/60" maxLength={7} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {([
          { l: "R", v: rInput, fn: (v: string) => handleRgb(v, gInput, bInput) },
          { l: "G", v: gInput, fn: (v: string) => handleRgb(rInput, v, bInput) },
          { l: "B", v: bInput, fn: (v: string) => handleRgb(rInput, gInput, v) },
        ] as const).map(({ l, v, fn }) => (
          <div key={l} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{l}</label>
            <Input type="number" min={0} max={255} value={v} onChange={(e) => fn(e.target.value)} className="font-mono text-sm h-9 text-center bg-background border-border/60" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>HSL:</span><span className="font-mono">{Math.round(hsl.h)}° {Math.round(hsl.s)}% {Math.round(hsl.l)}%</span>
      </div>
    </div>
  );
}

/* ─── Section Tabs ─── */

type SectionTab = "accent" | "light" | "dark";
const SECTION_TABS: { id: SectionTab; label: string; icon: typeof Palette }[] = [
  { id: "accent", label: "Акцент", icon: Paintbrush },
  { id: "light", label: "Светлая", icon: Sun },
  { id: "dark", label: "Тёмная", icon: Moon },
];

type PickerTab = "palette" | "wheel" | "code";
const PICKER_TABS: { id: PickerTab; label: string; icon: typeof Palette }[] = [
  { id: "palette", label: "Палитра", icon: Palette },
  { id: "wheel", label: "Круг", icon: Circle },
  { id: "code", label: "Код", icon: Hash },
];

/* ─── Main Modal ─── */

export function ThemeEditorModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<ThemeSettings>({ ...DEFAULT_THEME });
  const [section, setSection] = useState<SectionTab>("accent");
  const [picker, setPicker] = useState<PickerTab>("palette");
  const [customHex, setCustomHex] = useState(DEFAULT_THEME.accent.custom);
  const originalModeRef = useRef<string>("dark");

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(THEME_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = { ...DEFAULT_THEME, ...parsed };
        setSettings(merged);
        if (merged.accent.preset === "custom") {
          setCustomHex(merged.accent.custom);
        } else {
          const c = PALETTE_GROUPS.flatMap((g) => g.colors).find((c) => c.value === merged.accent.preset);
          if (c) setCustomHex(c.light);
        }
      }
    } catch {}
  }, []);

  // Save original mode on open, apply theme live
  useEffect(() => {
    if (open) {
      originalModeRef.current = theme || "dark";
    }
  }, [open, theme]);

  // Apply on mount and when settings change
  useEffect(() => {
    applyTheme(settings);
  }, [settings]);

  // Persist
  const save = useCallback((next: ThemeSettings) => {
    setSettings(next);
    try { localStorage.setItem(THEME_KEY, JSON.stringify(next)); } catch {}
  }, []);

  /* ─ Accent handlers ─ */
  const handleAccentPreset = useCallback((color: PaletteColor) => {
    setCustomHex(color.light);
    save({ ...settings, accent: { preset: color.value, custom: color.light } });
  }, [settings, save]);

  const handleAccentCustomMove = useCallback((hex: string) => {
    setCustomHex(hex);
    applyTheme({ ...settings, accent: { preset: "custom", custom: hex } });
  }, [settings]);

  const handleAccentCustomEnd = useCallback((hex: string) => {
    setCustomHex(hex);
    save({ ...settings, accent: { preset: "custom", custom: hex } });
  }, [settings, save]);

  /* ─ Background handlers ─ */
  const handleBgPreset = useCallback((preset: BgPreset, mode: "light" | "dark") => {
    if (mode === "light") {
      save({ ...settings, lightBg: preset.value, lightBgCustom: "" });
    } else {
      save({ ...settings, darkBg: preset.value, darkBgCustom: "" });
    }
  }, [settings, save]);

  const handleBgCustomMove = useCallback((hex: string, mode: "light" | "dark") => {
    if (mode === "light") {
      applyTheme({ ...settings, lightBg: "custom", lightBgCustom: hex });
    } else {
      applyTheme({ ...settings, darkBg: "custom", darkBgCustom: hex });
    }
  }, [settings]);

  const handleBgCustomEnd = useCallback((hex: string, mode: "light" | "dark") => {
    if (mode === "light") {
      save({ ...settings, lightBg: "custom", lightBgCustom: hex });
    } else {
      save({ ...settings, darkBg: "custom", darkBgCustom: hex });
    }
  }, [settings, save]);

  /* ─ Brightness / contrast ─ */
  const handleSlider = useCallback((key: "brightness" | "contrast", mode: "light" | "dark", val: number) => {
    const next = { ...settings, [key]: { ...settings[key], [mode]: val } };
    save(next);
  }, [settings, save]);

  /* ─ Reset ─ */
  const handleReset = useCallback(() => {
    setSettings({ ...DEFAULT_THEME });
    setCustomHex(DEFAULT_THEME.accent.custom);
    setSection("accent");
    setPicker("palette");
    setTheme("dark");
    try { localStorage.setItem(THEME_KEY, JSON.stringify(DEFAULT_THEME)); } catch {}
    applyTheme({ ...DEFAULT_THEME });
  }, [setTheme]);

  const isLight = section === "light";
  const isDark = section === "dark";
  const isAccent = section === "accent";
  const bgMode: "light" | "dark" = isLight ? "light" : "dark";
  const currentBgHex = useMemo(() => {
    if (bgMode === "light") return settings.lightBgCustom || BG_LIGHT_PRESETS.find((p) => p.value === settings.lightBg)?.bg || "#F7F7F5";
    if (bgMode === "dark") return settings.darkBgCustom || BG_DARK_PRESETS.find((p) => p.value === settings.darkBg)?.bg || "#16191F";
    return "#000";
  }, [bgMode, settings]);

  const currentBgPreset = bgMode === "light" ? settings.lightBg : bgMode === "dark" ? settings.darkBg : "";

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        // Closing without "Готово" — restore original mode
        setTheme(originalModeRef.current);
        applyTheme(settings);
      }
      onOpenChange(v);
    }}>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/40 shadow-2xl">
        <div className="p-5 pb-4">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              Настройка темы
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Section tabs */}
            <div className="flex gap-1 p-1 bg-muted/60 rounded-xl">
              {SECTION_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => {
                    setSection(tab.id);
                    setPicker("palette");
                    if (tab.id === "light") setTheme("light");
                    else if (tab.id === "dark") setTheme("dark");
                  }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200",
                      section === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Section content */}
            <div className="min-h-[280px]">

              {/* ─── Accent ─── */}
              {isAccent && (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm">
                    <div className="flex items-center gap-4 p-3.5">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl shadow-lg border border-white/20" style={{ backgroundColor: customHex }} />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: customHex }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {settings.accent.preset === "custom" ? "Свой цвет" : PALETTE_GROUPS.flatMap((g) => g.colors).find((c) => c.value === settings.accent.preset)?.label || "Цвет"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{customHex.toUpperCase()}</p>
                        <div className="flex gap-1 mt-2">
                          {[0.3, 0.5, 0.7, 0.9].map((o) => (
                            <div key={o} className="h-2.5 flex-1 rounded-full" style={{ backgroundColor: customHex, opacity: o }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Picker tabs */}
                  <PickerTabs picker={picker} setPicker={setPicker} />

                  {/* Picker content */}
                  <div className="min-h-[230px]">
                    {picker === "palette" && (
                      <PaletteGrid
                        groups={PALETTE_GROUPS}
                        selected={settings.accent.preset}
                        onSelect={handleAccentPreset}
                      />
                    )}
                    {picker === "wheel" && (
                      <div className="flex flex-col items-center py-1">
                        <ColorWheel color={customHex} onDragMove={handleAccentCustomMove} onDragEnd={handleAccentCustomEnd} />
                      </div>
                    )}
                    {picker === "code" && (
                      <div className="py-1">
                        <ColorCodeInput color={customHex} onChange={handleAccentCustomEnd} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Light / Dark background ─── */}
              {(isLight || isDark) && (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="rounded-xl border border-border/40 overflow-hidden">
                    <div className="p-4" style={{ backgroundColor: currentBgHex }}>
                      <div className="rounded-lg p-3 text-xs font-medium" style={{
                        backgroundColor: bgMode === "light" ? "#FFFFFF" : "#1E2028",
                        color: bgMode === "light" ? "#1A1A1A" : "#E8E8E8",
                        border: `1px solid ${bgMode === "light" ? "#E4E3E0" : "#2E3139"}`,
                      }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--primary, #6B8F71)" }} />
                          <span className="font-semibold">Пример</span>
                        </div>
                        <p className="text-muted-foreground text-[10px]">Так будет выглядеть фон в {bgMode === "light" ? "светлой" : "тёмной"} теме</p>
                      </div>
                    </div>
                  </div>

                  {/* Picker tabs */}
                  <PickerTabs picker={picker} setPicker={setPicker} />

                  {/* Picker content */}
                  <div className="min-h-[230px]">
                    {picker === "palette" && (
                      <BgPresetGrid
                        presets={bgMode === "light" ? BG_LIGHT_PRESETS : BG_DARK_PRESETS}
                        selected={currentBgPreset}
                        onSelect={(p) => handleBgPreset(p, bgMode)}
                      />
                    )}
                    {picker === "wheel" && (
                      <div className="flex flex-col items-center py-1">
                        <ColorWheel color={currentBgHex} onDragMove={(h) => handleBgCustomMove(h, bgMode)} onDragEnd={(h) => handleBgCustomEnd(h, bgMode)} />
                      </div>
                    )}
                    {picker === "code" && (
                      <div className="py-1">
                        <ColorCodeInput color={currentBgHex} onChange={(h) => handleBgCustomEnd(h, bgMode)} />
                      </div>
                    )}
                  </div>

                  {/* Brightness / Contrast */}
                  <div className="border-t border-border/30 pt-3 space-y-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Тонировка</p>
                    <SliderRow label="Яркость" value={bgMode === "light" ? settings.brightness.light : settings.brightness.dark} onChange={(v) => handleSlider("brightness", bgMode, v)} />
                    <SliderRow label="Контраст" value={bgMode === "light" ? settings.contrast.light : settings.contrast.dark} onChange={(v) => handleSlider("contrast", bgMode, v)} />
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground gap-1.5">
                <RotateCcw className="h-3 w-3" />Сбросить
              </Button>
              <Button size="sm" onClick={() => {
                // Save current settings and keep current mode
                try { localStorage.setItem(THEME_KEY, JSON.stringify(settings)); } catch {}
                onOpenChange(false);
              }} className="text-xs px-5">
                Готово
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Sub-components ─── */

function PickerTabs({ picker, setPicker }: { picker: PickerTab; setPicker: (v: PickerTab) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-muted/40 rounded-lg">
      {PICKER_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button key={tab.id} onClick={() => setPicker(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all duration-200",
              picker === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}>
            <Icon className="h-3 w-3" />{tab.label}
          </button>
        );
      })}
    </div>
  );
}

function PaletteGrid({
  groups,
  selected,
  onSelect,
}: {
  groups: typeof PALETTE_GROUPS;
  selected: string;
  onSelect: (c: PaletteColor) => void;
}) {
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.name}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{group.name}</p>
          <div className="grid grid-cols-5 gap-1.5">
            {group.colors.map((color) => {
              const isSel = selected === color.value;
              return (
                <button key={color.value} onClick={() => onSelect(color)}
                  className={cn(
                    "group relative flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all duration-200",
                    isSel ? "bg-muted ring-2 ring-primary ring-offset-1 ring-offset-background scale-105" : "hover:bg-muted/50 hover:scale-102",
                  )} title={color.label}>
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: color.light }} />
                    {isSel && <div className="absolute inset-0 flex items-center justify-center"><Check className="h-3.5 w-3.5 text-white drop-shadow-md" /></div>}
                  </div>
                  <span className="text-[8px] text-muted-foreground leading-tight font-medium">{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BgPresetGrid({
  presets,
  selected,
  onSelect,
}: {
  presets: BgPreset[];
  selected: string;
  onSelect: (p: BgPreset) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {presets.map((preset) => {
        const isSel = selected === preset.value;
        return (
          <button key={preset.value} onClick={() => onSelect(preset)}
            className={cn(
              "relative rounded-xl border-2 p-0 overflow-hidden transition-all duration-200 text-left",
              isSel ? "border-primary ring-1 ring-primary/20 scale-[1.02]" : "border-border/60 hover:border-border hover:scale-[1.01]",
            )}>
            <div className="h-10 w-full" style={{ backgroundColor: preset.bg }} />
            <div className="px-2.5 py-2" style={{ backgroundColor: preset.card }}>
              <p className="text-[10px] font-semibold" style={{ color: preset.foreground }}>{preset.label}</p>
              <div className="flex gap-1 mt-1">
                <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: preset.muted }} />
                <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: preset.border }} />
              </div>
            </div>
            {isSel && <div className="absolute top-1.5 right-1.5"><Check className="h-3.5 w-3.5 text-primary" /></div>}
          </button>
        );
      })}
    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 font-medium">{label}</span>
      <input
        type="range" min={70} max={130} step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary"
      />
      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{value}%</span>
    </div>
  );
}
