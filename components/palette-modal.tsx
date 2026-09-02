"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, Palette, RotateCcw, Circle, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PALETTE_GROUPS, type PaletteColor } from "@/lib/palette-colors";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "inmotion_accent_color";
const CUSTOM_COLOR_KEY = "inmotion_custom_color";

const DEFAULT_COLOR: PaletteColor = {
  value: "sage",
  label: "Шалфей",
  light: "#4E6E62",
  dark: "#6a8d7e",
  accent: "#F0F5F1",
  accentFg: "#4A6B4F",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("");
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
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function generateColorVariants(hex: string): PaletteColor {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const darkRgb = hslToRgb(hsl.h, Math.min(hsl.s + 10, 100), Math.min(hsl.l + 15, 85));
  const accentRgb = hslToRgb(hsl.h, Math.min(hsl.s + 5, 100), 96);
  const accentFgRgb = hslToRgb(hsl.h, Math.min(hsl.s + 10, 100), 30);
  return {
    value: "custom", label: "Свой цвет", light: hex,
    dark: rgbToHex(darkRgb.r, darkRgb.g, darkRgb.b),
    accent: rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b),
    accentFg: rgbToHex(accentFgRgb.r, accentFgRgb.g, accentFgRgb.b),
  };
}

function applyAccent(color: PaletteColor) {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const primaryHex = isDark ? color.dark : color.light;
  root.style.setProperty("--primary", primaryHex);
  root.style.setProperty("--ring", primaryHex);
  root.style.setProperty("--chart-1", primaryHex);
  root.style.setProperty("--sidebar-primary", primaryHex);
  root.style.setProperty("--sidebar-ring", primaryHex);
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
  const SIZE = 220;
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
    ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(0,0,0,0.1)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2);
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
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-full shadow-2xl" style={{ width: SIZE, height: SIZE }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="rounded-full cursor-crosshair touch-none"
          style={{ width: SIZE, height: SIZE }}
          onMouseDown={(e) => start(e.clientX, e.clientY)}
          onTouchStart={(e) => start(e.touches[0].clientX, e.touches[0].clientY)}
        />
      </div>
      <div className="w-full max-w-[220px]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-12 font-medium">Яркость</span>
          <input
            type="range" min={5} max={95}
            defaultValue={lightRef.current}
            onChange={(e) => {
              lightRef.current = Number(e.target.value);
              emit(hueRef.current, satRef.current, false);
            }}
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
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
        <div className="w-16 h-16 rounded-xl shadow-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">HEX</label>
          <div className="relative">
            <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={hexInput} onChange={(e) => handleHex(e.target.value)} className="pl-8 font-mono text-sm h-10 bg-background border-border/60" maxLength={7} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {([
          { l: "R", v: rInput, fn: (v: string) => handleRgb(v, gInput, bInput) },
          { l: "G", v: gInput, fn: (v: string) => handleRgb(rInput, v, bInput) },
          { l: "B", v: bInput, fn: (v: string) => handleRgb(rInput, gInput, v) },
        ] as const).map(({ l, v, fn }) => (
          <div key={l} className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{l}</label>
            <Input type="number" min={0} max={255} value={v} onChange={(e) => fn(e.target.value)} className="font-mono text-sm h-10 text-center bg-background border-border/60" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>HSL:</span><span className="font-mono">{Math.round(hsl.h)}° {Math.round(hsl.s)}% {Math.round(hsl.l)}%</span>
      </div>
    </div>
  );
}

/* ─── Main Modal ─── */

type TabType = "palette" | "wheel" | "code";
const TABS = [
  { id: "palette" as TabType, label: "Палитра", icon: Palette },
  { id: "wheel" as TabType, label: "Круг", icon: Circle },
  { id: "code" as TabType, label: "Код", icon: Hash },
];

export function PaletteModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [selected, setSelected] = useState<string>(DEFAULT_COLOR.value);
  const [customColor, setCustomColor] = useState<string>(DEFAULT_COLOR.light);
  const [activeTab, setActiveTab] = useState<TabType>("palette");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedCustom = localStorage.getItem(CUSTOM_COLOR_KEY);
      if (savedCustom) setCustomColor(savedCustom);
      if (saved) {
        setSelected(saved);
        if (saved === "custom" && savedCustom) {
          applyAccent(generateColorVariants(savedCustom));
        } else {
          const c = PALETTE_GROUPS.flatMap((g) => g.colors).find((c) => c.value === saved);
          if (c) { setCustomColor(c.light); applyAccent(c); }
        }
      }
    } catch {}
  }, []);

  const handlePaletteSelect = useCallback((color: PaletteColor) => {
    setSelected(color.value);
    setCustomColor(color.light);
    applyAccent(color);
    try {
      localStorage.setItem(STORAGE_KEY, color.value);
      localStorage.removeItem(CUSTOM_COLOR_KEY);
    } catch {}
  }, []);

  const handleDragMove = useCallback((hex: string) => {
    setCustomColor(hex);
    setSelected("custom");
    const variant = generateColorVariants(hex);
    applyAccent(variant);
    try {
      localStorage.setItem(STORAGE_KEY, "custom");
      localStorage.setItem(CUSTOM_COLOR_KEY, hex);
    } catch {}
  }, []);

  const handleDragEnd = useCallback((hex: string) => {
    setCustomColor(hex);
    setSelected("custom");
    try {
      localStorage.setItem(STORAGE_KEY, "custom");
      localStorage.setItem(CUSTOM_COLOR_KEY, hex);
    } catch {}
  }, []);

  const handleReset = useCallback(() => {
    setSelected(DEFAULT_COLOR.value);
    setCustomColor(DEFAULT_COLOR.light);
    setActiveTab("palette");
    applyAccent(DEFAULT_COLOR);
    try {
      localStorage.setItem(STORAGE_KEY, DEFAULT_COLOR.value);
      localStorage.removeItem(CUSTOM_COLOR_KEY);
    } catch {}
  }, []);

  const currentPaletteName = selected === "custom"
    ? null
    : PALETTE_GROUPS.flatMap((g) => g.colors).find((c) => c.value === selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/40 shadow-2xl">
        <div className="p-6 pb-4">
          <DialogHeader className="mb-5">
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${customColor}18` }}>
                <Palette className="h-4 w-4" style={{ color: customColor }} />
              </div>
              Цвет акцента
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Preview */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
              <div className="flex items-center gap-4 p-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl shadow-lg border border-white/20" style={{ backgroundColor: customColor }} />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: customColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{currentPaletteName?.label || "Свой цвет"}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{customColor.toUpperCase()}</p>
                  <div className="flex gap-1.5 mt-2">
                    {[0.3, 0.5, 0.7, 0.9].map((o) => (
                      <div key={o} className="h-3 flex-1 rounded-full" style={{ backgroundColor: customColor, opacity: o }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/60 rounded-xl">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                      activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}>
                    <Icon className="h-3.5 w-3.5" />{tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="min-h-[260px]">
              {activeTab === "palette" && (
                <div className="space-y-4">
                  {PALETTE_GROUPS.map((group) => (
                    <div key={group.name}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">{group.name}</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {group.colors.map((color) => {
                          const isSel = selected === color.value;
                          return (
                            <button key={color.value} onClick={() => handlePaletteSelect(color)}
                              className={cn(
                                "group relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-200",
                                isSel ? "bg-muted ring-2 ring-primary ring-offset-1 ring-offset-background scale-105" : "hover:bg-muted/50 hover:scale-102",
                              )} title={color.label}>
                              <div className="relative">
                                <div className="h-9 w-9 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: color.light }} />
                                {isSel && <div className="absolute inset-0 flex items-center justify-center"><Check className="h-4 w-4 text-white drop-shadow-md" /></div>}
                              </div>
                              <span className="text-[8px] text-muted-foreground leading-tight font-medium">{color.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "wheel" && (
                <div className="flex flex-col items-center py-2">
                  <ColorWheel color={customColor} onDragMove={handleDragMove} onDragEnd={handleDragEnd} />
                </div>
              )}
              {activeTab === "code" && (
                <div className="py-1">
                  <ColorCodeInput color={customColor} onChange={handleDragEnd} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground gap-1.5">
                <RotateCcw className="h-3 w-3" />Сбросить
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)} className="text-xs px-4" style={{ backgroundColor: customColor, color: "#fff" }}>
                Готово
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
